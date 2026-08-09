import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"

export type PolicyInput = {
  entityType: string
  mimeWhitelist: string[] | null
  maxSizeBytes: number | null
}

/** 校验文件是否符合 policy；不符抛错。size 单位 bytes。 */
export function validateAgainstPolicy(
  file: { mime: string; sizeBytes: number },
  policy: PolicyInput | null,
): void {
  if (!policy) return
  if (policy.mimeWhitelist && !policy.mimeWhitelist.includes(file.mime)) {
    throw new Error(`MIME type ${file.mime} is not allowed for ${policy.entityType}`)
  }
  if (policy.maxSizeBytes !== null && file.sizeBytes > policy.maxSizeBytes) {
    throw new Error(`File size exceeds maximum of ${policy.maxSizeBytes} bytes`)
  }
}

/** 本地磁盘附件存储；生产可替换为 S3 等对象存储。 */
export function createLocalAttachmentStorage(rootDir: string) {
  const root = resolve(rootDir)

  return {
    /** 写入文件，返回稳定 storageKey。 */
    save(bytes: Uint8Array): string {
      const key = `${randomUUID()}`
      const target = resolve(root, key)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, bytes)
      return key
    },
    /** 私有访问 URL；本地存储走服务端受控端点。 */
    assetUrl(storageKey: string): string {
      return `/api/attachments/asset/${encodeURIComponent(storageKey)}`
    },
    absolutePath(storageKey: string): string {
      return resolve(root, storageKey)
    },
    remove(storageKey: string): void {
      rmSync(resolve(root, storageKey), { force: true })
    },
  }
}

export type AttachmentStorage = ReturnType<typeof createLocalAttachmentStorage>
