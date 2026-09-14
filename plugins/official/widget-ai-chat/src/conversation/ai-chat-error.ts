export function aiChatErrorCopy(error: Error | undefined): {
  title: string
  hint: string
  openSettings: boolean
} {
  const code = (error as { code?: string } | undefined)?.code
  const entry = code ? ERROR_COPY[code] : undefined
  if (entry) {
    const detail = error?.message?.trim()
    return {
      title: entry.title,
      hint: code === "ai_request_rejected" && detail && detail !== entry.hint ? detail : entry.hint,
      openSettings: code !== "ai_provider_failed" && code !== "ai_request_rejected",
    }
  }
  return { title: "请求失败", hint: error?.message ?? "请稍后重试。", openSettings: false }
}

const ERROR_COPY: Record<string, { title: string; hint: string }> = {
  ai_not_configured: {
    title: "AI 还未配置",
    hint: "在设置中心 AI 面板配置模型后即可对话。",
  },
  ai_auth_required: {
    title: "登录后可使用内置模型",
    hint: "登录 Tabora 账号，或改用自定义提供商。",
  },
  ai_model_unavailable: {
    title: "模型暂不可用",
    hint: "请检查 AI 设置中的模型配置。",
  },
  ai_request_rejected: {
    title: "请求被拒绝",
    hint: "输入或对话历史超出限制，请缩短内容后重试。",
  },
  ai_provider_failed: {
    title: "请求失败",
    hint: "AI 服务暂时不可用，请稍后重试。",
  },
}
