import type { DbHandle } from "./db"
import type { EmailService } from "./email"

/**
 * 邮件队列后台处理器
 * 轮询 pending 邮件并通过 emailService 发送
 */
export function createEmailQueueProcessor(handle: DbHandle, emailService: EmailService) {
  let isRunning = false
  let intervalId: NodeJS.Timeout | null = null

  async function processQueue() {
    if (isRunning) return
    isRunning = true

    try {
      const pending = await handle.emailQueue.getPending(10)

      for (const email of pending) {
        try {
          await handle.emailQueue.markProcessing(email.id)

          await emailService.sendMail({
            to: email.to,
            subject: email.subject,
            html: email.html,
            ...(email.text ? { text: email.text } : {}),
          })

          await handle.emailQueue.markSent(email.id)
          console.warn(`[EmailQueue] Sent email ${email.id} to ${email.to}`)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          await handle.emailQueue.markFailed(email.id, message)
          console.error(`[EmailQueue] Failed to send email ${email.id}: ${message}`)
        }
      }
    } catch (error) {
      console.error("[EmailQueue] Queue processing error:", error)
    } finally {
      isRunning = false
    }
  }

  function start(intervalMs = 5000) {
    if (intervalId) return
    console.warn(`[EmailQueue] Starting processor with ${intervalMs}ms interval`)
    intervalId = setInterval(() => {
      processQueue().catch((err) => console.error("[EmailQueue] Unexpected error:", err))
    }, intervalMs)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      console.warn("[EmailQueue] Processor stopped")
    }
  }

  return { start, stop, processQueue }
}

export type EmailQueueProcessor = ReturnType<typeof createEmailQueueProcessor>
