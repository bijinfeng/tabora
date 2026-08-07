import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

import type { DbHandle } from "./db"
import { createTemplateRenderer } from "./email-templates"
import type { BrandingConfig, EmailTemplateType, TemplateVariables } from "./email-templates"

/**
 * SMTP 邮件发送层。
 * 从 settings 动态读取配置，延迟创建 transporter。
 * 支持响应式邮件模板系统。
 */
export function createEmailService(handle: DbHandle) {
  let cachedTransporter: Transporter | null = null
  let cachedRenderer: ReturnType<typeof createTemplateRenderer> | null = null

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

  async function getRenderer(): Promise<ReturnType<typeof createTemplateRenderer>> {
    if (cachedRenderer) return cachedRenderer

    const siteName = await handle.settings.get("siteName")
    const contactEmail = await handle.settings.get("contactEmail")

    const branding: BrandingConfig = {
      siteName,
      ...(contactEmail && { contactEmail }),
      primaryColor: "#0ea5e9",
    }

    cachedRenderer = createTemplateRenderer(branding)
    return cachedRenderer
  }

  /** 发送邮件（简单封装，支持 HTML） */
  async function sendMail(options: { to: string; subject: string; text?: string; html?: string }) {
    try {
      const transporter = await getTransporter()
      const from = await handle.settings.get("smtpFrom")
      const info = await transporter.sendMail({ from, ...options })
      console.warn(`[EmailService] Email sent successfully: ${info.messageId} to ${options.to}`)
      return info
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[EmailService] Failed to send email to ${options.to}: ${message}`)
      throw new Error(`邮件发送失败: ${message}`)
    }
  }

  /** 使用模板发送邮件 */
  async function sendTemplatedEmail<T extends EmailTemplateType>(
    to: string,
    templateType: T,
    variables: TemplateVariables[T],
  ) {
    try {
      const renderer = await getRenderer()
      const { subject, html, text } = renderer.render(templateType, variables)
      return await sendMail({ to, subject, html, text })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(
        `[EmailService] Failed to send templated email (${templateType}) to ${to}: ${message}`,
      )
      throw new Error(`邮件发送失败: ${message}`)
    }
  }

  /** 重置缓存（设置变更后调用） */
  function resetCache() {
    cachedTransporter = null
    cachedRenderer = null
  }

  return { sendMail, sendTemplatedEmail, resetCache }
}

export type EmailService = ReturnType<typeof createEmailService>
