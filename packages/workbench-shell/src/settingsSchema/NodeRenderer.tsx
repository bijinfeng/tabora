import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { For, Show } from "solid-js"
import type { Accessor } from "solid-js"
import type {
  SettingsNode,
  SettingsFieldNode,
  SettingsPanelModel,
  SettingsActionNode,
} from "@tabora/plugin-api"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { FieldRow } from "@tabora/ui/field-row"
import { SegmentedControl } from "@tabora/ui/segmented-control"
import { styles } from "./styles"
import { statusValueStyle, statusBadgeVariant, rowMetaStyle } from "./utils"

type NodeRendererProps = {
  node: SettingsNode
  model: Accessor<SettingsPanelModel | null>
  busyActionId: Accessor<string | null>
  dispatch: (actionId: string) => void
  renderField: (field: SettingsFieldNode) => JSX.Element
  renderNode: (node: SettingsNode) => JSX.Element
}

function actionButton(
  action: SettingsActionNode,
  options: {
    busyActionId: Accessor<string | null>
    dispatch: (id: string) => void
    fullWidth?: boolean
  },
) {
  return (
    <Button
      size="sm"
      variant={action.variant ?? "secondary"}
      onClick={() => options.dispatch(action.id)}
      disabled={action.disabled ?? options.busyActionId() === action.id}
      loading={options.busyActionId() === action.id}
      data-settings-schema-action={action.id}
      {...(options.fullWidth ? { fullWidth: true } : {})}
    >
      {action.label}
    </Button>
  )
}

export function renderNodeContent(props: NodeRendererProps): JSX.Element {
  const { node, model, busyActionId, dispatch, renderField, renderNode } = props

  if (node.type === "stack") {
    return (
      <div {...stylex.attrs(styles.stack)} data-settings-schema-stack>
        <For each={node.children}>{renderNode}</For>
      </div>
    )
  }

  if (node.type === "group") {
    const accountLayout = model()?.layout === "account"
    return (
      <section
        {...stylex.attrs(styles.group, accountLayout && styles.accountGroup)}
        data-settings-schema-group
      >
        <Show when={node.title || node.description || node.meta}>
          <div {...stylex.attrs(styles.groupHeading)}>
            <Show when={node.title || node.meta}>
              <div {...stylex.attrs(styles.groupTitleRow)}>
                <Show when={node.title}>
                  <strong {...stylex.attrs(styles.groupTitle)}>{node.title}</strong>
                </Show>
                <Show when={node.meta}>
                  <span {...stylex.attrs(styles.groupMeta)}>{node.meta}</span>
                </Show>
              </div>
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

  const dispatchAction = (actionId: string) => dispatch(actionId)

  if (node.type === "row") {
    const trailing =
      node.meta || node.action ? (
        <>
          <Show when={node.meta}>
            {(meta) =>
              node.metaVariant === "badge" ? (
                <Badge size="sm" variant={statusBadgeVariant(node.metaTone)}>
                  {meta()}
                </Badge>
              ) : (
                <span {...stylex.attrs(styles.rowMeta, rowMetaStyle(node.metaTone))}>{meta()}</span>
              )
            }
          </Show>
          <Show when={node.action}>
            {(action) => actionButton(action(), { busyActionId, dispatch: dispatchAction })}
          </Show>
        </>
      ) : undefined

    return (
      <div data-settings-schema-row={node.label}>
        <FieldRow
          label={node.label}
          {...(node.description !== undefined ? { description: node.description } : {})}
          trailing={trailing}
        />
      </div>
    )
  }

  if (node.type === "status") {
    return (
      <div
        {...stylex.attrs(styles.status, model()?.layout === "account" && styles.accountStatus)}
        data-settings-schema-status={node.tone ?? "neutral"}
      >
        <span {...stylex.attrs(styles.statusLabel)}>{node.label}</span>
        <span
          {...stylex.attrs(
            styles.statusValue,
            statusValueStyle(node.tone),
            model()?.layout === "account" && styles.accountStatusValue,
          )}
        >
          {node.value}
        </span>
        <Show when={model()?.layout !== "account"}>
          <Badge size="sm" variant={statusBadgeVariant(node.tone)}>
            {node.tone === "success" ? "正常" : node.tone === "danger" ? "异常" : "状态"}
          </Badge>
        </Show>
      </div>
    )
  }

  if (node.layout === "segmented") {
    const options = node.actions.map((action) => ({
      value: action.id,
      label: action.label,
      ...(action.disabled !== undefined ? { disabled: action.disabled } : {}),
    }))
    return (
      <div data-settings-schema-actions="segmented">
        <SegmentedControl
          value={node.actions.find((action) => action.pressed)?.id ?? node.actions[0]?.id ?? ""}
          options={options}
          onChange={dispatchAction}
          size="sm"
          fullWidth
          aria-label="账号操作"
        />
      </div>
    )
  }

  if (node.layout === "form") {
    const primary = node.actions[0]
    const secondary = node.actions.slice(1)
    if (!primary) return null
    return (
      <div {...stylex.attrs(styles.accountActions)} data-settings-schema-actions="form">
        <Show when={node.description || secondary.length > 0}>
          <div {...stylex.attrs(styles.accountActionsInline)}>
            <Show when={node.description}>
              <p {...stylex.attrs(styles.accountActionNote)}>{node.description}</p>
            </Show>
            <For each={secondary}>
              {(action) =>
                actionButton(action, {
                  busyActionId,
                  dispatch: dispatchAction,
                })
              }
            </For>
          </div>
        </Show>
        {actionButton(primary, {
          busyActionId,
          dispatch: dispatchAction,
          fullWidth: true,
        })}
      </div>
    )
  }

  return (
    <div {...stylex.attrs(styles.actions)}>
      <For each={node.actions}>
        {(action) => actionButton(action, { busyActionId, dispatch: dispatchAction })}
      </For>
    </div>
  )
}
