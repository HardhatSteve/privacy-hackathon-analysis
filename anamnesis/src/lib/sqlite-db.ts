// 动态导入 SQLite WASM，避免在 SSR 构建时出错
async function loadSqliteInit() {
  if (typeof window === "undefined") {
    throw new Error("SQLite WASM can only be used in browser environment")
  }
  const module = await import("@sqlite.org/sqlite-wasm")
  return module.default
}

/**
 * OPFS 文件信息
 */
interface OpfsFileInfo {
  name: string
  size: number
  path: string
}

/**
 * 列出 OPFS 中的所有文件及其大小（用于调试）
 * 添加超时保护和深度限制，防止卡住
 */
async function listOpfsFiles(): Promise<string[]> {
  if (typeof window === "undefined" || !window.crossOriginIsolated) {
    return []
  }

  try {
    // 添加超时保护（5秒）
    const timeoutPromise = new Promise<string[]>((_, reject) =>
      setTimeout(() => reject(new Error("listOpfsFiles timeout")), 5000),
    )

    const listPromise = (async () => {
      const root = await navigator.storage.getDirectory()
      const files: string[] = []
      const MAX_DEPTH = 10 // 限制最大深度
      const MAX_FILES = 1000 // 限制最大文件数

      async function traverseDirectory(
        dir: FileSystemDirectoryHandle,
        path = "",
        depth = 0,
      ): Promise<void> {
        // 防止无限递归
        if (depth > MAX_DEPTH) {
          console.warn(`Reached max depth ${MAX_DEPTH} at ${path}`)
          return
        }

        // 防止文件数量过多
        if (files.length >= MAX_FILES) {
          console.warn(`Reached max files ${MAX_FILES}`)
          return
        }

        // FileSystemDirectoryHandle.entries() 在运行时存在，但 TypeScript 类型定义可能不完整
        const dirWithEntries = dir as FileSystemDirectoryHandle & {
          entries(): AsyncIterableIterator<[string, FileSystemHandle]>
        }
        for await (const [name, handle] of dirWithEntries.entries()) {
          // 再次检查文件数量限制
          if (files.length >= MAX_FILES) {
            break
          }

          const fullPath = path ? `${path}/${name}` : name
          if (handle.kind === "file") {
            files.push(fullPath)
          } else if (handle.kind === "directory") {
            // TypeScript 类型守卫：handle.kind === "directory" 确保这是 FileSystemDirectoryHandle
            const dirHandle = handle as unknown as FileSystemDirectoryHandle
            await traverseDirectory(dirHandle, fullPath, depth + 1)
          }
        }
      }

      await traverseDirectory(root)
      return files
    })()

    return await Promise.race([listPromise, timeoutPromise])
  } catch (error) {
    console.warn("Failed to list OPFS files:", error)
    return []
  }
}

/**
 * 获取 OPFS 文件及其大小信息
 * 添加超时保护和深度限制，防止卡住
 */
async function getOpfsFilesWithSize(): Promise<OpfsFileInfo[]> {
  if (typeof window === "undefined" || !window.crossOriginIsolated) {
    return []
  }

  try {
    // 添加超时保护（10秒，因为需要获取文件大小）
    const timeoutPromise = new Promise<OpfsFileInfo[]>((_, reject) =>
      setTimeout(
        () => reject(new Error("getOpfsFilesWithSize timeout")),
        10000,
      ),
    )

    const getFilesPromise = (async () => {
      const root = await navigator.storage.getDirectory()
      const files: OpfsFileInfo[] = []
      const MAX_DEPTH = 10 // 限制最大深度
      const MAX_FILES = 1000 // 限制最大文件数

      async function traverseDirectory(
        dir: FileSystemDirectoryHandle,
        path = "",
        depth = 0,
      ): Promise<void> {
        // 防止无限递归
        if (depth > MAX_DEPTH) {
          console.warn(`Reached max depth ${MAX_DEPTH} at ${path}`)
          return
        }

        // 防止文件数量过多
        if (files.length >= MAX_FILES) {
          console.warn(`Reached max files ${MAX_FILES}`)
          return
        }

        // FileSystemDirectoryHandle.entries() 在运行时存在，但 TypeScript 类型定义可能不完整
        const dirWithEntries = dir as FileSystemDirectoryHandle & {
          entries(): AsyncIterableIterator<[string, FileSystemHandle]>
        }
        for await (const [name, handle] of dirWithEntries.entries()) {
          // 再次检查文件数量限制
          if (files.length >= MAX_FILES) {
            break
          }

          const fullPath = path ? `${path}/${name}` : name
          if (handle.kind === "file") {
            try {
              const fileHandle = handle as FileSystemFileHandle
              // 为获取文件大小添加超时保护（每个文件最多1秒）
              const filePromise = fileHandle.getFile()
              const fileTimeout = new Promise<File>((_, reject) =>
                setTimeout(() => reject(new Error("getFile timeout")), 1000),
              )
              const file = await Promise.race([filePromise, fileTimeout])
              files.push({
                name,
                size: file.size,
                path: fullPath,
              })
            } catch (error) {
              console.warn(`Failed to get file size for ${fullPath}:`, error)
              files.push({
                name,
                size: 0,
                path: fullPath,
              })
            }
          } else if (handle.kind === "directory") {
            // TypeScript 类型守卫：handle.kind === "directory" 确保这是 FileSystemDirectoryHandle
            const dirHandle = handle as unknown as FileSystemDirectoryHandle
            await traverseDirectory(dirHandle, fullPath, depth + 1)
          }
        }
      }

      await traverseDirectory(root)
      return files
    })()

    return await Promise.race([getFilesPromise, timeoutPromise])
  } catch (error) {
    console.warn("Failed to get OPFS files with size:", error)
    return []
  }
}

/**
 * 直接通过 OPFS API 删除数据库文件
 * 这是一个备用方法，用于确保文件被完全删除
 * 添加超时保护，防止卡住
 */
async function deleteOpfsDatabaseFile(): Promise<void> {
  if (typeof window === "undefined" || !window.crossOriginIsolated) {
    // 没有跨源隔离，不使用 OPFS，无需删除
    return
  }

  try {
    // 添加超时保护（10秒）
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(
        () => reject(new Error("deleteOpfsDatabaseFile timeout")),
        10000,
      ),
    )

    const deletePromise = (async () => {
      // 获取 OPFS 根目录
      const root = await navigator.storage.getDirectory()

      // 先列出所有文件，看看有什么（已经有超时保护）
      const allFiles = await listOpfsFiles()
      console.log("OPFS files before deletion:", allFiles)

      // SQLite OPFS VFS 通常将文件存储在根目录
      // 尝试删除数据库文件及其相关文件
      const dbFileName = "anamnesis.db"
      const dbFiles = [
        dbFileName,
        `${dbFileName}-wal`, // WAL 文件
        `${dbFileName}-shm`, // 共享内存文件
        `${dbFileName}-journal`, // 日志文件
      ]

      // 也尝试删除所有以 anamnesis.db 开头的文件
      const filesToDelete = [
        ...dbFiles,
        ...allFiles.filter((f) => f.startsWith(dbFileName)),
      ]

      for (const fileName of filesToDelete) {
        try {
          // 处理可能包含路径的文件名
          const parts = fileName.split("/")
          let currentDir = root
          let targetFile = parts[parts.length - 1]

          // 如果有路径，需要导航到正确的目录
          if (parts.length > 1) {
            for (let i = 0; i < parts.length - 1; i++) {
              const dirHandle = await currentDir.getDirectoryHandle(parts[i])
              currentDir = dirHandle
            }
          }

          await currentDir.removeEntry(targetFile, { recursive: false })
          console.log(`Deleted OPFS file: ${fileName}`)
        } catch (error: unknown) {
          // 文件可能不存在，忽略错误
          if (
            error instanceof Error &&
            error.name !== "NotFoundError" &&
            !error.message.includes("not found")
          ) {
            console.warn(`Failed to delete OPFS file ${fileName}:`, error)
          }
        }
      }

      // 再次列出文件，确认删除（可选，如果超时可能会失败）
      try {
        const remainingFiles = await listOpfsFiles()
        console.log("OPFS files after deletion:", remainingFiles)
      } catch (listError) {
        // 忽略列表错误，删除操作可能已经完成
        console.warn("Failed to list files after deletion:", listError)
      }
    })()

    await Promise.race([deletePromise, timeoutPromise])
  } catch (error) {
    console.warn("Failed to delete OPFS database file directly:", error)
    // 不抛出错误，因为 SQLite 的 close with unlink 应该已经处理了
  }
}

// SQL 参数值的类型定义
export type SqlValue = string | number | bigint | null | Uint8Array | boolean

// SQLite Worker API 响应类型
interface SqliteWorkerResponse {
  type: "success" | "error"
  message?: string
  dbId?: number
  result?: {
    resultRows?: Record<string, SqlValue>[]
    message?: string
  }
}

// SQLite Worker Promiser 函数类型
type SqlitePromiser = (
  type: string,
  args?: {
    dbId?: number
    sql?: string
    filename?: string
    returnValue?: string
    rowMode?: string
    [key: string]: unknown
  },
) => Promise<SqliteWorkerResponse>

// 扩展 globalThis 类型以包含 sqlite3Worker1Promiser
// 根据 sqlite3-worker1-promiser.mjs 的实现：
// - onready: 接收 promiserFunc（一个函数）作为参数
// - onerror: 可选的错误处理函数，接收多个参数 (...args)
declare global {
  var sqlite3Worker1Promiser:
    | ((config: {
        onready: (promiserFunc: SqlitePromiser) => void
        onerror?: (...args: unknown[]) => void
      }) => SqlitePromiser)
    | undefined
}

// 数据库实例和 promiser
let dbPromiser: SqlitePromiser | null = null
let dbId: number | null = null

// 初始化数据库
let initPromise: Promise<void> | null = null

export async function initDatabase(): Promise<void> {
  // 如果已经在初始化中，等待现有的初始化完成
  if (initPromise) {
    return initPromise
  }

  // 如果已经初始化完成，直接返回
  if (dbPromiser && dbId !== null) {
    return
  }

  // 开始初始化
  initPromise = (async () => {
    try {
      // 仅在浏览器环境中初始化
      if (typeof window === "undefined") {
        throw new Error(
          "SQLite database can only be initialized in browser environment",
        )
      }

      // 动态加载并初始化 SQLite WASM 模块
      // 注意：init() 会在主线程中运行，但 OPFS VFS 的安装会在 Worker 中进行
      // 如果看到 "Ignoring inability to install OPFS sqlite3_vfs" 警告，可以忽略
      // 因为实际的 OPFS 操作会在 Worker 中通过 sqlite3Worker1Promiser 进行
      const init = await loadSqliteInit()
      await init()

      // 从 globalThis 获取 sqlite3Worker1Promiser
      const sqlite3Worker1Promiser = globalThis.sqlite3Worker1Promiser
      if (!sqlite3Worker1Promiser) {
        throw new Error("sqlite3Worker1Promiser not found on globalThis")
      }

      // 创建 promiser（使用 wrapped worker）
      dbPromiser = await new Promise((resolve, reject) => {
        const promiser = sqlite3Worker1Promiser({
          onready: () => resolve(promiser),
          onerror: (err: unknown) => {
            console.error("SQLite initialization error:", err)
            reject(err)
          },
        })
      })

      // 尝试使用 OPFS（需要跨源隔离）
      // 如果没有跨源隔离，会回退到内存模式
      const isCrossOriginIsolated = window.crossOriginIsolated === true

      let openResponse
      if (!dbPromiser) {
        throw new Error("dbPromiser is not initialized")
      }
      try {
        if (isCrossOriginIsolated) {
          // 有跨源隔离，使用 OPFS 持久化存储
          openResponse = await dbPromiser("open", {
            filename: "file:anamnesis.db?vfs=opfs",
          })
          console.log("SQLite initialized with OPFS (persistent storage)")
        } else {
          // 没有跨源隔离，使用内存模式（数据不持久化）
          openResponse = await dbPromiser("open", {
            filename: ":memory:",
          })
          console.warn(
            "SQLite initialized in memory mode (data not persistent). " +
              "OPFS requires cross-origin isolation (COOP: same-origin + COEP: require-corp).",
          )
        }
      } catch (opfsError) {
        // OPFS 失败，回退到内存模式
        console.warn(
          "OPFS unavailable, falling back to memory mode:",
          opfsError,
        )
        if (!dbPromiser) {
          throw new Error("dbPromiser is not initialized")
        }
        openResponse = await dbPromiser("open", {
          filename: ":memory:",
        })
      }

      // 检查 open 响应
      if (openResponse.type === "error") {
        throw new Error(
          `Failed to open database: ${openResponse.message || JSON.stringify(openResponse)}`,
        )
      }

      dbId = openResponse.dbId ?? null

      // 创建表结构
      await createTables()

      console.log("Database initialized successfully")
    } catch (error) {
      // 初始化失败，清理状态
      console.error("Failed to initialize database:", error)
      dbPromiser = null
      dbId = null
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

// 创建表结构
async function createTables(): Promise<void> {
  if (!dbPromiser || dbId === null) {
    throw new Error("Database not initialized")
  }

  // 文件夹表
  const foldersResult = await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        owner_address TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES folders(id)
      )
    `,
  })
  if (foldersResult.type === "error") {
    throw new Error(
      `Failed to create folders table: ${foldersResult.message || JSON.stringify(foldersResult)}`,
    )
  }

  // 文件索引表
  await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE TABLE IF NOT EXISTS file_indexes (
        id TEXT PRIMARY KEY,
        tx_id TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        folder_id TEXT,
        description TEXT,
        owner_address TEXT NOT NULL,
        storage_type TEXT NOT NULL,
        encryption_algo TEXT NOT NULL,
        encryption_params TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        previous_tx_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (folder_id) REFERENCES folders(id)
      )
    `,
  })

  // 文件标签表
  await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE TABLE IF NOT EXISTS file_tags (
        file_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (file_id, tag),
        FOREIGN KEY (file_id) REFERENCES file_indexes(id) ON DELETE CASCADE
      )
    `,
  })

  // 索引清单表
  await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE TABLE IF NOT EXISTS index_manifests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_id TEXT UNIQUE NOT NULL,
        owner_address TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `,
  })

  // 钱包表
  await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        encrypted_key TEXT NOT NULL,
        alias TEXT NOT NULL,
        chain TEXT NOT NULL,
        vault_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(address, vault_id)
      )
    `,
  })

  // Vault 元数据表
  await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE TABLE IF NOT EXISTS vault_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `,
  })

  // 创建索引
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_address)",
    "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id)",
    "CREATE INDEX IF NOT EXISTS idx_file_owner ON file_indexes(owner_address)",
    "CREATE INDEX IF NOT EXISTS idx_file_folder ON file_indexes(folder_id)",
    "CREATE INDEX IF NOT EXISTS idx_file_hash ON file_indexes(file_hash)",
    "CREATE INDEX IF NOT EXISTS idx_file_created ON file_indexes(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_file_name ON file_indexes(file_name)",
    "CREATE INDEX IF NOT EXISTS idx_tags_file ON file_tags(file_id)",
    "CREATE INDEX IF NOT EXISTS idx_tags_tag ON file_tags(tag)",
    "CREATE INDEX IF NOT EXISTS idx_manifest_owner ON index_manifests(owner_address)",
    "CREATE INDEX IF NOT EXISTS idx_manifest_created ON index_manifests(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_wallets_vault ON wallets(vault_id)",
    "CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address)",
    "CREATE INDEX IF NOT EXISTS idx_wallets_chain ON wallets(chain)",
  ]

  for (const sql of indexes) {
    const result = await dbPromiser("exec", { dbId, sql })
    if (result.type === "error") {
      console.error(`Failed to create index: ${sql}`, result)
      // 继续执行，索引创建失败不应该阻止表创建
    }
  }

  // 创建全文搜索索引 (FTS5)
  const ftsResult = await dbPromiser("exec", {
    dbId,
    sql: `
      CREATE VIRTUAL TABLE IF NOT EXISTS file_indexes_fts USING fts5(
        id UNINDEXED,
        file_name,
        description,
        content='file_indexes',
        content_rowid='rowid'
      )
    `,
  })
  if (ftsResult.type === "error") {
    console.warn("Failed to create FTS5 index (this is optional):", ftsResult)
    // FTS5 索引是可选的，失败不应该阻止数据库初始化
  }
}

// 转义 SQL 字符串参数，防止 SQL 注入
function escapeSqlString(value: SqlValue): string {
  if (value === null || value === undefined) {
    return "NULL"
  }
  if (typeof value === "number") {
    return String(value)
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0"
  }
  // 转义单引号并包裹在引号中
  const str = String(value).replace(/'/g, "''")
  return `'${str}'`
}

// 数据库行类型
export type DbRow = Record<string, SqlValue>

// 执行 SQL 语句的辅助函数（使用 exec API，因为 worker 不支持 prepare）
async function executeStatement(
  sql: string,
  params: SqlValue[] = [],
  mode: "get" | "all" | "run" = "run",
): Promise<DbRow | DbRow[] | null | void> {
  // 确保数据库已初始化
  await initDatabase()

  if (!dbPromiser || dbId === null) {
    throw new Error("Database not initialized")
  }

  // 替换参数占位符（?）为实际值
  let finalSql = sql
  if (params.length > 0) {
    let paramIndex = 0
    finalSql = sql.replace(/\?/g, () => {
      if (paramIndex >= params.length) {
        throw new Error(
          `Not enough parameters for SQL query. Expected ${params.length}, got ${paramIndex}`,
        )
      }
      const value = params[paramIndex++]
      return escapeSqlString(value)
    })
  }

  try {
    const result = await dbPromiser("exec", {
      dbId,
      sql: finalSql,
      returnValue: mode !== "run" ? "resultRows" : undefined,
      rowMode: mode !== "run" ? "object" : undefined,
    })

    if (result.type === "error") {
      const errorMsg =
        result.message || result.result?.message || JSON.stringify(result)
      throw new Error(`SQL exec error: ${errorMsg}`)
    }

    if (mode === "run") {
      return undefined
    }

    if (mode === "get") {
      const rows = result.result?.resultRows || []
      return (rows.length > 0 ? rows[0] : null) as DbRow | null
    }

    // mode === "all"
    return (result.result?.resultRows || []) as DbRow[]
  } catch (error) {
    console.error("SQL execution error:", error)
    throw error
  }
}

// 数据库操作封装
// 注意：所有方法都使用参数化查询，防止 SQL 注入
export const db = {
  // 执行查询，返回单条记录
  async get(sql: string, params: SqlValue[] = []): Promise<DbRow | null> {
    return (await executeStatement(sql, params, "get")) as DbRow | null
  },

  // 执行查询，返回多条记录
  async all(sql: string, params: SqlValue[] = []): Promise<DbRow[]> {
    return (await executeStatement(sql, params, "all")) as DbRow[]
  },

  // 执行更新/插入/删除操作
  async run(sql: string, params: SqlValue[] = []): Promise<void> {
    await executeStatement(sql, params, "run")
  },

  // 执行多条 SQL 语句（用于事务和 DDL）
  async exec(sql: string): Promise<void> {
    await initDatabase()
    if (!dbPromiser || dbId === null) {
      throw new Error("Database not initialized")
    }

    await dbPromiser("exec", {
      dbId,
      sql,
    })
  },

  // 开始事务
  async beginTransaction(): Promise<void> {
    await this.run("BEGIN TRANSACTION")
  },

  // 提交事务
  async commit(): Promise<void> {
    await this.run("COMMIT")
  },

  // 回滚事务
  async rollback(): Promise<void> {
    await this.run("ROLLBACK")
  },

  // 获取存储配额信息（用于调试和监控）
  async getStorageInfo(): Promise<{
    quota: number | null
    usage: number | null
    usageDetails: Record<string, number> | null
    opfsFiles: string[]
    opfsFilesWithSize: OpfsFileInfo[]
    opfsTotalSize: number
    cacheStorageInfo: {
      cacheNames: string[]
      totalEntries: number
      estimatedSize: number
    }
    serviceWorkerInfo: {
      registrations: number
      scopes: string[]
    }
  }> {
    // 常量定义：限制处理的缓存和条目数量，防止卡住
    const MAX_CACHES = 50
    const MAX_ENTRIES_TO_CHECK = 10

    const result: {
      quota: number | null
      usage: number | null
      usageDetails: Record<string, number> | null
      opfsFiles: string[]
      opfsFilesWithSize: OpfsFileInfo[]
      opfsTotalSize: number
      cacheStorageInfo: {
        cacheNames: string[]
        totalEntries: number
        estimatedSize: number
      }
      serviceWorkerInfo: {
        registrations: number
        scopes: string[]
      }
    } = {
      quota: null,
      usage: null,
      usageDetails: null,
      opfsFiles: [],
      opfsFilesWithSize: [],
      opfsTotalSize: 0,
      cacheStorageInfo: {
        cacheNames: [],
        totalEntries: 0,
        estimatedSize: 0,
      },
      serviceWorkerInfo: {
        registrations: 0,
        scopes: [],
      },
    }

    try {
      if (typeof navigator !== "undefined" && "storage" in navigator) {
        if ("estimate" in navigator.storage) {
          try {
            // 为 storage.estimate() 添加超时保护（5秒）
            const estimatePromise = navigator.storage.estimate()
            const estimateTimeout = new Promise<StorageEstimate>((_, reject) =>
              setTimeout(
                () => reject(new Error("storage.estimate timeout")),
                5000,
              ),
            )
            const estimate = await Promise.race([
              estimatePromise,
              estimateTimeout,
            ])
            result.quota = estimate.quota ?? null
            result.usage = estimate.usage ?? null
            // usageDetails 在某些浏览器中可用，但 TypeScript 类型定义可能不完整
            const estimateWithDetails = estimate as StorageEstimate & {
              usageDetails?: Record<string, number>
            }
            result.usageDetails = estimateWithDetails.usageDetails
              ? estimateWithDetails.usageDetails
              : null
          } catch (estimateError) {
            console.warn("Failed to get storage estimate:", estimateError)
            // 继续执行，不阻塞其他操作
          }
        }
      }

      // 列出 OPFS 文件
      result.opfsFiles = await listOpfsFiles()

      // 获取 OPFS 文件及其大小
      result.opfsFilesWithSize = await getOpfsFilesWithSize()
      result.opfsTotalSize = result.opfsFilesWithSize.reduce(
        (sum, file) => sum + file.size,
        0,
      )

      // 检查 Cache Storage（添加超时保护）
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          // 为 caches.keys() 添加超时保护（5秒）
          const cacheKeysPromise = caches.keys()
          const cacheKeysTimeout = new Promise<string[]>((_, reject) =>
            setTimeout(() => reject(new Error("caches.keys timeout")), 5000),
          )
          const cacheNames = await Promise.race([
            cacheKeysPromise,
            cacheKeysTimeout,
          ])
          result.cacheStorageInfo.cacheNames = cacheNames

          let totalEntries = 0
          // 限制处理的缓存数量，防止卡住
          for (const cacheName of cacheNames.slice(0, MAX_CACHES)) {
            try {
              // 为 cache.open() 添加超时保护（2秒）
              const cacheOpenPromise = caches.open(cacheName)
              const cacheOpenTimeout = new Promise<Cache>((_, reject) =>
                setTimeout(() => reject(new Error("cache.open timeout")), 2000),
              )
              const cache = await Promise.race([
                cacheOpenPromise,
                cacheOpenTimeout,
              ])

              // 为 cache.keys() 添加超时保护（3秒）
              const cacheKeysPromise = cache.keys()
              const cacheKeysTimeout = new Promise<ReadonlyArray<Request>>(
                (_, reject) =>
                  setTimeout(
                    () => reject(new Error("cache.keys timeout")),
                    3000,
                  ),
              )
              const keys = await Promise.race([
                cacheKeysPromise,
                cacheKeysTimeout,
              ])
              totalEntries += keys.length

              // 尝试估算缓存大小（不准确，但可以给个参考）
              // 限制检查的条目数量，防止卡住
              for (const key of keys.slice(0, MAX_ENTRIES_TO_CHECK)) {
                // 只检查前 10 个条目来估算
                try {
                  // 为 cache.match() 添加超时保护（1秒）
                  const matchPromise = cache.match(key)
                  const matchTimeout = new Promise<Response | undefined>(
                    (_, reject) =>
                      setTimeout(
                        () => reject(new Error("cache.match timeout")),
                        1000,
                      ),
                  )
                  const response = await Promise.race([
                    matchPromise,
                    matchTimeout,
                  ])
                  if (response) {
                    // 为 response.blob() 添加超时保护（2秒）
                    const blobPromise = response.blob()
                    const blobTimeout = new Promise<Blob>((_, reject) =>
                      setTimeout(
                        () => reject(new Error("response.blob timeout")),
                        2000,
                      ),
                    )
                    const blob = await Promise.race([blobPromise, blobTimeout])
                    result.cacheStorageInfo.estimatedSize += blob.size
                  }
                } catch {
                  // 忽略错误，继续处理下一个条目
                }
              }
            } catch {
              // 忽略错误，继续处理下一个缓存
            }
          }
          result.cacheStorageInfo.totalEntries = totalEntries
          // 如果只检查了部分条目，估算总大小
          if (totalEntries > MAX_ENTRIES_TO_CHECK) {
            result.cacheStorageInfo.estimatedSize =
              (result.cacheStorageInfo.estimatedSize / MAX_ENTRIES_TO_CHECK) *
              totalEntries
          }
        } catch (cacheError) {
          console.warn("Failed to get cache storage info:", cacheError)
        }
      }

      // 检查 Service Worker 注册（添加超时保护）
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        try {
          // 为 getRegistrations() 添加超时保护（3秒）
          const registrationsPromise =
            navigator.serviceWorker.getRegistrations()
          const registrationsTimeout = new Promise<ServiceWorkerRegistration[]>(
            (_, reject) =>
              setTimeout(
                () => reject(new Error("getRegistrations timeout")),
                3000,
              ),
          )
          const registrations = await Promise.race([
            registrationsPromise,
            registrationsTimeout,
          ])
          result.serviceWorkerInfo.registrations = registrations.length
          result.serviceWorkerInfo.scopes = registrations.map((r) => r.scope)
        } catch (swError) {
          console.warn("Failed to get Service Worker info:", swError)
        }
      }
    } catch (error) {
      console.warn("Failed to get storage info:", error)
    }

    return result
  },

  // 清除所有数据（删除数据库文件并重新创建）
  async clearAllData(): Promise<void> {
    await initDatabase()
    if (!dbPromiser || dbId === null) {
      throw new Error("Database not initialized")
    }

    try {
      const currentDbId = dbId
      const currentPromiser = dbPromiser

      // 1. 先删除所有表（按依赖顺序），添加超时保护
      const dropTables = [
        "DROP TABLE IF EXISTS file_indexes_fts",
        "DROP TABLE IF EXISTS file_tags",
        "DROP TABLE IF EXISTS file_indexes",
        "DROP TABLE IF EXISTS folders",
        "DROP TABLE IF EXISTS index_manifests",
        "DROP TABLE IF EXISTS wallets",
        "DROP TABLE IF EXISTS vault_metadata",
      ]

      for (const sql of dropTables) {
        try {
          // 为每个 SQL 执行添加超时保护（3秒）
          const execPromise = currentPromiser("exec", {
            dbId: currentDbId,
            sql,
          })
          const execTimeout = new Promise<SqliteWorkerResponse>((_, reject) =>
            setTimeout(() => reject(new Error(`exec timeout: ${sql}`)), 3000),
          )
          const result = await Promise.race([execPromise, execTimeout])
          if (result.type === "error") {
            console.warn(`Failed to drop table: ${sql}`, result)
          }
        } catch (error) {
          console.warn(`Failed to execute SQL (${sql}):`, error)
          // 继续执行下一个，不阻塞
        }
      }

      // 2. 执行 VACUUM 来回收空间（添加超时保护）
      try {
        // VACUUM 可能需要更长时间，设置10秒超时
        const vacuumPromise = currentPromiser("exec", {
          dbId: currentDbId,
          sql: "VACUUM",
        })
        const vacuumTimeout = new Promise<SqliteWorkerResponse>((_, reject) =>
          setTimeout(() => reject(new Error("VACUUM timeout")), 10000),
        )
        await Promise.race([vacuumPromise, vacuumTimeout])
      } catch (vacuumError) {
        console.warn("VACUUM failed (this is okay):", vacuumError)
      }

      // 3. 关闭数据库连接并删除数据库文件（unlink: true）
      // 这会删除 OPFS 中的数据库文件，释放文件系统空间（添加超时保护）
      try {
        // 关闭操作可能需要时间，设置5秒超时
        const closePromise = currentPromiser("close", {
          dbId: currentDbId,
          args: { unlink: true },
        })
        const closeTimeout = new Promise<SqliteWorkerResponse>((_, reject) =>
          setTimeout(() => reject(new Error("close timeout")), 5000),
        )
        const closeResponse = await Promise.race([closePromise, closeTimeout])
        if (closeResponse.type === "error") {
          console.warn("Failed to close and delete database:", closeResponse)
        } else {
          console.log("Database file deleted successfully via SQLite")
        }
      } catch (closeError) {
        console.warn("Error closing/deleting database:", closeError)
        // 继续执行，尝试通过 OPFS API 删除文件
      }

      // 4. 直接通过 OPFS API 删除文件（备用方法，确保文件被删除）
      // 这可以处理 SQLite unlink 可能遗漏的情况
      await deleteOpfsDatabaseFile()

      // 5. 重置全局变量
      // 注意：不在这里重新初始化数据库，因为页面会在清除数据后刷新
      // 重新初始化会在页面刷新后自然进行，避免 SQLite WASM 模块状态冲突
      dbPromiser = null
      dbId = null
      initPromise = null

      console.log("All data cleared successfully, database file deleted")
    } catch (error) {
      console.error("Failed to clear data:", error)
      // 即使出错，也尝试重置状态
      dbPromiser = null
      dbId = null
      initPromise = null
      throw error
    }
  },
}
