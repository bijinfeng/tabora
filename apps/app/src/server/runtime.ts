import { createLocalAttachmentStorage } from "./attachments/storage"
import { createAuth, type Auth } from "./auth"
import { createDb, type DbHandle } from "./db"
import { createEmailService, type EmailService } from "./email"
import { createEmailQueueProcessor, type EmailQueueProcessor } from "./emailQueueProcessor"
import { getEnv, type AppEnv } from "./env"

export type ServerRuntime = {
  env: AppEnv
  handle: DbHandle
  auth: Auth
  emailService: EmailService
  emailProcessor: EmailQueueProcessor
  storage: ReturnType<typeof createLocalAttachmentStorage>
  startedAt: Date
}

let runtimePromise: Promise<ServerRuntime> | null = null

/**
 * 进程级服务端运行时单例：迁移建表、装配 better-auth、邮件服务与附件存储，
 * 并启动邮件队列处理器。首次调用时初始化，后续复用（替代旧 main.ts 的一次性装配）。
 */
export function getRuntime(): Promise<ServerRuntime> {
  if (!runtimePromise) {
    runtimePromise = initRuntime()
  }
  return runtimePromise
}

async function initRuntime(): Promise<ServerRuntime> {
  const env = getEnv()
  const handle = createDb(env)
  await handle.migrate()

  const emailService = createEmailService(handle)
  const auth = createAuth(handle, env, emailService)
  const storage = createLocalAttachmentStorage(env.uploadsDir)

  const emailProcessor = createEmailQueueProcessor(handle, emailService)
  emailProcessor.start(5000)

  return { env, handle, auth, emailService, emailProcessor, storage, startedAt: new Date() }
}
