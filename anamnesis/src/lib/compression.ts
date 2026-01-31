import { compress, decompress } from "fflate"

/**
 * 压缩数据（使用 gzip）
 * @param data 要压缩的数据
 * @returns 压缩后的数据
 */
export async function compressData(data: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    compress(data, { level: 6 }, (err, compressed) => {
      if (err) {
        reject(err)
        return
      }
      resolve(compressed)
    })
  })
}

/**
 * 解压数据（gzip）
 * @param compressedData 压缩的数据
 * @returns 解压后的原始数据
 */
export async function decompressData(
  compressedData: Uint8Array,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    decompress(compressedData, (err, decompressed) => {
      if (err) {
        reject(err)
        return
      }
      resolve(decompressed)
    })
  })
}

/**
 * 检查文件类型是否适合压缩
 * 对于已经压缩的文件格式（如 jpg, png, zip, gz），压缩效果可能有限
 * 但对于文本、JSON、未压缩的二进制文件等，压缩效果会很好
 */
export function shouldCompressFile(file: File): boolean {
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  // 已经压缩的格式，压缩效果有限
  const compressedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/mp3",
    "application/zip",
    "application/gzip",
    "application/x-gzip",
    "application/x-compressed",
    "application/x-zip-compressed",
  ]

  // 检查文件扩展名
  const compressedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".webm",
    ".mp3",
    ".zip",
    ".gz",
    ".7z",
    ".rar",
  ]

  // 如果文件很小（< 1KB），压缩可能不值得
  if (file.size < 1024) {
    return false
  }

  // 检查是否是已压缩格式
  if (compressedFormats.some((fmt) => mimeType.includes(fmt))) {
    return false
  }

  if (compressedExtensions.some((ext) => fileName.endsWith(ext))) {
    return false
  }

  // 其他文件类型建议压缩
  return true
}

/**
 * 实际压缩文件并返回压缩后的大小
 * 用于费用估算，确保使用真实的压缩结果
 * @param file 要压缩的文件
 * @returns 压缩后的实际大小（如果压缩失败或压缩后更大，返回原始大小）
 */
export async function getActualCompressedSize(file: File): Promise<number> {
  if (!shouldCompressFile(file)) {
    return file.size
  }

  try {
    const fileBuffer = await file.arrayBuffer()
    const data = new Uint8Array(fileBuffer)
    const compressed = await compressData(data)
    // 只有当压缩后确实更小时才返回压缩后的大小
    return compressed.length < data.length ? compressed.length : data.length
  } catch (error) {
    console.warn("Failed to compress file for size calculation:", error)
    return file.size
  }
}
