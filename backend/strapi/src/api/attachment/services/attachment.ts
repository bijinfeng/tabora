export type AttachmentPolicy = {
  entity_type: string
  mime_whitelist: string[] | null
  max_size_bytes: number | null
}

export type FileSummary = { id: number; mime?: string; size?: number }

/** 校验文件是否符合 policy；不符抛错。size 单位与 policy 对齐（bytes）。 */
export function validateFileAgainstPolicy(
  file: FileSummary,
  policy: AttachmentPolicy | null,
): void {
  if (!policy) return
  if (
    policy.mime_whitelist &&
    (typeof file.mime !== "string" || !policy.mime_whitelist.includes(file.mime))
  ) {
    throw new Error(
      `MIME type ${String(file.mime ?? "unknown")} is not allowed for ${policy.entity_type}`,
    )
  }
  if (
    policy.max_size_bytes !== null &&
    typeof file.size === "number" &&
    file.size > policy.max_size_bytes
  ) {
    throw new Error(`File size exceeds maximum of ${policy.max_size_bytes} bytes`)
  }
}

export default () => ({ validateFileAgainstPolicy })
