import {
  ErrorCode,
  InternalServerError,
  InvalidPayloadError,
  isDirectusError,
} from "@directus/errors"
import { z } from "zod"
import { AttachmentInUseError, AttachmentNotFoundError } from "./errors"
import { asyncRoute, parseBody, requireUserId } from "./http"
import type {
  AttachmentPolicy,
  AttachmentRef,
  DirectusFileSummary,
  TaboraDatabase,
  TaboraEndpointContext,
  TaboraRequest,
  TaboraRouter,
} from "./types"

const attachmentIdSchema = z.uuid()
const entityTypeSchema = z.string().trim().min(1).max(128)
const entityIdSchema = z.string().trim().min(1).max(512)

const prepareAttachmentSchema = z.object({
  entity_type: entityTypeSchema,
  mime_type: z.string().trim().min(1).max(255),
  size_bytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  filename: z.string().trim().min(1).max(255),
})

const commitAttachmentSchema = z.object({
  file_id: attachmentIdSchema,
  entity_type: entityTypeSchema,
  entity_id: entityIdSchema,
})

const bindAttachmentSchema = z.object({
  entity_type: entityTypeSchema,
  entity_id: entityIdSchema,
})

const attachmentParamsSchema = z.object({
  id: attachmentIdSchema,
})

const maxSizePolicySchema = z.union([
  z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
  z.null(),
])

const attachmentPolicySchema = z.object({
  entity_type: entityTypeSchema,
  mime_whitelist: z.array(z.string().trim().min(1).max(255)).nullable(),
  max_size_bytes: maxSizePolicySchema,
})

const POLICY_COLUMNS = ["entity_type", "mime_whitelist", "max_size_bytes"] as const

const FILE_SUMMARY_FIELDS = [
  "id",
  "uploaded_by",
  "title",
  "filename_download",
  "type",
  "filesize",
] as const

type AttachmentParams = z.output<typeof attachmentParamsSchema>
type BindAttachmentBody = z.output<typeof bindAttachmentSchema>

function normalizePolicy(policy: unknown): AttachmentPolicy | null {
  if (!policy) {
    return null
  }

  const result = attachmentPolicySchema.safeParse(policy)

  if (!result.success) {
    throw new InternalServerError()
  }

  return result.data
}

function validateFileAgainstPolicy(
  file: DirectusFileSummary,
  policy: AttachmentPolicy | null,
): void {
  if (!policy) {
    return
  }

  if (
    policy.mime_whitelist &&
    (typeof file.type !== "string" || !policy.mime_whitelist.includes(file.type))
  ) {
    throw new InvalidPayloadError({
      reason: `MIME type ${String(file.type ?? "unknown")} is not allowed for ${policy.entity_type}`,
    })
  }

  const maxSize = policy.max_size_bytes
  const fileSize =
    typeof file.filesize === "number" || typeof file.filesize === "string"
      ? Number(file.filesize)
      : Number.NaN

  if (maxSize !== null && (!Number.isSafeInteger(fileSize) || fileSize < 0 || fileSize > maxSize)) {
    throw new InvalidPayloadError({
      reason: `File size exceeds maximum of ${maxSize} bytes`,
    })
  }
}

async function readPolicy(
  context: TaboraEndpointContext,
  entityType: string,
  database: TaboraDatabase = context.database,
): Promise<AttachmentPolicy | null> {
  const policy = (await database
    .select(...POLICY_COLUMNS)
    .from("attachment_policies")
    .where({ entity_type: entityType })
    .first()) as AttachmentPolicy | undefined

  return normalizePolicy(policy)
}

async function readOwnedFile(
  context: TaboraEndpointContext,
  request: TaboraRequest,
  fileId: string,
  userId: string,
  database: TaboraDatabase = context.database,
): Promise<DirectusFileSummary> {
  const schema = await context.getSchema()
  const filesService = new context.services.FilesService({
    schema,
    accountability: request.accountability ?? null,
    knex: database,
  })

  let file: DirectusFileSummary

  try {
    file = (await filesService.readOne(fileId, {
      fields: [...FILE_SUMMARY_FIELDS],
    })) as DirectusFileSummary
  } catch (error: unknown) {
    if (isDirectusError(error, ErrorCode.Forbidden)) {
      throw new AttachmentNotFoundError()
    }

    throw error
  }

  if (file.uploaded_by !== userId) {
    throw new AttachmentNotFoundError()
  }

  return file
}

async function findExactRef(
  database: TaboraDatabase,
  ref: Omit<AttachmentRef, "id">,
): Promise<AttachmentRef | undefined> {
  return (await database
    .select("id", "file_id", "owner_user_id", "entity_type", "entity_id")
    .from("attachment_refs")
    .where(ref)
    .first()) as AttachmentRef | undefined
}

async function hasOwnedRef(
  database: TaboraDatabase,
  fileId: string,
  userId: string,
): Promise<boolean> {
  const ref = await database
    .select("id")
    .from("attachment_refs")
    .where({ file_id: fileId, owner_user_id: userId })
    .first()

  return Boolean(ref)
}

async function countOwnedRefs(
  database: TaboraDatabase,
  fileId: string,
  userId: string,
): Promise<number> {
  const refs = await database
    .select("id")
    .from("attachment_refs")
    .where({ file_id: fileId, owner_user_id: userId })

  return refs.length
}

async function createRefIfMissing(
  database: TaboraDatabase,
  ref: Omit<AttachmentRef, "id">,
): Promise<void> {
  const existingRef = await findExactRef(database, ref)

  if (!existingRef) {
    await database("attachment_refs").insert(ref)
  }
}

async function lockFile(database: TaboraDatabase, fileId: string): Promise<void> {
  const file = await database
    .select("id")
    .from("directus_files")
    .where({ id: fileId })
    .forUpdate()
    .first()

  if (!file) {
    throw new AttachmentNotFoundError()
  }
}

function parseAttachmentId(params: unknown): string {
  return parseBody(attachmentParamsSchema, params).id
}

export function registerAttachmentsEndpoints(
  router: TaboraRouter,
  context: TaboraEndpointContext,
): void {
  router.post(
    "/attachments/prepare",
    asyncRoute(async (request, response) => {
      requireUserId(request)
      const payload = parseBody(prepareAttachmentSchema, request.body)
      const policy = await readPolicy(context, payload.entity_type)

      if (policy?.mime_whitelist && !policy.mime_whitelist.includes(payload.mime_type)) {
        throw new InvalidPayloadError({
          reason: `MIME type ${payload.mime_type} is not allowed for ${payload.entity_type}`,
        })
      }

      const maxSize = policy?.max_size_bytes ?? null

      if (maxSize !== null && payload.size_bytes > maxSize) {
        throw new InvalidPayloadError({
          reason: `File size exceeds maximum of ${maxSize} bytes`,
        })
      }

      return response.json({
        data: {
          entity_type: payload.entity_type,
          filename: payload.filename,
          visibility: "private",
          upload: {
            method: "directus-files",
            endpoint: "/files",
          },
          ...(policy ? { policy } : {}),
        },
      })
    }),
  )

  router.post(
    "/attachments/commit",
    asyncRoute(async (request, response) => {
      const userId = requireUserId(request)
      const payload = parseBody(commitAttachmentSchema, request.body)

      const refsCount = await context.database.transaction(async (transaction) => {
        await lockFile(transaction, payload.file_id)
        const [file, policy] = await Promise.all([
          readOwnedFile(context, request, payload.file_id, userId, transaction),
          readPolicy(context, payload.entity_type, transaction),
        ])
        validateFileAgainstPolicy(file, policy)
        await createRefIfMissing(transaction, {
          file_id: payload.file_id,
          owner_user_id: userId,
          entity_type: payload.entity_type,
          entity_id: payload.entity_id,
        })

        return countOwnedRefs(transaction, payload.file_id, userId)
      })

      return response.json({
        data: {
          file_id: payload.file_id,
          entity_type: payload.entity_type,
          entity_id: payload.entity_id,
          visibility: "private",
          refs_count: refsCount,
        },
      })
    }),
  )

  router.get(
    "/attachments/:id/access",
    asyncRoute<unknown, AttachmentParams>(async (request, response) => {
      const userId = requireUserId(request)
      const fileId = parseAttachmentId(request.params)

      if (!(await hasOwnedRef(context.database, fileId, userId))) {
        throw new AttachmentNotFoundError()
      }

      await readOwnedFile(context, request, fileId, userId)

      return response.json({
        data: {
          file_id: fileId,
          visibility: "private",
          asset_url: `/assets/${fileId}`,
        },
      })
    }),
  )

  router.post(
    "/attachments/:id/bind",
    asyncRoute<BindAttachmentBody, AttachmentParams>(async (request, response) => {
      const userId = requireUserId(request)
      const fileId = parseAttachmentId(request.params)
      const payload = parseBody(bindAttachmentSchema, request.body)

      const refsCount = await context.database.transaction(async (transaction) => {
        await lockFile(transaction, fileId)
        const [file, policy] = await Promise.all([
          readOwnedFile(context, request, fileId, userId, transaction),
          readPolicy(context, payload.entity_type, transaction),
        ])
        validateFileAgainstPolicy(file, policy)
        await createRefIfMissing(transaction, {
          file_id: fileId,
          owner_user_id: userId,
          entity_type: payload.entity_type,
          entity_id: payload.entity_id,
        })

        return countOwnedRefs(transaction, fileId, userId)
      })

      return response.json({
        data: {
          file_id: fileId,
          refs_count: refsCount,
        },
      })
    }),
  )

  router.post(
    "/attachments/:id/unbind",
    asyncRoute<BindAttachmentBody, AttachmentParams>(async (request, response) => {
      const userId = requireUserId(request)
      const fileId = parseAttachmentId(request.params)
      const payload = parseBody(bindAttachmentSchema, request.body)

      const refsCount = await context.database.transaction(async (transaction) => {
        await lockFile(transaction, fileId)
        await transaction("attachment_refs")
          .where({
            file_id: fileId,
            owner_user_id: userId,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
          })
          .del()

        return countOwnedRefs(transaction, fileId, userId)
      })

      return response.json({
        data: {
          file_id: fileId,
          refs_count: refsCount,
        },
      })
    }),
  )

  router.delete(
    "/attachments/:id",
    asyncRoute<unknown, AttachmentParams>(async (request, response) => {
      const userId = requireUserId(request)
      const fileId = parseAttachmentId(request.params)

      await context.database.transaction(async (transaction) => {
        await lockFile(transaction, fileId)
        await readOwnedFile(context, request, fileId, userId, transaction)

        const refs = await transaction
          .select("id")
          .from("attachment_refs")
          .where({ file_id: fileId })

        if (refs.length > 0) {
          throw new AttachmentInUseError()
        }

        const schema = await context.getSchema()
        const filesService = new context.services.FilesService({
          schema,
          accountability: request.accountability ?? null,
          knex: transaction,
        })
        await filesService.deleteOne(fileId)
      })

      return response.sendStatus(204)
    }),
  )

  router.get(
    "/attachments/:id/meta",
    asyncRoute<unknown, AttachmentParams>(async (request, response) => {
      const userId = requireUserId(request)
      const fileId = parseAttachmentId(request.params)

      if (!(await hasOwnedRef(context.database, fileId, userId))) {
        throw new AttachmentNotFoundError()
      }

      const file = await readOwnedFile(context, request, fileId, userId)

      return response.json({
        data: {
          file: {
            id: file.id,
            title: file.title,
            filename_download: file.filename_download,
            type: file.type,
            filesize: file.filesize,
          },
          visibility: "private",
          refs_count: await countOwnedRefs(context.database, fileId, userId),
        },
      })
    }),
  )
}
