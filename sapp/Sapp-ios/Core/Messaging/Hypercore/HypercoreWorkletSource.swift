import Foundation

// MARK: - Hypercore Worklet Source
// JavaScript source for Hypercore-based P2P messaging worklet using Autobase

/// JavaScript source for the Hypercore worklet
/// Uses: Corestore (storage), Hypercore (append-only logs), Autobase (multi-writer), Hyperswarm (P2P)
let hypercoreWorkletSource = """
// BareKit IPC for communication with Swift - set up first before any requires
const ipc = BareKit.IPC

// Helper to send error to Swift immediately
function sendErrorToSwift(error, context) {
  try {
    const json = JSON.stringify({ type: 'module-error', error: error.message || String(error), context })
    ipc.write(Buffer.from(json))
  } catch (e) {
    // If we can't even send the error, log it
    console.error('Failed to send error to Swift:', e)
  }
}

// Try to load required modules - these may not be bundled
let Hyperswarm, Corestore, Autobase, Hypercore, crypto, b4a, path
let modulesLoaded = false

try {
  Hyperswarm = require('hyperswarm')
  Corestore = require('corestore')
  Autobase = require('autobase')
  Hypercore = require('hypercore')
  crypto = require('bare-crypto')
  b4a = require('b4a')
  path = require('bare-path')
  modulesLoaded = true
} catch (moduleError) {
  // Modules not available - send error to Swift and exit gracefully
  sendErrorToSwift(moduleError, 'module-load')
  // Don't throw - let the worklet stay alive but in disabled state
}

// Global state
let store = null           // Corestore instance
let swarm = null           // Hyperswarm instance
let conversations = {}     // Map: conversationId -> { autobase, synced, peers }
let identityCore = null    // User's identity Hypercore
let userHandle = null      // Current user's handle

// Storage path (set by Swift)
let storagePath = null

// MARK: - Initialization

async function initialize(config) {
  try {
    // Check if required modules were loaded
    if (!modulesLoaded) {
      sendToSwift({
        type: 'error',
        error: 'Required P2P modules not available. Hypercore features disabled.',
        context: 'initialize',
        fatal: true
      })
      return
    }

    storagePath = config.storagePath
    userHandle = config.handle

    // Initialize Corestore for persistent storage
    store = new Corestore(storagePath)
    await store.ready()

    // Initialize identity Hypercore (stores user's conversation list)
    identityCore = store.get({ name: 'identity' })
    await identityCore.ready()

    // Initialize Hyperswarm for P2P discovery
    swarm = new Hyperswarm()

    // Handle new peer connections
    swarm.on('connection', (conn, info) => {
      const peerId = info.publicKey.toString('hex')
      handlePeerConnection(conn, peerId, info)
    })

    sendToSwift({
      type: 'initialized',
      identityKey: identityCore.key.toString('hex'),
      discoveryKey: identityCore.discoveryKey.toString('hex')
    })

    // Load existing conversations from identity core
    await loadConversationList()

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'initialize' })
  }
}

// MARK: - Conversation Management

async function createConversation(config) {
  try {
    const { conversationId, participants, isGroup, groupName } = config

    // Create a new Hypercore for this conversation
    const core = store.get({ name: `conv-${conversationId}` })
    await core.ready()

    // Create Autobase for multi-writer support
    const autobase = new Autobase({
      inputs: [core],
      localInput: core,
      autostart: true
    })

    await autobase.ready()

    // Write initialization entry
    const initEntry = {
      type: 'init',
      data: {
        conversationId,
        participants,
        createdBy: userHandle,
        createdAt: new Date().toISOString(),
        isGroup: isGroup || false,
        groupName: groupName || null
      }
    }

    await autobase.append(JSON.stringify(initEntry))

    // Store conversation metadata
    conversations[conversationId] = {
      autobase,
      core,
      synced: true,
      peers: new Set(),
      participants: new Set(participants)
    }

    // Join swarm for this conversation
    const topic = crypto.createHash('sha256').update(`sapp-conv-${conversationId}`).digest()
    swarm.join(topic, { server: true, client: true })

    // Update identity core with new conversation
    await updateConversationList(conversationId, 'add')

    sendToSwift({
      type: 'conversation-created',
      conversationId,
      hypercoreKey: core.key.toString('hex'),
      discoveryKey: core.discoveryKey.toString('hex')
    })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'createConversation' })
  }
}

async function joinConversation(config) {
  try {
    const { conversationId, hypercoreKey } = config

    // Get or create core for this conversation
    const key = hypercoreKey ? b4a.from(hypercoreKey, 'hex') : null
    const core = key
      ? store.get({ key })
      : store.get({ name: `conv-${conversationId}` })

    await core.ready()

    // Create Autobase
    const autobase = new Autobase({
      inputs: [core],
      localInput: core,
      autostart: true
    })

    await autobase.ready()

    conversations[conversationId] = {
      autobase,
      core,
      synced: false,
      peers: new Set(),
      participants: new Set()
    }

    // Join swarm
    const topic = crypto.createHash('sha256').update(`sapp-conv-${conversationId}`).digest()
    const discovery = swarm.join(topic, { server: true, client: true })

    await discovery.flushed()

    // Update identity core
    await updateConversationList(conversationId, 'add')

    sendToSwift({
      type: 'conversation-joined',
      conversationId,
      hypercoreKey: core.key.toString('hex'),
      localLength: autobase.view.length
    })

    // Sync existing entries
    await syncConversation(conversationId)

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'joinConversation' })
  }
}

async function leaveConversation(conversationId) {
  try {
    const conv = conversations[conversationId]
    if (!conv) return

    // Leave swarm topic
    const topic = crypto.createHash('sha256').update(`sapp-conv-${conversationId}`).digest()
    await swarm.leave(topic)

    // Close autobase
    await conv.autobase.close()

    // Remove from local state
    delete conversations[conversationId]

    // Update identity core
    await updateConversationList(conversationId, 'remove')

    sendToSwift({ type: 'conversation-left', conversationId })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'leaveConversation' })
  }
}

// MARK: - Message Operations

async function appendEntry(config) {
  try {
    const { conversationId, entry } = config

    const conv = conversations[conversationId]
    if (!conv) {
      throw new Error('Conversation not found')
    }

    // Append to autobase (will be synced to peers)
    await conv.autobase.append(JSON.stringify(entry))

    sendToSwift({
      type: 'entry-appended',
      conversationId,
      entryIndex: conv.autobase.view.length - 1
    })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'appendEntry' })
  }
}

async function getEntries(config) {
  try {
    const { conversationId, start, end } = config

    const conv = conversations[conversationId]
    if (!conv) {
      throw new Error('Conversation not found')
    }

    const entries = []
    const view = conv.autobase.view
    const actualEnd = end || view.length

    for (let i = start || 0; i < actualEnd; i++) {
      const entry = await view.get(i)
      if (entry) {
        entries.push({
          index: i,
          data: JSON.parse(entry.toString())
        })
      }
    }

    sendToSwift({
      type: 'entries',
      conversationId,
      entries,
      totalLength: view.length
    })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'getEntries' })
  }
}

// MARK: - Sync Operations

async function syncConversation(conversationId) {
  try {
    const conv = conversations[conversationId]
    if (!conv) return

    sendToSwift({
      type: 'sync-started',
      conversationId
    })

    // Wait for any pending updates
    await conv.autobase.update()

    const entries = []
    const view = conv.autobase.view

    for (let i = 0; i < view.length; i++) {
      const entry = await view.get(i)
      if (entry) {
        entries.push({
          index: i,
          data: JSON.parse(entry.toString())
        })
      }
    }

    conv.synced = true

    sendToSwift({
      type: 'sync-completed',
      conversationId,
      entries,
      localLength: view.length
    })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'syncConversation' })
  }
}

async function syncAll() {
  for (const conversationId of Object.keys(conversations)) {
    await syncConversation(conversationId)
  }
}

// MARK: - Peer Handling

function handlePeerConnection(conn, peerId, info) {
  // Determine which conversation this peer is for
  const topic = info.topics?.[0]?.toString('hex')

  // Replicate all relevant cores
  for (const [convId, conv] of Object.entries(conversations)) {
    const convTopic = crypto.createHash('sha256')
      .update(`sapp-conv-${convId}`)
      .digest()
      .toString('hex')

    if (!topic || topic === convTopic) {
      conv.peers.add(peerId)
      conv.core.replicate(conn)

      sendToSwift({
        type: 'peer-connected',
        conversationId: convId,
        peerId,
        peerCount: conv.peers.size
      })
    }
  }

  conn.on('close', () => {
    for (const [convId, conv] of Object.entries(conversations)) {
      if (conv.peers.has(peerId)) {
        conv.peers.delete(peerId)
        sendToSwift({
          type: 'peer-disconnected',
          conversationId: convId,
          peerId,
          peerCount: conv.peers.size
        })
      }
    }
  })

  conn.on('error', (err) => {
    sendToSwift({ type: 'peer-error', peerId, error: err.message })
  })
}

// MARK: - Identity Core

async function loadConversationList() {
  try {
    if (!identityCore || identityCore.length === 0) {
      sendToSwift({ type: 'conversation-list', conversations: [] })
      return
    }

    const lastEntry = await identityCore.get(identityCore.length - 1)
    if (lastEntry) {
      const data = JSON.parse(lastEntry.toString())
      const convIds = data.conversations || []

      sendToSwift({ type: 'conversation-list', conversations: convIds })

      // Auto-join stored conversations
      for (const convId of convIds) {
        await joinConversation({ conversationId: convId })
      }
    }

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'loadConversationList' })
  }
}

async function updateConversationList(conversationId, action) {
  try {
    let convList = []

    // Get current list
    if (identityCore.length > 0) {
      const lastEntry = await identityCore.get(identityCore.length - 1)
      if (lastEntry) {
        const data = JSON.parse(lastEntry.toString())
        convList = data.conversations || []
      }
    }

    // Update list
    if (action === 'add' && !convList.includes(conversationId)) {
      convList.push(conversationId)
    } else if (action === 'remove') {
      convList = convList.filter(id => id !== conversationId)
    }

    // Append new state
    await identityCore.append(JSON.stringify({
      handle: userHandle,
      conversations: convList,
      updatedAt: new Date().toISOString()
    }))

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'updateConversationList' })
  }
}

// MARK: - Recovery

async function recoverFromKeys(config) {
  try {
    const { identityKey, conversationKeys } = config

    // Recover identity core
    const key = b4a.from(identityKey, 'hex')
    identityCore = store.get({ key })
    await identityCore.ready()

    // Join swarm for identity core
    swarm.join(identityCore.discoveryKey, { server: true, client: true })

    // Recover each conversation
    for (const convKey of conversationKeys) {
      await joinConversation({
        conversationId: convKey.conversationId,
        hypercoreKey: convKey.hypercoreKey
      })
    }

    sendToSwift({
      type: 'recovery-complete',
      conversationCount: conversationKeys.length
    })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'recoverFromKeys' })
  }
}

// MARK: - Utility

function sendToSwift(data) {
  const json = JSON.stringify(data)
  ipc.write(Buffer.from(json))
}

function getStatus() {
  const convStatus = {}
  for (const [convId, conv] of Object.entries(conversations)) {
    convStatus[convId] = {
      synced: conv.synced,
      peerCount: conv.peers.size,
      localLength: conv.autobase?.view?.length || 0
    }
  }

  sendToSwift({
    type: 'status',
    initialized: !!store,
    conversationCount: Object.keys(conversations).length,
    conversations: convStatus
  })
}

async function shutdown() {
  try {
    // Close all conversations
    for (const conv of Object.values(conversations)) {
      await conv.autobase?.close()
    }
    conversations = {}

    // Close swarm
    if (swarm) {
      await swarm.destroy()
      swarm = null
    }

    // Close store
    if (store) {
      await store.close()
      store = null
    }

    sendToSwift({ type: 'shutdown-complete' })

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'shutdown' })
  }
}

// MARK: - IPC Command Handler

ipc.readable = (ipc) => {
  const data = ipc.read()
  if (!data) return

  try {
    const command = JSON.parse(data.toString())

    switch (command.type) {
      case 'initialize':
        initialize(command.config)
        break

      case 'create-conversation':
        createConversation(command.config)
        break

      case 'join-conversation':
        joinConversation(command.config)
        break

      case 'leave-conversation':
        leaveConversation(command.conversationId)
        break

      case 'append-entry':
        appendEntry(command)
        break

      case 'get-entries':
        getEntries(command)
        break

      case 'sync':
        syncConversation(command.conversationId)
        break

      case 'sync-all':
        syncAll()
        break

      case 'recover':
        recoverFromKeys(command.config)
        break

      case 'status':
        getStatus()
        break

      case 'shutdown':
        shutdown()
        break

      default:
        sendToSwift({ type: 'error', error: `Unknown command: ${command.type}` })
    }

  } catch (error) {
    sendToSwift({ type: 'error', error: error.message, context: 'command-handler' })
  }
}

// Handle push notifications from Swift
BareKit.on('push', (payload, reply) => {
  try {
    const data = JSON.parse(payload.toString())
    // Handle push notification (e.g., background sync request)
    if (data.type === 'background-sync') {
      syncAll().then(() => {
        reply(null, JSON.stringify({ synced: true }))
      })
    } else {
      reply(null, JSON.stringify({ received: true }))
    }
  } catch (e) {
    reply(e.message, null)
  }
})
"""
