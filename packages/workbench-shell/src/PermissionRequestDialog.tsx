import { createSignal, Show } from "solid-js"
import * as stylex from "@stylexjs/stylex"
import type { PluginPermission } from "@tabora/plugin-api"
import { assessPermissionRisk, type PermissionRiskLevel } from "@tabora/plugin-api"

export type PermissionRequestDialogProps = {
  pluginId: string
  pluginName: string
  permission: PluginPermission
  reason?: string
  onResponse(granted: boolean, remember: boolean): void
  onClose(): void
}

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: "var(--surface-primary)",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
  },
  header: {
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "16px",
    color: "var(--text-primary)",
  },
  content: {
    marginBottom: "24px",
    lineHeight: 1.6,
  },
  pluginName: {
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  permissionDetail: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "6px",
    backgroundColor: "var(--surface-secondary)",
  },
  riskBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  riskLow: {
    backgroundColor: "var(--status-success-background, #e6f4ea)",
    color: "var(--status-success-text, #137333)",
  },
  riskMedium: {
    backgroundColor: "var(--status-warning-background, #fef7e0)",
    color: "var(--status-warning-text, #b06000)",
  },
  riskHigh: {
    backgroundColor: "var(--status-error-background, #fce8e6)",
    color: "var(--status-error-text, #c5221f)",
  },
  riskCritical: {
    backgroundColor: "var(--status-error-background, #fce8e6)",
    color: "var(--status-error-text, #c5221f)",
  },
  permissionDescription: {
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  reasonText: {
    marginTop: "12px",
    fontStyle: "italic",
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  buttonSecondary: {
    backgroundColor: "var(--surface-secondary)",
    color: "var(--text-primary)",
    ":hover": {
      backgroundColor: "var(--surface-tertiary)",
    },
  },
  buttonPrimary: {
    backgroundColor: "var(--accent-primary)",
    color: "white",
    ":hover": {
      backgroundColor: "var(--accent-primary-hover)",
    },
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
})

const RISK_LABELS: Record<PermissionRiskLevel, string> = {
  low: "低风险",
  medium: "中等风险",
  high: "高风险",
  critical: "严重风险",
}

export function PermissionRequestDialog(props: PermissionRequestDialogProps) {
  const [remember, setRemember] = createSignal(false)
  const assessment = () => assessPermissionRisk(props.permission)

  const riskStyle = () => {
    const risk = assessment().risk
    return risk === "low"
      ? styles.riskLow
      : risk === "medium"
        ? styles.riskMedium
        : risk === "high"
          ? styles.riskHigh
          : styles.riskCritical
  }

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <div {...stylex.attrs(styles.overlay)} onClick={handleOverlayClick}>
      <div {...stylex.attrs(styles.dialog)} role="dialog" aria-labelledby="permission-title">
        <div {...stylex.attrs(styles.header)} id="permission-title">
          权限请求
        </div>

        <div {...stylex.attrs(styles.content)}>
          <p>
            插件 <span {...stylex.attrs(styles.pluginName)}>{props.pluginName}</span> 请求以下权限：
          </p>

          <div {...stylex.attrs(styles.permissionDetail)}>
            <div {...stylex.attrs(styles.riskBadge, riskStyle())}>
              {RISK_LABELS[assessment().risk]}
            </div>
            <div {...stylex.attrs(styles.permissionDescription)}>{assessment().description}</div>
          </div>

          <Show when={props.reason}>
            <div {...stylex.attrs(styles.reasonText)}>原因：{props.reason}</div>
          </Show>

          <label {...stylex.attrs(styles.checkbox)}>
            <input
              type="checkbox"
              checked={remember()}
              onChange={(e) => setRemember(e.currentTarget.checked)}
            />
            <span>记住我的选择（总是允许）</span>
          </label>
        </div>

        <div {...stylex.attrs(styles.actions)}>
          <button
            {...stylex.attrs(styles.button, styles.buttonSecondary)}
            onClick={() => props.onResponse(false, false)}
          >
            拒绝
          </button>
          <button
            {...stylex.attrs(styles.button, styles.buttonSecondary)}
            onClick={() => props.onResponse(true, false)}
          >
            仅本次允许
          </button>
          <button
            {...stylex.attrs(styles.button, styles.buttonPrimary)}
            onClick={() => props.onResponse(true, remember())}
          >
            允许
          </button>
        </div>
      </div>
    </div>
  )
}
