/**
 * 邮件模板系统类型定义
 */

/** 支持的邮件模板类型 */
export type EmailTemplateType =
  | "passwordReset"
  | "emailVerification"
  | "welcome"
  | "passwordChanged"
  | "emailChanged"
  | "securityAlert"

/** 模板变量映射 */
export type TemplateVariables = {
  passwordReset: {
    userName?: string
    resetUrl: string
    expiryHours?: number
  }
  emailVerification: {
    userName?: string
    verificationUrl: string
    expiryHours?: number
  }
  welcome: {
    userName: string
    loginUrl?: string
  }
  passwordChanged: {
    userName: string
    changedAt: string
    ipAddress?: string
  }
  emailChanged: {
    userName: string
    oldEmail: string
    newEmail: string
    changedAt: string
  }
  securityAlert: {
    userName: string
    alertType: string
    alertDetails: string
    occurredAt: string
    ipAddress?: string
    location?: string
  }
}

/** 模板渲染结果 */
export interface RenderedTemplate {
  subject: string
  html: string
  text: string
}

/** 品牌配置 */
export interface BrandingConfig {
  siteName: string
  logoUrl?: string
  primaryColor?: string
  footerText?: string
  contactEmail?: string
}
