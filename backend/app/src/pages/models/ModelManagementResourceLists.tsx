import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { For, Show } from "solid-js"
import Activity from "lucide-solid/icons/activity"
import Pencil from "lucide-solid/icons/pencil"
import Plus from "lucide-solid/icons/plus"
import Power from "lucide-solid/icons/power"
import Trash2 from "lucide-solid/icons/trash-2"

import type { AdminAiModel, AdminAiProvider, ResourceStatus } from "./model-management.types"
import { statusBadge } from "./model-management.types"
import { styles } from "./model-management.styles"

export function ViewTab(props: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.selected}
      {...stylex.attrs(styles.tab, props.selected && styles.tabActive)}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export function ModelList(props: {
  models: AdminAiModel[]
  loading: boolean
  onCreate: () => void
  onEdit: (model: AdminAiModel) => void
  onTest: (id: string) => void
  onStatus: (id: string, status: "active" | "disabled") => void
  onDelete: (model: AdminAiModel) => void
}) {
  return (
    <>
      <div {...stylex.attrs(styles.toolbar)}>
        <span {...stylex.attrs(styles.toolbarCopy)}>
          模型上线前须先通过测试，并归属已启用的 Provider 连接。
        </span>
        <Button variant="primary" onClick={props.onCreate}>
          <Plus size={16} /> 新增模型
        </Button>
      </div>
      <section {...stylex.attrs(styles.resourceList)} aria-label="模型目录">
        <Show
          when={props.models.length > 0}
          fallback={
            <p {...stylex.attrs(styles.emptyCopy)}>尚无模型。先添加 Provider，再创建模型草稿。</p>
          }
        >
          <For each={props.models}>
            {(model) => (
              <ModelRow
                model={model}
                loading={props.loading}
                onEdit={() => props.onEdit(model)}
                onTest={props.onTest}
                onStatus={props.onStatus}
                onDelete={() => props.onDelete(model)}
              />
            )}
          </For>
        </Show>
      </section>
    </>
  )
}

function ModelRow(props: {
  model: AdminAiModel
  loading: boolean
  onEdit: () => void
  onTest: (id: string) => void
  onStatus: (id: string, status: "active" | "disabled") => void
  onDelete: () => void
}) {
  const badge = statusBadge(props.model.status as ResourceStatus)
  return (
    <div {...stylex.attrs(styles.resourceRow)}>
      <div {...stylex.attrs(styles.resourceMain)}>
        <span {...stylex.attrs(styles.resourceName)}>{props.model.label}</span>
        <span {...stylex.attrs(styles.resourceMeta)}>
          {props.model.id} · {props.model.providerLabel} ·{" "}
          {props.model.lastTestStatus === "passed" ? "已测试" : "待测试"}
        </span>
      </div>
      <Badge variant={badge.variant} size="sm">
        {badge.label}
      </Badge>
      <div {...stylex.attrs(styles.rowActions)}>
        <Button size="mini" variant="secondary" onClick={props.onEdit}>
          <Pencil size={12} /> 编辑
        </Button>
        <Button
          size="mini"
          variant="secondary"
          loading={props.loading}
          onClick={() => props.onTest(props.model.id)}
        >
          <Activity size={12} /> 测试
        </Button>
        <Button
          size="mini"
          variant="secondary"
          loading={props.loading}
          onClick={() =>
            props.onStatus(props.model.id, props.model.status === "active" ? "disabled" : "active")
          }
        >
          <Power size={12} /> {props.model.status === "active" ? "下线" : "上线"}
        </Button>
        <Button
          size="mini"
          variant="danger-subtle"
          aria-label={`删除 ${props.model.id}`}
          onClick={props.onDelete}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  )
}

export function ProviderList(props: {
  providers: AdminAiProvider[]
  loading: boolean
  onCreate: () => void
  onEdit: (provider: AdminAiProvider) => void
  onTest: (id: string) => void
  onStatus: (id: string, status: "active" | "disabled") => void
  onDelete: (provider: AdminAiProvider) => void
}) {
  return (
    <>
      <div {...stylex.attrs(styles.toolbar)}>
        <span {...stylex.attrs(styles.toolbarCopy)}>
          Provider 连接可供多个模型复用；启用连接不等于将模型发布给用户。
        </span>
        <Button variant="primary" onClick={props.onCreate}>
          <Plus size={16} /> 新增 Provider
        </Button>
      </div>
      <section {...stylex.attrs(styles.resourceList)} aria-label="Provider 列表">
        <Show
          when={props.providers.length > 0}
          fallback={
            <p {...stylex.attrs(styles.emptyCopy)}>
              尚无 Provider。创建后可添加模型草稿并测试连接。
            </p>
          }
        >
          <For each={props.providers}>
            {(provider) => {
              const badge = statusBadge(provider.status as ResourceStatus, true)
              return (
                <div {...stylex.attrs(styles.resourceRow)}>
                  <div {...stylex.attrs(styles.resourceMain)}>
                    <span {...stylex.attrs(styles.resourceName)}>{provider.label}</span>
                    <span {...stylex.attrs(styles.resourceMeta)}>
                      {provider.id} · {provider.baseUrl} · 凭据
                      {provider.credentialConfigured ? "已配置" : "未配置"} · {provider.modelCount}{" "}
                      个模型
                    </span>
                  </div>
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>
                  <div {...stylex.attrs(styles.rowActions)}>
                    <Button size="mini" variant="secondary" onClick={() => props.onEdit(provider)}>
                      <Pencil size={12} /> 配置
                    </Button>
                    <Button
                      size="mini"
                      variant="secondary"
                      loading={props.loading}
                      onClick={() => props.onTest(provider.id)}
                    >
                      <Activity size={12} /> 测试
                    </Button>
                    <Button
                      size="mini"
                      variant="secondary"
                      loading={props.loading}
                      onClick={() =>
                        props.onStatus(
                          provider.id,
                          provider.status === "active" ? "disabled" : "active",
                        )
                      }
                    >
                      <Power size={12} /> {provider.status === "active" ? "停用" : "启用"}
                    </Button>
                    <Button
                      size="mini"
                      variant="danger-subtle"
                      aria-label={`删除 ${provider.id}`}
                      onClick={() => props.onDelete(provider)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              )
            }}
          </For>
        </Show>
      </section>
    </>
  )
}
