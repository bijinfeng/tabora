import type {
  BrandingConfig,
  EmailTemplateType,
  RenderedTemplate,
  TemplateVariables,
} from "./types"

/**
 * 生成响应式 HTML 邮件包装器
 */
function wrapHtmlTemplate(content: string, branding: BrandingConfig): string {
  const { siteName, logoUrl, primaryColor = "#0ea5e9", footerText, contactEmail } = branding

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f5f5f5;
      color: #1f2937;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: ${primaryColor};
      padding: 32px 24px;
      text-align: center;
    }
    .header img {
      max-height: 48px;
      height: auto;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .content p {
      margin: 0 0 16px 0;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 8px 0;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
      .header {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}">` : `<h1>${siteName}</h1>`}
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${footerText || `© ${new Date().getFullYear()} ${siteName}. 保留所有权利。`}
      ${contactEmail ? `<br>联系我们：<a href="mailto:${contactEmail}" style="color: #9ca3af;">${contactEmail}</a>` : ""}
    </div>
  </div>
</body>
</html>`
}

/**
 * 邮件模板渲染器
 */
export function createTemplateRenderer(branding: BrandingConfig) {
  function render<T extends EmailTemplateType>(
    type: T,
    variables: TemplateVariables[T],
  ): RenderedTemplate {
    switch (type) {
      case "passwordReset":
        return renderPasswordReset(variables as TemplateVariables["passwordReset"])
      case "emailVerification":
        return renderEmailVerification(variables as TemplateVariables["emailVerification"])
      case "welcome":
        return renderWelcome(variables as TemplateVariables["welcome"])
      case "passwordChanged":
        return renderPasswordChanged(variables as TemplateVariables["passwordChanged"])
      case "emailChanged":
        return renderEmailChanged(variables as TemplateVariables["emailChanged"])
      case "securityAlert":
        return renderSecurityAlert(variables as TemplateVariables["securityAlert"])
      default:
        throw new Error(`Unknown template type: ${type}`)
    }
  }

  function renderPasswordReset(vars: TemplateVariables["passwordReset"]): RenderedTemplate {
    const { userName, resetUrl, expiryHours = 24 } = vars
    const greeting = userName ? `${userName}，您好！` : "您好！"

    const htmlContent = `
      <p>${greeting}</p>
      <p>您请求重置密码。请点击下方按钮完成重置：</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" class="button">重置密码</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">如果按钮无法点击，请复制以下链接到浏览器：<br><a href="${resetUrl}" style="color: #0ea5e9; word-break: break-all;">${resetUrl}</a></p>
      <p style="margin-top: 24px;">如果您没有请求重置密码，请忽略此邮件。</p>
      <p style="font-size: 12px; color: #9ca3af;">此链接将在 ${expiryHours} 小时后失效。</p>
    `

    const text = `${greeting}\n\n您请求重置密码。请访问以下链接完成重置：\n\n${resetUrl}\n\n如果您没有请求重置密码，请忽略此邮件。\n此链接将在 ${expiryHours} 小时后失效。`

    return {
      subject: `${branding.siteName} - 重置密码`,
      html: wrapHtmlTemplate(htmlContent, branding),
      text,
    }
  }

  function renderEmailVerification(vars: TemplateVariables["emailVerification"]): RenderedTemplate {
    const { userName, verificationUrl, expiryHours = 24 } = vars
    const greeting = userName ? `${userName}，您好！` : "您好！"

    const htmlContent = `
      <p>${greeting}</p>
      <p>欢迎注册 ${branding.siteName}！请点击下方按钮验证您的邮箱：</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${verificationUrl}" class="button">验证邮箱</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">如果按钮无法点击，请复制以下链接到浏览器：<br><a href="${verificationUrl}" style="color: #0ea5e9; word-break: break-all;">${verificationUrl}</a></p>
      <p style="margin-top: 24px;">如果您没有注册账号，请忽略此邮件。</p>
      <p style="font-size: 12px; color: #9ca3af;">此链接将在 ${expiryHours} 小时后失效。</p>
    `

    const text = `${greeting}\n\n欢迎注册 ${branding.siteName}！请访问以下链接验证您的邮箱：\n\n${verificationUrl}\n\n如果您没有注册账号，请忽略此邮件。\n此链接将在 ${expiryHours} 小时后失效。`

    return {
      subject: `${branding.siteName} - 验证邮箱`,
      html: wrapHtmlTemplate(htmlContent, branding),
      text,
    }
  }

  function renderWelcome(vars: TemplateVariables["welcome"]): RenderedTemplate {
    const { userName, loginUrl } = vars

    const htmlContent = `
      <p>${userName}，您好！</p>
      <p>欢迎加入 ${branding.siteName}！我们很高兴您成为我们的一员。</p>
      <p>您的账号已经创建成功，现在可以开始使用我们的服务了。</p>
      ${loginUrl ? `<p style="text-align: center; margin: 24px 0;"><a href="${loginUrl}" class="button">立即登录</a></p>` : ""}
      <p style="margin-top: 24px;">如有任何问题，欢迎随时联系我们。</p>
    `

    const text = `${userName}，您好！\n\n欢迎加入 ${branding.siteName}！我们很高兴您成为我们的一员。\n\n您的账号已经创建成功，现在可以开始使用我们的服务了。${loginUrl ? `\n\n登录地址：${loginUrl}` : ""}\n\n如有任何问题，欢迎随时联系我们。`

    return {
      subject: `欢迎加入 ${branding.siteName}`,
      html: wrapHtmlTemplate(htmlContent, branding),
      text,
    }
  }

  function renderPasswordChanged(vars: TemplateVariables["passwordChanged"]): RenderedTemplate {
    const { userName, changedAt, ipAddress } = vars

    const htmlContent = `
      <p>${userName}，您好！</p>
      <p>您的密码已成功修改。</p>
      <p style="font-size: 14px; color: #6b7280;">
        修改时间：${changedAt}
        ${ipAddress ? `<br>IP 地址：${ipAddress}` : ""}
      </p>
      <p style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e;">
        如果这不是您本人的操作，您的账号可能已被盗用，请立即联系我们。
      </p>
    `

    const text = `${userName}，您好！\n\n您的密码已成功修改。\n\n修改时间：${changedAt}${ipAddress ? `\nIP 地址：${ipAddress}` : ""}\n\n如果这不是您本人的操作，您的账号可能已被盗用，请立即联系我们。`

    return {
      subject: `${branding.siteName} - 密码已修改`,
      html: wrapHtmlTemplate(htmlContent, branding),
      text,
    }
  }

  function renderEmailChanged(vars: TemplateVariables["emailChanged"]): RenderedTemplate {
    const { userName, oldEmail, newEmail, changedAt } = vars

    const htmlContent = `
      <p>${userName}，您好！</p>
      <p>您的邮箱地址已成功修改。</p>
      <p style="font-size: 14px; color: #6b7280;">
        原邮箱：${oldEmail}<br>
        新邮箱：${newEmail}<br>
        修改时间：${changedAt}
      </p>
      <p style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e;">
        如果这不是您本人的操作，您的账号可能已被盗用，请立即联系我们。
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">此邮件已同时发送到原邮箱和新邮箱。</p>
    `

    const text = `${userName}，您好！\n\n您的邮箱地址已成功修改。\n\n原邮箱：${oldEmail}\n新邮箱：${newEmail}\n修改时间：${changedAt}\n\n如果这不是您本人的操作，您的账号可能已被盗用，请立即联系我们。\n\n此邮件已同时发送到原邮箱和新邮箱。`

    return {
      subject: `${branding.siteName} - 邮箱已修改`,
      html: wrapHtmlTemplate(htmlContent, branding),
      text,
    }
  }

  function renderSecurityAlert(vars: TemplateVariables["securityAlert"]): RenderedTemplate {
    const { userName, alertType, alertDetails, occurredAt, ipAddress, location } = vars

    const htmlContent = `
      <p>${userName}，您好！</p>
      <p style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;">
        <strong>安全警报：${alertType}</strong>
      </p>
      <p style="margin-top: 16px;">${alertDetails}</p>
      <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
        发生时间：${occurredAt}
        ${ipAddress ? `<br>IP 地址：${ipAddress}` : ""}
        ${location ? `<br>位置：${location}` : ""}
      </p>
      <p style="margin-top: 24px;">如果这不是您本人的操作，请立即修改密码并联系我们。</p>
    `

    const text = `${userName}，您好！\n\n安全警报：${alertType}\n\n${alertDetails}\n\n发生时间：${occurredAt}${ipAddress ? `\nIP 地址：${ipAddress}` : ""}${location ? `\n位置：${location}` : ""}\n\n如果这不是您本人的操作，请立即修改密码并联系我们。`

    return {
      subject: `${branding.siteName} - 安全警报`,
      html: wrapHtmlTemplate(htmlContent, branding),
      text,
    }
  }

  return { render }
}

export type TemplateRenderer = ReturnType<typeof createTemplateRenderer>
