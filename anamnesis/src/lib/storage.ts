import Arweave from "arweave"
import { encryptData, toBase64 } from "./crypto"
import type { ArweaveJWK } from "./types"
import { compressData, shouldCompressFile } from "./compression"

// Initialize Arweave
// 注意：Arweave 目前没有公开可用的测试网节点
// 建议直接使用主网进行测试，存储费用很低（通常几美分到几美元，取决于文件大小）
export const arweave = Arweave.init({
  // Arweave 主网配置
  host: "arweave.net",
  port: 443,
  protocol: "https",
})

export const generateArweaveWallet = async () => {
  const key = await arweave.wallets.generate()
  const address = await arweave.wallets.jwkToAddress(key)
  return { key, address }
}

/**
 * 估算 Arweave 交易费用
 * @param dataSize 数据大小（字节）
 * @returns 返回费用信息，包括 AR 估算，如果获取失败则抛出错误
 */
export const estimateArweaveFee = async (dataSize: number) => {
  try {
    // 获取当前网络价格（以 winston 为单位，1 AR = 10^12 winston）
    const priceInWinston = await arweave.transactions.getPrice(dataSize)
    const priceInAR = arweave.ar.winstonToAr(priceInWinston)

    return {
      winston: priceInWinston,
      ar: parseFloat(priceInAR),
      dataSize,
    }
  } catch (error) {
    console.error("Failed to estimate fee:", error)
    // 获取失败时抛出错误，让调用方处理
    throw new Error("无法获取费用信息，请稍后重试或检查网络连接")
  }
}

export const uploadToArweave = async (
  file: File,
  key: ArweaveJWK | string | null,
  encryptionKey?: Uint8Array,
  useExternalWallet?: boolean,
  enableCompression?: boolean,
  ownerAddress?: string, // 添加账户地址参数，用于标签
  onProgress?: (progress: { stage: string; progress: number }) => void, // 进度回调
): Promise<{
  txId: string
  hash: string
  finalSize: number
  encryptionParams?: string
}> => {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        onProgress?.({ stage: "准备中", progress: 10 })

        let data = new Uint8Array(reader.result as ArrayBuffer)
        let encryptionInfo = null
        let compressionInfo = null

        // 压缩：在加密之前进行压缩（压缩加密后的数据效果很差）
        // 如果用户明确选择了压缩，即使文件类型通常不适合压缩，也尝试压缩
        // 但会检查压缩效果，只有压缩后确实更小时才使用
        const shouldCompress = shouldCompressFile(file)
        const willAttemptCompression =
          enableCompression && (shouldCompress || enableCompression)

        console.log("Compression check:", {
          enableCompression,
          shouldCompress,
          willAttemptCompression,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        })

        if (enableCompression) {
          onProgress?.({ stage: "压缩中", progress: 30 })
          // 如果用户明确选择了压缩，尝试压缩（即使文件类型通常不适合压缩）
          // 重要：如果用户选择了压缩，无论压缩后是否更小，都要设置压缩标记
          // 这样下载时才知道需要解压
          try {
            const originalSize = data.length
            const compressed = await compressData(data)

            // 如果压缩后更小，使用压缩后的数据
            if (compressed.length < originalSize) {
              // 确保返回的是 Uint8Array<ArrayBuffer> 类型（不是 SharedArrayBuffer）
              const newBuffer = new ArrayBuffer(compressed.length)
              const newData = new Uint8Array(newBuffer)
              newData.set(compressed)
              data = newData
              compressionInfo = {
                algo: "gzip",
                enabled: true,
              }
              console.log("File compressed successfully:", {
                originalSize,
                compressedSize: compressed.length,
                compressionRatio:
                  ((1 - compressed.length / originalSize) * 100).toFixed(2) +
                  "%",
                note: shouldCompress
                  ? "File type suitable for compression"
                  : "User requested compression despite file type",
              })
            } else {
              // 压缩后没有变小，但用户选择了压缩
              // 仍然设置压缩标记，这样下载时才知道数据是压缩格式，需要解压
              // 但使用原始数据（因为压缩后没有变小）
              compressionInfo = {
                algo: "gzip",
                enabled: true,
              }
              console.log(
                "Compression executed but not beneficial, keeping original data:",
                {
                  originalSize,
                  compressedSize: compressed.length,
                  reason:
                    "Compressed size >= original size, but compression tag will be set",
                  note: "User requested compression, so compression tag will be added even though compressed size >= original",
                },
              )
            }
          } catch (compressionError) {
            console.warn(
              "Compression failed, uploading uncompressed:",
              compressionError,
            )
            // 压缩失败时继续使用原始数据，不设置压缩标记
          }
        } else {
          console.log("Compression skipped: Compression disabled by user")
        }

        // 加密：在压缩之后进行加密
        if (encryptionKey) {
          onProgress?.({ stage: "加密中", progress: 50 })
          const { ciphertext, nonce } = await encryptData(data, encryptionKey)
          // Create a new Uint8Array with a new ArrayBuffer to ensure type compatibility
          const newBuffer = new ArrayBuffer(ciphertext.length)
          const newData = new Uint8Array(newBuffer)
          newData.set(ciphertext)
          data = newData
          encryptionInfo = {
            algo: "XChaCha20-Poly1305",
            params: JSON.stringify({ nonce: toBase64(nonce) }),
          }
        }

        onProgress?.({ stage: "创建交易", progress: 60 })

        // 如果使用外部钱包，需要先获取地址，然后创建临时 key 用于创建交易
        let transactionKey: ArweaveJWK | string | "use_wallet" =
          key || "use_wallet"

        if (useExternalWallet && window.arweaveWallet) {
          await window.arweaveWallet.getActiveAddress()
          // 创建一个临时 key 用于创建交易（不会用于签名）
          const tempKey = await arweave.wallets.generate()
          transactionKey = tempKey as unknown as ArweaveJWK
        } else if (!key) {
          throw new Error("Key is required when not using external wallet")
        }

        const transaction = await arweave.createTransaction(
          { data },
          typeof transactionKey === "string" && transactionKey !== "use_wallet"
            ? (JSON.parse(transactionKey) as ArweaveJWK)
            : transactionKey,
        )
        transaction.addTag(
          "Content-Type",
          encryptionKey ? "application/octet-stream" : file.type,
        )
        transaction.addTag("App-Name", "Anamnesis")
        transaction.addTag("File-Name", file.name)
        // 添加账户地址标签，用于跨设备查询
        if (ownerAddress) {
          transaction.addTag("Owner-Address", ownerAddress)
        }
        if (encryptionInfo) {
          transaction.addTag("Encryption-Algo", encryptionInfo.algo)
          transaction.addTag("Encryption-Params", encryptionInfo.params)
        }
        if (compressionInfo) {
          transaction.addTag("Compression-Algo", compressionInfo.algo)
          transaction.addTag("Compression-Enabled", "true")
          console.log("Added compression tags to transaction:", {
            algo: compressionInfo.algo,
            enabled: true,
          })
        } else {
          console.log("No compression info, skipping compression tags")
        }

        onProgress?.({ stage: "签名中", progress: 70 })

        // 如果使用外部钱包（ArConnect），使用钱包签名
        if (useExternalWallet && window.arweaveWallet) {
          await window.arweaveWallet.sign(transaction)
        } else {
          if (!key) {
            throw new Error("Key is required when not using external wallet")
          }
          const signKey =
            typeof key === "string" ? (JSON.parse(key) as ArweaveJWK) : key
          await arweave.transactions.sign(transaction, signKey)
        }

        // 计算最终上传数据的 hash（压缩和加密后的数据）
        // 确保创建新的 ArrayBuffer，避免 SharedArrayBuffer 的问题
        const dataBuffer = new ArrayBuffer(data.length)
        new Uint8Array(dataBuffer).set(data)
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hash = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")

        onProgress?.({ stage: "上传中", progress: 80 })

        // 使用 Arweave SDK 上传交易
        // 注意：Arweave SDK 的 post 方法可能不支持进度回调，所以我们使用阶段性进度
        const response = await arweave.transactions.post(transaction)

        // 上传完成后更新进度
        onProgress?.({ stage: "完成", progress: 100 })

        if (response.status === 200) {
          // 数据库操作由 file-manager.ts 中的 uploadFile 函数处理
          resolve({
            txId: transaction.id,
            hash,
            finalSize: data.length,
            encryptionParams: encryptionInfo?.params,
          })
        } else {
          reject(new Error(`Arweave upload failed: ${response.status}`))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
