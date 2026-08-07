import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

import type { DbHandle } from "./db"

/**
 * SMTP 邮件发送层。
 * 从 settings 动态读取配置，延迟创建 transporter。
 */
export function createEmailService(handle: DbHandle) {
  let cachedTransporter: Transporter | null = null

  async function getTransporter(): Promise<Transporter> {
    if (cachedTransporter) return cachedTransporter

    const host = await handle.settings.get("smtpHost")
    const port = await handle.settings.get("smtpPort")
    const user = await handle.settings.get("smtpUser")
    const password = await handle.settings.get("smtpPassword")

    if (!host || !user || !password) {
      throw new Error("SMTP 配置不完整，请前往系统设置配置邮件发送服务")
    }

    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    })

    return cachedTransporter
  }

  /** 发送邮件（简单封装，支持 HTML） */
  async function sendMail(options: { to: string; subject: string; text?: string; html?: string }) {
    const transporter = await getTransporter()
    const from = await handle.settings.get("smtpFrom")
    return transporter.sendMail({ from, ...options })
  }

  /** 重置缓存（设置变更后调用） */
  function resetCache() {
    cachedTransporter = null
  }

  return { sendMail, resetCache }
}

export type EmailService = ReturnType<typeof createEmailService>
