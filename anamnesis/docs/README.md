# Anamnesis 文档

欢迎来到 Anamnesis 项目文档中心。

## 文档目录

### 核心文档

- **[统一设计方案](./design.md)** - 完整的系统设计方案，包括数据模型、核心功能和实现细节
- **[实施指南](./implementation.md)** - 快速实施步骤和代码示例

### 功能文档

- **[文件上传操作指南](./upload-guide.md)** - Arweave 原生协议上传的详细操作步骤和技术实现
- **[文件同步机制](./file-sync.md)** - 跨设备文件记录同步机制（基于清单文件）
- **[清单文件更新机制](./manifest-update.md)** - 清单文件的更新策略和增量清单方案
- **[搜索策略说明](./search-strategy.md)** - 本地优先的混合搜索策略（本地数据库 + 清单文件搜索）

## 项目概述

Anamnesis 是一个去中心化存储应用，支持将文件上传到 Arweave 网络。项目提供了完整的账户管理、文件加密、上传历史记录等功能。

## 核心特性

- **高性能数据库**：采用 SQLite WASM，支持复杂查询和全文搜索
- **统一文件管理**：文件上传、搜索、新增、修改统一管理
- **文件夹组织**：支持文件夹分类和标签管理
- **链上索引同步**：通过清单文件实现跨设备同步，支持增量清单和批量更新
- **多链账户管理**：支持 Ethereum、Bitcoin、Solana、Sui、Arweave 等多种区块链账户
- **去中心化存储**：支持 Arweave 原生协议
- **端到端加密**：可选的本地加密，保护文件隐私

## 技术栈

- **前端框架**：React + TypeScript
- **构建工具**：Vite
- **UI 组件**：shadcn/ui
- **数据库**：SQLite WASM ([@sqlite.org/sqlite-wasm](https://github.com/sqlite/sqlite-wasm))
- **区块链 SDK**：
  - Arweave JS SDK
  - wagmi (Ethereum)
- **加密库**：libsodium-wrappers

## 快速开始

1. 安装依赖：`pnpm install`
2. 启动开发服务器：`pnpm dev`
3. 构建生产版本：`pnpm build`

## 架构设计

项目采用 SQLite WASM 作为本地数据库，提供：

- ✅ 高性能查询和全文搜索
- ✅ 统一的数据管理接口
- ✅ 完整的 CRUD 操作
- ✅ 链上索引同步
- ✅ 简洁的架构设计

详细设计请参考 [统一设计方案](./design.md)。

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

查看项目根目录的 LICENSE 文件了解详情。
