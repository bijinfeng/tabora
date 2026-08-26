export const maxEmbeddedFileSize = 5 * 1024 * 1024

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("读取文件失败"))
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("读取文件失败"))
    }
    reader.readAsDataURL(file)
  })
}
