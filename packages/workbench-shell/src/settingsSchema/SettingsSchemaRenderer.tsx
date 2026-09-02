import * as stylex from "@stylexjs/stylex"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type {
  SettingsFieldNode,
  SettingsNode,
  SettingsPanelModel,
  SettingsPanelProviderContext,
} from "@tabora/plugin-api"
import { settingsPanelModelSchema } from "@tabora/plugin-api"
import { InlineError } from "@tabora/ui/inline-error"
import { SkeletonText } from "@tabora/ui/skeleton"
import type { SettingsSchemaRendererProps } from "./types"
import { styles } from "./styles"
import { messageFor, initialValues } from "./utils"
import { renderField as createFieldRenderer } from "./FieldRenderer"
import { renderNodeContent } from "./NodeRenderer"

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
      const result = await props.provider.getModel(providerContext())
      if (abortController.signal.aborted) return
      if (requestVersion !== modelRequestVersion) return
      const parsed = settingsPanelModelSchema.safeParse(result)
      if (!parsed.success) {
        setError("设置插件返回了不受支持的页面模型")
        return
      }
      const panelModel = parsed.data as SettingsPanelModel
      setModel(panelModel)
      setValues(initialValues(panelModel.nodes))
      props.onNavigationChange?.(panelModel.navigation ?? null)
    } catch (e) {
      if (abortController.signal.aborted) return
      if (requestVersion !== modelRequestVersion) return
      setError(messageFor(e))
    } finally {
      if (!abortController.signal.aborted && requestVersion === modelRequestVersion) {
        setLoading(false)
      }
    }
  }

  async function dispatch(actionId: string) {
    if (!props.provider.dispatch) return
    setBusyActionId(actionId)
    try {
      await props.provider.dispatch({ id: actionId, values: values() }, providerContext())
      if (!abortController.signal.aborted) await loadModel()
    } catch (e) {
      setError(messageFor(e))
    } finally {
      if (!abortController.signal.aborted) setBusyActionId(null)
    }
  }

  function setFieldValue(field: SettingsFieldNode, value: string | boolean) {
    setValues((current) => ({ ...current, [field.id]: value }))
  }

  function renderField(field: SettingsFieldNode) {
    return createFieldRenderer({ field, model, values, setFieldValue })
  }

  function renderNode(node: SettingsNode) {
    return renderNodeContent({
      node,
      model,
      busyActionId,
      dispatch,
      renderField,
      renderNode,
    })
  }

  onMount(() => void loadModel())
  onCleanup(() => props.onNavigationChange?.(null))

  return (
    <div
      {...stylex.attrs(styles.root, model()?.layout === "account" && styles.accountRoot)}
      data-settings-schema-renderer
      data-settings-schema-layout={model()?.layout ?? "default"}
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
