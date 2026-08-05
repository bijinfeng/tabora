import * as stylex from "@stylexjs/stylex"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type {
  SettingsFieldNode,
  SettingsNode,
  SettingsPanelModel,
  SettingsPanelProvider,
  SettingsPanelProviderContext,
  SettingsStatusTone,
} from "@tabora/plugin-api"
import { settingsPanelModelSchema } from "@tabora/plugin-api"
import { color, font, radius, space } from "@tabora/theme/tokens.stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { FieldRow } from "@tabora/ui/field-row"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { SkeletonText } from "@tabora/ui/skeleton"
import { Switch } from "@tabora/ui/switch"

export type SettingsSchemaRendererProps = {
  provider: SettingsPanelProvider
  context: SettingsPanelProviderContext
}

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    minWidth: 0,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    minWidth: 0,
  },
  group: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
    paddingBottom: space.s3,
  },
  groupHeading: {
    display: "grid",
    gap: space.s1,
  },
  groupTitle: {
    color: color.text,
    fontSize: 13,
    fontWeight: font.semibold,
    lineHeight: 1.3,
  },
  groupDescription: {
    color: color.textSubtle,
    fontSize: 11,
    lineHeight: 1.4,
    margin: 0,
  },
  text: {
    color: color.text,
    fontSize: 12,
    lineHeight: 1.45,
    margin: 0,
  },
  textMuted: {
    color: color.textMuted,
  },
  textDanger: {
    color: color.danger,
  },
  field: {
    display: "grid",
    gap: space.s1,
  },
  fieldLabel: {
    color: color.text,
    fontSize: 12,
    fontWeight: font.semibold,
  },
  fieldDescription: {
    color: color.textSubtle,
    fontSize: 11,
    lineHeight: 1.4,
    margin: 0,
  },
  status: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    gap: space.s2,
    justifyContent: "space-between",
    minHeight: 34,
    paddingBlock: space.s2,
    paddingInline: space.s3,
  },
  statusLabel: {
    color: color.textMuted,
    fontSize: 11,
  },
  statusValue: {
    color: color.text,
    fontSize: 11,
    lineHeight: 1.4,
    overflowWrap: "anywhere",
    textAlign: "right",
  },
  statusSuccess: {
    color: color.success,
  },
  statusWarning: {
    color: color.warning,
  },
  statusDanger: {
    color: color.danger,
  },
  statusAccent: {
    color: color.accent,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: space.s2,
  },
  loading: {
    display: "grid",
    gap: space.s2,
    paddingBlock: space.s2,
  },
})

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "设置内容加载失败"
}

function initialValues(nodes: SettingsNode[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const visit = (node: SettingsNode) => {
    if (node.type === "stack" || node.type === "group") {
      node.children.forEach(visit)
      return
    }
    if (node.type === "field") {
      if (node.control === "password") values[node.id] = ""
      else values[node.id] = node.value ?? (node.control === "switch" ? false : "")
    }
  }
  nodes.forEach(visit)
  return values
}

function statusValueStyle(tone: SettingsStatusTone | undefined) {
  if (tone === "success") return styles.statusSuccess
  if (tone === "warning") return styles.statusWarning
  if (tone === "danger") return styles.statusDanger
  if (tone === "accent") return styles.statusAccent
  return null
}

function statusBadgeVariant(tone: SettingsStatusTone | undefined) {
  if (tone === "success" || tone === "warning" || tone === "danger" || tone === "accent") {
    return tone
  }
  return "neutral"
}

export function SettingsSchemaRenderer(props: SettingsSchemaRendererProps) {
  const [model, setModel] = createSignal<SettingsPanelModel | null>(null)
  const [values, setValues] = createSignal<Record<string, unknown>>({})
  const [loading, setLoading] = createSignal(true)
  const [busyActionId, setBusyActionId] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const abortController = new AbortController()
  let modelRequestVersion = 0

  const abortFromParent = () => abortController.abort()
  if (props.context.signal?.aborted) abortController.abort()
  else props.context.signal?.addEventListener("abort", abortFromParent, { once: true })

  onCleanup(() => {
    props.context.signal?.removeEventListener("abort", abortFromParent)
    abortController.abort()
  })

  function providerContext(): SettingsPanelProviderContext {
    return {
      ...props.context,
      signal: abortController.signal,
      invalidate() {
        props.context.invalidate?.()
        if (!abortController.signal.aborted) void loadModel()
      },
    }
  }

  async function loadModel() {
    if (abortController.signal.aborted) return
    const requestVersion = ++modelRequestVersion
    setLoading(true)
    setError(null)
    try {
      const rawModel = await props.provider.getModel(providerContext())
      if (abortController.signal.aborted || requestVersion !== modelRequestVersion) return
      const parsed = settingsPanelModelSchema.safeParse(rawModel)
      if (!parsed.success) {
        throw new Error("设置插件返回了不受支持的页面模型")
      }
      const nextModel = parsed.data as SettingsPanelModel
      setModel(nextModel)
      setValues(initialValues(nextModel.nodes))
    } catch (cause) {
      if (abortController.signal.aborted || requestVersion !== modelRequestVersion) return
      setModel(null)
      setValues({})
      setError(messageFor(cause))
    } finally {
      if (!abortController.signal.aborted && requestVersion === modelRequestVersion) {
        setLoading(false)
      }
    }
  }

  async function dispatch(actionId: string) {
    if (busyActionId()) return
    setBusyActionId(actionId)
    setError(null)
    try {
      await props.provider.dispatch({ id: actionId, values: { ...values() } }, providerContext())
      if (abortController.signal.aborted) return
      // 包括密码在内的所有表单值只留在 renderer 内存中，每次 action 后销毁。
      setValues({})
      await loadModel()
    } catch (cause) {
      if (!abortController.signal.aborted) setError(messageFor(cause))
    } finally {
      if (!abortController.signal.aborted) setBusyActionId(null)
    }
  }

  function setFieldValue(field: SettingsFieldNode, value: string | boolean) {
    setValues((current) => ({ ...current, [field.id]: value }))
  }

  function renderField(field: SettingsFieldNode) {
    if (field.control === "switch") {
      return (
        <FieldRow
          label={field.label}
          description={field.description}
          trailing={
            <Switch
              size="sm"
              checked={Boolean(values()[field.id])}
              {...(field.disabled !== undefined ? { disabled: field.disabled } : {})}
              aria-label={field.label}
              onChange={(checked) => setFieldValue(field, checked)}
            />
          }
        />
      )
    }

    const currentValue = () => {
      const value = values()[field.id]
      return typeof value === "string" ? value : ""
    }

    return (
      <label {...stylex.attrs(styles.field)} for={`settings-schema-${field.id}`}>
        <span {...stylex.attrs(styles.fieldLabel)}>{field.label}</span>
        <Show when={field.description}>
          <p {...stylex.attrs(styles.fieldDescription)}>{field.description}</p>
        </Show>
        <Input
          id={`settings-schema-${field.id}`}
          size="sm"
          type={field.control}
          value={currentValue()}
          onInput={(value) => setFieldValue(field, value)}
          {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
          {...(field.disabled !== undefined ? { disabled: field.disabled } : {})}
          {...(field.required !== undefined ? { required: field.required } : {})}
          {...(field.minLength !== undefined ? { minLength: field.minLength } : {})}
          {...(field.autocomplete !== undefined ? { autocomplete: field.autocomplete } : {})}
          {...(field.control === "password" ? { passwordVisibilityToggle: false } : {})}
          aria-label={field.label}
          inputAttrs={{ "data-settings-schema-field": field.id }}
        />
      </label>
    )
  }

  function renderNode(node: SettingsNode) {
    if (node.type === "stack") {
      return (
        <div {...stylex.attrs(styles.stack)}>
          <For each={node.children}>{renderNode}</For>
        </div>
      )
    }
    if (node.type === "group") {
      return (
        <section {...stylex.attrs(styles.group)}>
          <Show when={node.title || node.description}>
            <div {...stylex.attrs(styles.groupHeading)}>
              <Show when={node.title}>
                <strong {...stylex.attrs(styles.groupTitle)}>{node.title}</strong>
              </Show>
              <Show when={node.description}>
                <p {...stylex.attrs(styles.groupDescription)}>{node.description}</p>
              </Show>
            </div>
          </Show>
          <For each={node.children}>{renderNode}</For>
        </section>
      )
    }
    if (node.type === "text") {
      return (
        <p
          {...stylex.attrs(
            styles.text,
            node.tone === "muted" ? styles.textMuted : null,
            node.tone === "danger" ? styles.textDanger : null,
          )}
        >
          {node.text}
        </p>
      )
    }
    if (node.type === "field") return renderField(node)
    if (node.type === "status") {
      return (
        <div {...stylex.attrs(styles.status)} data-settings-schema-status={node.tone ?? "neutral"}>
          <span {...stylex.attrs(styles.statusLabel)}>{node.label}</span>
          <span {...stylex.attrs(styles.statusValue, statusValueStyle(node.tone))}>
            {node.value}
          </span>
          <Badge size="sm" variant={statusBadgeVariant(node.tone)}>
            {node.tone === "success" ? "正常" : node.tone === "danger" ? "异常" : "状态"}
          </Badge>
        </div>
      )
    }
    return (
      <div {...stylex.attrs(styles.actions)}>
        <For each={node.actions}>
          {(action) => (
            <Button
              size="sm"
              variant={action.variant ?? "secondary"}
              disabled={action.disabled || busyActionId() !== null}
              loading={busyActionId() === action.id}
              data-settings-schema-action={action.id}
              onClick={() => void dispatch(action.id)}
            >
              {action.label}
            </Button>
          )}
        </For>
      </div>
    )
  }

  onMount(() => void loadModel())

  return (
    <div
      {...stylex.attrs(styles.root)}
      data-settings-schema-renderer
      aria-label={model()?.ariaLabel}
    >
      <Show when={loading()}>
        <div {...stylex.attrs(styles.loading)} aria-label="正在加载设置">
          <SkeletonText lines={3} />
        </div>
      </Show>
      <Show when={error()}>{(message) => <InlineError>{message()}</InlineError>}</Show>
      <Show when={!loading() && model()}>
        <For each={model()!.nodes}>{renderNode}</For>
      </Show>
    </div>
  )
}
