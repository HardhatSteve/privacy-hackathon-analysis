# 搜索策略说明

## 概述

Anamnesis 实现了**本地优先的混合搜索策略**，优先使用本地数据库搜索，必要时从清单文件中搜索，以提高搜索性能和用户体验。

## 重要说明：搜索范围限制

### 文件名/描述搜索：只能搜索自己的文件

**默认情况下，文件名和描述搜索只能搜索到自己上传的文件**，原因：

1. **本地搜索**：只搜索 `owner_address = 当前账户地址` 的文件
2. **清单文件搜索**：清单文件只包含当前账户的文件
3. **网络搜索**：虽然可以搜索到其他用户的文件，但只有在以下情况下才会触发：
   - 本地搜索结果不足（少于 `limit`）
   - 查询的是交易 ID（43 字符）

### 交易 ID 搜索：可以搜索任何文件

**如果输入的是交易 ID（43 个字符的 base64url 字符串），可以搜索到任何文件**，包括：

- 自己上传的文件
- 其他用户上传的文件
- 任何 Arweave 上的交易

这是因为交易 ID 是全局唯一的，可以直接通过 GraphQL API 查询任何交易。

## 为什么使用清单文件搜索？

### 网络搜索的限制

Arweave GraphQL API 的标签查询有以下限制：

1. **数量限制**：单次查询最多只能返回 10000 条交易
2. **只能搜索最近的交易**：如果文件不在最近的 10000 条交易中，搜索不到
3. **性能问题**：需要多次网络请求，搜索速度慢

### 清单文件搜索的优势

1. **突破数量限制**：清单文件包含所有文件记录，不受 10000 条限制
2. **搜索所有历史文件**：可以搜索所有历史文件，不受时间限制
3. **一次下载**：只需要下载一个清单文件，包含所有文件记录
4. **离线搜索**：下载后可以离线搜索和管理文件
5. **搜索性能**：在客户端快速搜索，不受网络限制

## 搜索流程

### 1. 本地搜索（优先）

**触发条件：**

- 用户已登录（有 `activeAddress`）
- `preferLocal` 为 `true`（默认值）

**搜索范围：**

- 本地 SQLite 数据库中已同步的文件记录
- 使用 **FTS5 全文搜索**，支持文件名、描述等字段的快速搜索
- **搜索方式**：支持**部分匹配**，不需要输入完整文件名或描述
  - 例如：文件名是"重要文档.pdf"，搜索"重要"或"文档"都能找到
  - 例如：描述是"这是一个重要的文档"，搜索"重要"或"文档"都能找到
- **注意**：描述字段需要在上传后通过 `updateFileMetadata` API 添加，但目前**没有 UI 界面**可以添加描述

**优势：**

- ✅ 搜索速度快（毫秒级）
- ✅ 无需网络连接
- ✅ 支持全文搜索和复杂查询
- ✅ 不消耗网络资源

**限制：**

- ⚠️ 只能搜索已同步到本地的文件
- ⚠️ 如果文件还未同步，本地搜索找不到

### 2. 清单文件搜索（补充）

**触发条件（满足以下任一条件）：**

#### 情况 1：本地搜索结果不足

- 本地搜索结果数量少于请求的 `limit`（默认 20 条）
- **原因**：需要补充更多结果，可能包括：
  - 最近上传但还未同步到本地的文件
  - 历史文件（不在本地数据库中）

#### 情况 2：查询交易 ID

- 用户输入的是 43 个字符的交易 ID（base64url 格式）
- **原因**：交易 ID 查询需要精确匹配，可能不在本地数据库中

**搜索范围：**

- 从 Arweave 下载清单文件
- 在清单文件中搜索所有文件记录
- 支持文件名、描述、标签等字段的搜索
- **搜索方式**：使用字符串匹配（`includes`），支持**部分匹配**
  - 例如：文件名是"重要文档.pdf"，搜索"重要"或"文档"都能找到
  - 例如：描述是"这是一个重要的文档"，搜索"重要"或"文档"都能找到
- **注意**：描述字段需要在上传后通过 `updateFileMetadata` API 添加，但目前**没有 UI 界面**可以添加描述

**优势：**

- ✅ 可以搜索所有历史文件（不受 10000 条限制）
- ✅ 一次下载，包含所有文件记录
- ✅ 可以搜索未同步到本地的文件
- ✅ 下载后可以离线搜索

**限制：**

- ⚠️ 需要网络连接（首次下载清单）
- ⚠️ 清单文件可能不是最新的（取决于更新频率）

### 3. 网络搜索（最后补充）

**触发条件：**

- 查询的是交易 ID（43 字符）- **可以搜索任何文件**
- 本地搜索结果不足（少于 `limit`）- **可能搜索到其他用户的文件**
- 清单文件搜索也没有结果

**搜索范围：**

- **交易 ID 查询**：直接查询指定的交易（可以查询任何交易，包括其他用户的文件）
- **应用内搜索**：搜索 `App-Name: "Anamnesis"` 的交易（**可能包括其他用户的文件**）
- **全网搜索**：搜索所有最近的交易（最多 5000-10000 条）- **可能包括其他用户的文件**
- 然后客户端过滤匹配的交易

**重要限制：**

- ⚠️ **文件名/描述搜索默认只能搜索自己的文件**（通过本地搜索和清单文件搜索）
- ⚠️ **交易 ID 搜索可以搜索任何文件**（包括其他用户的文件）
- ⚠️ 网络搜索只能搜索最近的交易（最多 5000-10000 条）
- ⚠️ 如果关键词不在最近的交易中，就找不到
- ⚠️ 需要网络连接
- ⚠️ 搜索速度较慢（秒级）

**为什么网络搜索可能返回其他用户的文件？**

网络搜索会搜索所有 `App-Name: "Anamnesis"` 的交易，这些交易可能来自：

- 当前用户
- 其他使用 Anamnesis 的用户

但只有在以下情况下才会触发网络搜索：

1. 查询的是交易 ID（可以查询任何交易）
2. 本地搜索结果不足（需要补充更多结果）

## 搜索策略示例

### 示例 1：搜索自己的文件（已同步）

```
用户输入："document.pdf"
账户地址：已登录
本地数据库：有该文件记录

流程：
1. 本地搜索 → 找到 1 条结果
2. 结果数量 >= limit (20) → 直接返回
3. 不进行清单搜索 ✅
```

### 示例 2：搜索历史文件（未同步）

```
用户输入："old-document.pdf"
账户地址：已登录
本地数据库：没有该文件记录
limit：20

流程：
1. 本地搜索 → 找到 0 条结果
2. 结果数量 < limit (20) → 需要补充
3. 下载清单文件 → 在清单中搜索 → 找到 1 条结果 ✅
4. 返回清单搜索结果
```

### 示例 3：本地结果不足（可能搜索到其他用户的文件）

```
用户输入："photo"
账户地址：已登录
本地数据库：有 5 条匹配结果（都是自己的文件）
limit：20

流程：
1. 本地搜索 → 找到 5 条结果（自己的文件）
2. 结果数量 < limit (20) → 需要补充
3. 网络搜索 → 可能找到其他用户的文件（如果它们有 "photo" 关键词）
4. 合并结果 → 返回 5 条自己的文件 + 其他用户的文件（如果有）
```

**注意**：这种情况下，搜索结果可能包括其他用户的文件。

### 示例 4：交易 ID 搜索（可以搜索任何文件）

```
用户输入："abc123...xyz789"（43字符的交易ID）
账户地址：已登录或未登录

流程：
1. 检测到是交易ID格式 → 直接网络搜索
2. 通过 GraphQL API 查询该交易ID
3. 返回该交易（可能是自己的文件，也可能是其他用户的文件）✅
```

**注意**：交易 ID 搜索可以搜索到任何文件，包括其他用户的文件。3. 下载清单文件 → 在清单中搜索 → 找到 15 条额外结果 4. 合并结果：5 条本地 + 15 条清单 = 20 条 ✅ 5. 去重后返回

```

### 示例 4：查询交易 ID

```

用户输入："abc123...xyz789" (43 字符)
账户地址：已登录

流程：

1. 检测到是交易 ID 格式
2. 本地搜索 → 找到 0 条结果（可能不在本地）
3. 下载清单文件 → 在清单中搜索 → 找到 1 条结果 ✅
4. 返回清单搜索结果

````

## 清单文件搜索实现

### 下载清单文件

```typescript
// 从 Arweave 下载最新的清单文件
const manifest = await downloadManifest(ownerAddress)
if (!manifest) {
  return [] // 没有清单文件
}
````

### 在清单中搜索

```typescript
/**
 * 在清单文件中搜索文件
 */
function searchInManifest(
  manifest: FileManifest,
  query: string,
  limit: number = 20,
): FileIndex[] {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0)

  const results = manifest.files.filter((file) => {
    // 搜索文件名
    if (file.file_name.toLowerCase().includes(queryLower)) {
      return true
    }

    // 搜索描述
    if (file.description?.toLowerCase().includes(queryLower)) {
      return true
    }

    // 搜索交易 ID
    if (file.tx_id.toLowerCase().includes(queryLower)) {
      return true
    }

    // 搜索标签
    if (file.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) {
      return true
    }

    // 多词搜索（所有词都必须匹配）
    const searchText = [
      file.file_name,
      file.description || "",
      ...(file.tags || []),
    ]
      .join(" ")
      .toLowerCase()

    return queryWords.every((word) => searchText.includes(word))
  })

  return results.slice(0, limit)
}
```

### 合并版本链

如果清单是增量清单，需要先合并版本链：

```typescript
// 下载清单时自动合并版本链
const manifest = await downloadManifest(ownerAddress)
// manifest 始终是完整清单（已合并）
```

## 结果合并策略

当同时进行本地和清单搜索时：

1. **优先显示本地结果**：本地结果排在前面
2. **去重**：如果清单结果中已有本地结果，自动去重
3. **补充清单结果**：如果本地结果不足，用清单结果补充
4. **限制总数**：最终结果数量不超过 `limit`

## 性能优化

### 本地搜索优化

- 使用 SQLite FTS5 全文搜索索引
- 支持复杂查询条件（文件夹、标签、文件类型等）
- 毫秒级响应速度

### 清单文件搜索优化

- **缓存清单文件**：下载后缓存到本地存储，减少重复下载
- **增量更新**：只下载变更的部分（增量清单）
- **版本链合并**：自动合并增量清单，对用户透明

### 缓存策略

- **本地搜索结果**：实时更新（同步时自动更新）
- **清单文件**：缓存 5 分钟，减少重复下载
- **网络搜索结果**：不缓存（每次都是最新数据）

## 使用建议

### 对于用户

1. **优先使用本地搜索**：已同步的文件搜索速度最快
2. **定期同步**：确保本地数据库包含最新的文件记录
3. **清单搜索**：自动补充历史文件，无需手动操作
4. **交易 ID 查询**：如果知道交易 ID，可以直接搜索（会自动进行清单搜索）

### 对于开发者

1. **提供账户地址**：如果可能，总是提供 `ownerAddress` 以启用本地搜索
2. **设置 preferLocal**：默认 `true`，优先本地搜索
3. **处理错误**：清单搜索可能失败，需要优雅降级到本地结果
4. **缓存清单**：合理使用缓存，平衡实时性和性能

## 代码示例

```typescript
// 优先本地搜索（默认）
const results = await searchArweaveTransactions({
  query: "document",
  limit: 20,
  ownerAddress: activeAddress, // 提供账户地址启用本地搜索
  preferLocal: true, // 默认值
})

// 搜索流程：
// 1. 本地搜索 → 找到 5 条结果
// 2. 结果不足 → 下载清单文件
// 3. 在清单中搜索 → 找到 15 条额外结果
// 4. 合并结果：5 条本地 + 15 条清单 = 20 条 ✅
```

## 清单文件搜索 vs 网络搜索

| 特性         | 清单文件搜索           | 网络搜索               |
| ------------ | ---------------------- | ---------------------- |
| **搜索范围** | 所有历史文件           | 最近的交易（10000 条） |
| **搜索速度** | 快（客户端搜索）       | 慢（网络请求）         |
| **离线支持** | ✅ 支持（下载后）      | ❌ 不支持              |
| **数量限制** | ✅ 无限制              | ⚠️ 10000 条限制        |
| **实时性**   | ⚠️ 取决于清单更新频率  | ✅ 实时                |
| **费用**     | 一次性支付（清单文件） | 无额外费用             |

## 总结

**搜索策略优先级：**

1. ✅ **本地搜索**（最快，已同步的文件）
2. ✅ **清单文件搜索**（补充历史文件，突破 10000 条限制）
3. ✅ **网络搜索**（最后补充，搜索其他用户的文件）

**什么情况下会进行清单文件搜索？**

1. ✅ **本地结果不足**：本地结果少于 `limit` 时补充清单搜索
2. ✅ **查询交易 ID**：交易 ID 查询如果在本地找不到，会进行清单搜索
3. ✅ **搜索历史文件**：清单文件包含所有历史文件，不受时间限制

**什么情况下只进行本地搜索？**

1. ✅ **本地结果充足**：本地结果数量 >= `limit`
2. ✅ **查询交易 ID 且本地找到**：交易 ID 查询如果在本地找到，直接返回

这种混合策略既保证了搜索速度（优先本地），又保证了搜索完整性（清单文件补充历史文件），提供了最佳的用户体验。
const files = new Map<string, FileIndex>()
let currentTxId: string | null = latestTxId

// 沿着版本链向上遍历
while (currentTxId) {
const manifest = await downloadManifestByTxId(currentTxId)
if (!manifest) {
break
}

    // 增量清单：添加新增的文件
    const incremental = manifest as IncrementalManifest
    incremental.added.forEach((file) => {
      files.set(file.tx_id, file)
    })

    // 处理更新的文件
    if (incremental.updated) {
      incremental.updated.forEach((file) => {
        files.set(file.tx_id, file)
      })
    }

    // 处理删除的文件
    if (incremental.deleted) {
      incremental.deleted.forEach((txId) => {
        files.delete(txId)
      })
    }

    // 继续向上遍历（previousManifestTxId 可能为 null，首次上传时）
    currentTxId = incremental.previousManifestTxId

}

// 构建完整清单（合并后的结果）
return {
version: "1.0.0",
ownerAddress,
lastUpdated: Date.now(),
files: Array.from(files.values()),
}
}

````

**关键点**：
- `previousManifestTxId` 可能为 `null`（首次上传时）
- 当 `currentTxId` 为 `null` 时，while 循环停止
- 所有增量清单都会被合并成完整清单（用于同步到本地数据库）

## 清单文件版本链

### 数据结构

```typescript
interface ManifestVersion {
  txId: string // 清单文件交易 ID
  previousTxId: string | null // 上一个清单文件的交易 ID
  fileCount: number // 包含的文件数量
  createdAt: number // 创建时间戳
  blockHeight: number // 区块高度
}
````

### 版本链查询

```typescript
// 查询所有清单文件版本（用于调试或恢复）
async function getManifestVersions(
  ownerAddress: string,
): Promise<ManifestVersion[]> {
  const query = {
    query: `
      query GetManifestVersions($owner: [String!]!, $appName: String!, $ownerAddress: String!) {
        transactions(
          owners: $owner
          tags: [
            { name: "App-Name", values: [$appName] }
            { name: "Owner-Address", values: [$ownerAddress] }
          ]
          sort: HEIGHT_DESC
          first: 100  # 获取最近 100 个版本
        ) {
          edges {
            node {
              id
              block {
                height
                timestamp
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: {
      owner: [ownerAddress],
      appName: MANIFEST_APP_NAME,
      ownerAddress: ownerAddress,
    },
  }

  // ... 执行查询并返回版本列表
}
```

## 费用优化

### 清单文件大小

清单文件大小随文件数量增长：

```
单个文件记录大小：约 500-1000 字节（JSON格式）
1000个文件：约 500KB - 1MB
10000个文件：约 5MB - 10MB
```

### 费用计算

```
清单文件费用 = 文件大小 × Arweave 存储费用率

示例：
- 1000个文件：约 500KB，费用约 $0.01
- 10000个文件：约 5MB，费用约 $0.10
```

### 优化建议

1. **使用增量清单**：只包含新增文件，可减少 99% 费用
2. **批量更新**：延迟更新，减少清单文件数量
3. **压缩清单文件**：使用 gzip 压缩，可减少 70-80% 大小（可选）

## 错误处理

如果增量清单上传失败，会记录错误并返回 null：

```typescript
try {
  // 上传增量清单
  return await uploadIncrementalManifest(ownerAddress, key)
} catch (error) {
  // 记录错误，不进行回退
  console.error("Failed to update manifest:", error)
  return null
}
```

## 最佳实践

### 1. 统一使用增量清单

无论是首次上传还是后续更新，都使用增量清单：

```typescript
// 首次上传：previousManifestTxId 为 null，包含所有文件
// 后续更新：previousManifestTxId 指向上一个清单，只包含新增文件
await uploadIncrementalManifest(ownerAddress, key)
```

### 2. 立即更新清单

无论是单个文件还是批量上传，都立即更新清单：

```typescript
// 单个文件上传
await uploadFile(file, ownerAddress, key)
// uploadFile 内部会自动调用 updateManifestAfterUpload

// 批量上传
for (const file of files) {
  await uploadFile(file, ownerAddress, key, {
    updateManifest: false, // 禁用单个文件的清单更新
  })
}
// 批量上传完成后，统一更新清单
await updateManifestAfterUpload(ownerAddress, key)
```

### 3. 费用透明

每次上传都可以看到：

- 文件大小和费用
- 清单文件大小和费用
- 总费用

这样可以更好地控制存储成本。

## 总结

### 核心机制

1. **Arweave 数据不可变**：无法修改已上传的数据
2. **版本化清单**：每次更新创建新的清单文件交易
3. **查询最新版本**：通过 `sort: HEIGHT_DESC` + `first: 1` 获取最新清单
4. **包含所有文件**：最新清单包含所有历史文件

### 更新策略

| 策略     | 更新频率     | 费用 | 实时性 | 推荐场景         |
| -------- | ------------ | ---- | ------ | ---------------- |
| 立即更新 | 每次上传立即 | 低   | 最高   | 所有场景（推荐） |
| 增量清单 | 每次上传立即 | 低   | 最高   | 所有场景（推荐） |

### 最佳实践

1. **统一使用增量清单**：无论是首次上传还是后续更新，都使用增量清单方案
2. **立即更新清单**：每次文件上传后立即更新清单，保持一致性
3. **费用透明**：每次上传都可以看到文件大小、清单大小和费用
4. **批量上传优化**：批量上传时，禁用单个文件的清单更新，批量完成后统一更新
5. **记录版本链**：便于调试和恢复

通过合理的更新策略，可以在保证数据完整性的同时，优化存储费用和查询效率。

通过将文件记录清单上传到 Arweave 网络，Anamnesis 实现了跨设备的文件记录同步。核心机制包括：

1. **增量清单**：统一使用增量清单方案，无论是首次上传还是后续更新
2. **版本链**：通过版本链追踪所有历史版本，previousManifestTxId 首次为 null
3. **空闲时间更新**：每次文件上传后，清单更新会在浏览器空闲时间执行（使用 `requestIdleCallback`），避免阻塞页面渲染和交互，保持数据一致性
4. **费用透明**：每次上传都可以看到文件大小、清单大小和费用
5. **自动合并**：下载时自动合并增量清单链，对用户透明
6. **性能优化**：文件同步操作（如下载清单、合并版本链）也使用空闲时间执行，确保页面流畅性

这个方案充分利用了 Arweave 的去中心化特性，实现了可靠、安全、高效的跨设备数据同步，同时通过统一的增量清单方案，大幅降低了存储费用（99% 节省）。
