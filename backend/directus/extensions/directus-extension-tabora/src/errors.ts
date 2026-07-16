import { createError } from "@directus/errors"

export const AttachmentNotFoundError = createError(
  "ATTACHMENT_NOT_FOUND",
  "Attachment not found.",
  404,
)

export const AttachmentInUseError = createError(
  "ATTACHMENT_IN_USE",
  "Attachment still has active references.",
  409,
)
