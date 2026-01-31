import Foundation

// MARK: - BareKit Bridge
// Swift wrapper for the BareKit Objective-C framework
// This file provides Swift-friendly interfaces for BareWorklet and BareIPC

#if canImport(BareKit)
import BareKit
#endif

// MARK: - Worklet Wrapper

/// Swift wrapper for BareWorklet
final class WorkletWrapper {

    #if canImport(BareKit)
    private var worklet: BareWorklet?
    private var ipc: BareIPC?
    #endif

    private var isRunning = false
    private let messageHandler: (Data) -> Void

    init(messageHandler: @escaping (Data) -> Void) {
        self.messageHandler = messageHandler
    }

    /// Initialize and start the worklet with a P2P bundle
    func start(bundleName: String, bundleType: String = "bundle", memoryLimit: UInt = 24 * 1024 * 1024) throws {
        #if canImport(BareKit)
        // Configure worklet
        let config = BareWorkletConfiguration.default()
        config?.memoryLimit = memoryLimit

        // Set assets directory for unpacking
        if let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first {
            config?.assets = cachesDir.appendingPathComponent("barekit-assets").path
        }

        // Create worklet
        worklet = BareWorklet(configuration: config)

        // Start with bundle
        worklet?.start(bundleName, ofType: bundleType, arguments: nil)

        // Set up IPC for bidirectional communication
        guard let w = worklet else {
            throw WorkletError.initializationFailed
        }

        ipc = BareIPC(worklet: w)
        setupIPCHandlers()

        isRunning = true
        #else
        // Stub for development without BareKit
        isRunning = true
        print("[WorkletWrapper] Running in stub mode - BareKit not linked")
        #endif
    }

    /// Start with inline JavaScript source
    func start(filename: String, source: String, arguments: [String]? = nil) throws {
        #if canImport(BareKit)
        let config = BareWorkletConfiguration.default()
        config?.memoryLimit = 24 * 1024 * 1024

        worklet = BareWorklet(configuration: config)
        worklet?.start(filename, source: source, encoding: String.Encoding.utf8.rawValue, arguments: arguments)

        guard let w = worklet else {
            throw WorkletError.initializationFailed
        }

        ipc = BareIPC(worklet: w)
        setupIPCHandlers()

        isRunning = true
        #else
        isRunning = true
        print("[WorkletWrapper] Running in stub mode")
        #endif
    }

    /// Send data to worklet via IPC
    func send(_ data: Data, completion: ((Error?) -> Void)? = nil) {
        #if canImport(BareKit)
        ipc?.write(data) { error in
            completion?(error)
        }
        #else
        // Stub: simulate sending
        print("[WorkletWrapper] Stub send: \(data.count) bytes")
        completion?(nil)
        #endif
    }

    /// Push data and wait for reply (request/response pattern)
    func push(_ data: Data, completion: @escaping (Data?, Error?) -> Void) {
        #if canImport(BareKit)
        worklet?.push(data) { reply, error in
            completion(reply, error)
        }
        #else
        // Stub: return empty response
        completion(nil, nil)
        #endif
    }

    /// Suspend worklet (for background)
    func suspend() {
        #if canImport(BareKit)
        worklet?.suspend()
        #endif
    }

    /// Resume worklet
    func resume() {
        #if canImport(BareKit)
        worklet?.resume()
        #endif
    }

    /// Terminate worklet
    func terminate() {
        #if canImport(BareKit)
        ipc?.close()
        worklet?.terminate()
        ipc = nil
        worklet = nil
        #endif
        isRunning = false
    }

    var running: Bool { isRunning }

    /// Returns true if running in stub mode (BareKit not available)
    var isStubMode: Bool {
        #if canImport(BareKit)
        return false
        #else
        return true
        #endif
    }

    // MARK: - Private

    #if canImport(BareKit)
    private func setupIPCHandlers() {
        // Set up readable callback to receive messages from worklet
        ipc?.readable = { [weak self] ipc in
            if let data = ipc.read() {
                self?.messageHandler(data)
            }
        }
    }
    #endif
}

// MARK: - Worklet Errors

enum WorkletError: Error, LocalizedError {
    case initializationFailed
    case notRunning
    case ipcError(String)

    var errorDescription: String? {
        switch self {
        case .initializationFailed:
            return "Failed to initialize BareKit worklet"
        case .notRunning:
            return "Worklet is not running"
        case .ipcError(let message):
            return "IPC error: \(message)"
        }
    }
}

// MARK: - P2P Worklet Source

/// JavaScript source for P2P messaging worklet using Hyperswarm
let p2pWorkletSource = """
const Hyperswarm = require('hyperswarm')
const crypto = require('bare-crypto')
const b4a = require('b4a')

// BareKit IPC for communication with Swift
const ipc = BareKit.IPC

// Store connected peers
const peers = new Map()
let swarm = null

// Initialize swarm
function initSwarm(topic) {
  swarm = new Hyperswarm()

  // Join the topic
  const discovery = swarm.join(crypto.createHash('sha256').update(topic).digest(), {
    server: true,
    client: true
  })

  discovery.flushed().then(() => {
    sendToSwift({ type: 'ready', topic })
  })

  swarm.on('connection', (conn, info) => {
    const peerId = info.publicKey.toString('hex')
    peers.set(peerId, conn)

    sendToSwift({ type: 'peer-connected', peerId })

    conn.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        sendToSwift({ type: 'message', peerId, message })
      } catch (e) {
        sendToSwift({ type: 'data', peerId, data: data.toString('base64') })
      }
    })

    conn.on('close', () => {
      peers.delete(peerId)
      sendToSwift({ type: 'peer-disconnected', peerId })
    })

    conn.on('error', (err) => {
      sendToSwift({ type: 'error', peerId, error: err.message })
    })
  })
}

// Send message to specific peer
function sendToPeer(peerId, message) {
  const conn = peers.get(peerId)
  if (conn) {
    conn.write(JSON.stringify(message))
    return true
  }
  return false
}

// Broadcast to all peers
function broadcast(message) {
  const data = JSON.stringify(message)
  for (const conn of peers.values()) {
    conn.write(data)
  }
}

// Send data to Swift via IPC
function sendToSwift(data) {
  const json = JSON.stringify(data)
  ipc.write(Buffer.from(json))
}

// Listen for commands from Swift
ipc.readable = (ipc) => {
  const data = ipc.read()
  if (!data) return

  try {
    const command = JSON.parse(data.toString())

    switch (command.type) {
      case 'init':
        initSwarm(command.topic || 'sapp-p2p-default')
        break

      case 'send':
        const sent = sendToPeer(command.peerId, command.message)
        sendToSwift({ type: 'send-result', success: sent, messageId: command.messageId })
        break

      case 'broadcast':
        broadcast(command.message)
        sendToSwift({ type: 'broadcast-result', success: true })
        break

      case 'disconnect':
        const conn = peers.get(command.peerId)
        if (conn) {
          conn.destroy()
          peers.delete(command.peerId)
        }
        break

      case 'shutdown':
        if (swarm) {
          swarm.destroy()
        }
        break
    }
  } catch (e) {
    sendToSwift({ type: 'error', error: e.message })
  }
}

// Handle push notifications from Swift
BareKit.on('push', (payload, reply) => {
  try {
    const data = JSON.parse(payload.toString())
    // Handle push notification
    reply(null, JSON.stringify({ received: true }))
  } catch (e) {
    reply(e.message, null)
  }
})
"""
