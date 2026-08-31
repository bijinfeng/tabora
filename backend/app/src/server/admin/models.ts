import { createServerFn } from "@tanstack/solid-start"
import { z } from "zod"

import { adminAuthMiddleware, auditAdminAction, idFrom } from "./middleware"

const providerIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{2,40}$/)
const resourceIdSchema = z.string().min(1).max(201)
const providerInputSchema = z.object({
  id: providerIdSchema,
  label: z.string().trim().min(1).max(80),
  baseUrl: z.string().trim().url().max(500),
  apiKey: z.string().trim().min(1).max(4096),
})
const updateProviderSchema = providerInputSchema.extend({
  apiKey: z.string().trim().max(4096).optional(),
})
const modelInputSchema = z.object({
  providerId: providerIdSchema,
  upstreamModelId: z.string().trim().min(1).max(160),
  label: z.string().trim().min(1).max(120),
})
const updateModelSchema = z.object({
  id: resourceIdSchema,
  label: z.string().trim().min(1).max(120),
})

export const listModelManagement = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(async () => (await import("./modelActions")).listModelManagementAction())

export const createProvider = createServerFn({ method: "POST" })
  .validator(providerInputSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/ai-providers",
      resourceType: "ai_provider",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).createProviderAction(data))

export const updateProvider = createServerFn({ method: "POST" })
  .validator(updateProviderSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "PUT /admin-api/ai-providers",
      resourceType: "ai_provider",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) =>
    (await import("./modelActions")).updateProviderAction({
      id: data.id,
      label: data.label,
      baseUrl: data.baseUrl,
      ...(data.apiKey ? { apiKey: data.apiKey } : {}),
    }),
  )

export const createModel = createServerFn({ method: "POST" })
  .validator(modelInputSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({ action: "POST /admin-api/ai-models", resourceType: "ai_model" }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).createModelAction(data))

export const updateModel = createServerFn({ method: "POST" })
  .validator(updateModelSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "PUT /admin-api/ai-models",
      resourceType: "ai_model",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).updateModelAction(data))

const statusSchema = z.object({ id: resourceIdSchema, status: z.enum(["active", "disabled"]) })

export const setProviderStatus = createServerFn({ method: "POST" })
  .validator(statusSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/ai-providers/status",
      resourceType: "ai_provider",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) =>
    (await import("./modelActions")).setProviderStatusAction(data.id, data.status),
  )

export const setModelStatus = createServerFn({ method: "POST" })
  .validator(statusSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/ai-models/status",
      resourceType: "ai_model",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) =>
    (await import("./modelActions")).setModelStatusAction(data.id, data.status),
  )

export const deleteProvider = createServerFn({ method: "POST" })
  .validator(z.object({ id: providerIdSchema }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/ai-providers",
      resourceType: "ai_provider",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).deleteProviderAction(data.id))

export const deleteModel = createServerFn({ method: "POST" })
  .validator(z.object({ id: resourceIdSchema }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/ai-models",
      resourceType: "ai_model",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).deleteModelAction(data.id))

export const testModel = createServerFn({ method: "POST" })
  .validator(z.object({ id: resourceIdSchema }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/ai-models/test",
      resourceType: "ai_model",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).testModelAction(data.id))

export const testProvider = createServerFn({ method: "POST" })
  .validator(z.object({ id: providerIdSchema }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/ai-providers/test",
      resourceType: "ai_provider",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }) => (await import("./modelActions")).testProviderAction(data.id))

export const discoverProviderModels = createServerFn({ method: "POST" })
  .validator(z.object({ id: providerIdSchema }))
  .middleware([adminAuthMiddleware])
  .handler(async ({ data }) =>
    (await import("./modelActions")).discoverProviderModelsAction(data.id),
  )
