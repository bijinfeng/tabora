import { createSignal, Show } from "solid-js"
import * as stylex from "@stylexjs/stylex"
import type { PluginPermission } from "@tabora/plugin-api"
import { assessPermissionRisk, type PermissionRiskLevel } from "@tabora/plugin-api"
import { color, radius, shadow, space, zIndex } from "@tabora/theme/tokens.stylex"

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
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: zIndex.modal,
  },
  dialog: {
    backgroundColor: color.surface,
    borderRadius: radius.panel,
    padding: space.s6,
    maxWidth: "500px",
    width: "90%",
    boxShadow: shadow.floating,
  },
  header: {
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: space.s4,
    color: color.text,
  },
  content: {
    marginBottom: space.s6,
    lineHeight: 1.6,
    color: color.text,
  },
  pluginName: {
    fontWeight: 600,
    color: color.text,
  },
  permissionDetail: {
    marginTop: space.s4,
    padding: space.s3,
    borderRadius: radius.control,
    backgroundColor: color.surfaceSoft,
  },
  riskBadge: {
    display: "inline-block",
    padding: `${space.s1} ${space.s2}`,
    borderRadius: radius.r1,
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: space.s2,
  },
  riskLow: {
    backgroundColor: "rgb(var(--tbr-color-success) / 0.14)",
    color: color.success,
  },
  riskMedium: {
    backgroundColor: "rgb(var(--tbr-color-warning) / 0.16)",
    color: color.warning,
  },
  riskHigh: {
    backgroundColor: color.dangerSoft,
    color: color.danger,
  },
  riskCritical: {
    backgroundColor: color.dangerSoft,
    color: color.danger,
  },
  permissionDescription: {
    color: color.textSecondary,
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  reasonText: {
    marginTop: space.s3,
    fontStyle: "italic",
    color: color.textSecondary,
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  actions: {
    display: "flex",
    gap: space.s2,
    justifyContent: "flex-end",
  },
  button: {
    padding: `${space.s2} ${space.s4}`,
    borderRadius: radius.control,
    borderStyle: "none",
    borderWidth: 0,
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonSecondary: {
    backgroundColor: color.surfaceSoft,
    color: color.text,
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
  },
  buttonPrimary: {
    backgroundColor: color.accent,
    color: color.inverse,
    ":hover": {
      backgroundColor: color.accentHover,
    },
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    marginTop: space.s4,
    fontSize: "14px",
    color: color.textSecondary,
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
