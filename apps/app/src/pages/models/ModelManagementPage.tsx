import * as stylex from "@stylexjs/stylex"
import { InlineError } from "@tabora/ui/inline-error"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { Show, createSignal } from "solid-js"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import { AdminPageLayout } from "../../components/AdminPageLayout"
import { useToast } from "../../contexts/ToastContext"
import {
  createModel,
  createProvider,
  deleteModel,
  deleteProvider,
  discoverProviderModels,
  listModelManagement,
  setModelStatus,
  setProviderStatus,
  testModel,
  testProvider,
  updateModel,
  updateProvider,
} from "../../server/admin/models"
import { ModelEditorDrawer, ProviderEditorDrawer } from "./ModelManagementEditors"
import { ModelList, ProviderList, ViewTab } from "./ModelManagementResourceLists"
import type {
  AdminAiModel,
  AdminAiProvider,
  ModelManagementView,
  ModelInputModality,
  ProviderApi,
  TestState,
} from "./model-management.types"
import { styles } from "./model-management.styles"

export function ModelManagementPage() {
  const [view, setView] = createSignal<ModelManagementView>("models")
  const [modelOpen, setModelOpen] = createSignal(false)
  const [providerOpen, setProviderOpen] = createSignal(false)
  const [editingModel, setEditingModel] = createSignal<AdminAiModel | null>(null)
  const [editingProvider, setEditingProvider] = createSignal<AdminAiProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<
    | { kind: "model"; resource: AdminAiModel }
    | { kind: "provider"; resource: AdminAiProvider }
    | null
  >(null)
  const [actionError, setActionError] = createSignal<string | null>(null)
  const [modelProvider, setModelProvider] = createSignal("")
  const [upstreamModelId, setUpstreamModelId] = createSignal("")
  const [modelLabel, setModelLabel] = createSignal("")
  const [modelInputModalities, setModelInputModalities] = createSignal<ModelInputModality[]>([
    "text",
    "image",
  ])
  const [savedModelId, setSavedModelId] = createSignal<string | null>(null)
  const [modelTest, setModelTest] = createSignal<TestState>("idle")
  const [discoveredModels, setDiscoveredModels] = createSignal<string[]>([])
  const [discovering, setDiscovering] = createSignal(false)
  const [modelError, setModelError] = createSignal<string | null>(null)
  const [providerId, setProviderId] = createSignal("")
  const [providerLabel, setProviderLabel] = createSignal("")
  const [baseUrl, setBaseUrl] = createSignal("")
  const [apiKey, setApiKey] = createSignal("")
  const [providerApi, setProviderApi] = createSignal<ProviderApi>("chat-completions")
  const [providerError, setProviderError] = createSignal<string | null>(null)

  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const data = useQuery(() => ({ queryKey: ["model-management"], queryFn: listModelManagement }))
  const action = useMutation(() => ({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
    onMutate: () => setActionError(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["model-management"] }),
    onError: (error: Error) => {
      setActionError(error.message)
      showToast({ variant: "danger", title: "操作失败", description: error.message })
    },
  }))
  const providers = () => data.data?.providers ?? []
  const models = () => data.data?.models ?? []
  const modelIdPreview = () =>
    upstreamModelId().trim()
      ? `${modelProvider()}:${upstreamModelId().trim()}`
      : "将在输入模型名后生成"

  async function execute(operation: () => Promise<unknown>, title: string): Promise<boolean> {
    try {
      await action.mutateAsync(operation)
      showToast({ variant: "success", title })
      return true
    } catch {
      return false
    }
  }

  function openModel(model?: AdminAiModel) {
    setEditingModel(model ?? null)
    setModelProvider(
      model?.providerId ?? providers().find((provider) => provider.status !== "disabled")?.id ?? "",
    )
    setUpstreamModelId(model?.upstreamModelId ?? "")
    setModelLabel(model?.label ?? "")
    setModelInputModalities(model?.inputModalities ?? ["text", "image"])
    setSavedModelId(model?.id ?? null)
    setModelTest(model?.lastTestStatus ?? "idle")
    setDiscoveredModels([])
    setModelError(null)
    setModelOpen(true)
  }

  function openProvider(provider?: AdminAiProvider) {
    setEditingProvider(provider ?? null)
    setProviderId(provider?.id ?? "")
    setProviderLabel(provider?.label ?? "")
    setBaseUrl(provider?.baseUrl ?? "")
    setProviderApi(provider?.api ?? "chat-completions")
    setApiKey("")
    setProviderError(null)
    setProviderOpen(true)
  }

  async function saveProvider() {
    const existing = editingProvider()
    if (!providerId().trim() || !providerLabel().trim() || !baseUrl().trim()) {
      setProviderError("请填写 Provider ID、显示名称和 Base URL")
      return
    }
    if (!existing && !apiKey().trim()) {
      setProviderError("新增 Provider 必须写入 API Key；保存后不会回显")
      return
    }
    const saved = await execute(
      () =>
        existing
          ? updateProvider({
              data: {
                id: existing.id,
                label: providerLabel().trim(),
                baseUrl: baseUrl().trim(),
                api: providerApi(),
                ...(apiKey().trim() ? { apiKey: apiKey().trim() } : {}),
              },
            })
          : createProvider({
              data: {
                id: providerId().trim(),
                label: providerLabel().trim(),
                baseUrl: baseUrl().trim(),
                apiKey: apiKey().trim(),
                api: providerApi(),
              },
            }),
      existing ? "Provider 配置已保存" : "Provider 已保存为草稿",
    )
    if (saved) setProviderOpen(false)
  }

  async function saveModel(): Promise<string | null> {
    if (!modelProvider() || !upstreamModelId().trim() || !modelLabel().trim()) {
      setModelError("请选择 Provider 并填写上游模型名和显示名称")
      return null
    }
    const id = savedModelId()
    if (id) {
      return (await execute(
        () =>
          updateModel({
            data: { id, label: modelLabel().trim(), inputModalities: modelInputModalities() },
          }),
        "模型显示名称已保存",
      ))
        ? id
        : null
    }
    try {
      const result = (await action.mutateAsync(() =>
        createModel({
          data: {
            providerId: modelProvider(),
            upstreamModelId: upstreamModelId().trim(),
            label: modelLabel().trim(),
            inputModalities: modelInputModalities(),
          },
        }),
      )) as { id: string }
      setSavedModelId(result.id)
      await queryClient.invalidateQueries({ queryKey: ["model-management"] })
      return result.id
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "保存模型失败")
      return null
    }
  }

  async function testNewModel() {
    const id = await saveModel()
    if (!id) return
    setModelTest("testing")
    setModelTest(
      (await execute(() => testModel({ data: { id } }), "模型测试通过")) ? "passed" : "idle",
    )
  }

  async function discoverModels() {
    if (!modelProvider()) {
      setModelError("请先选择 Provider")
      return
    }
    setDiscovering(true)
    setModelError(null)
    try {
      const result = await discoverProviderModels({ data: { id: modelProvider() } })
      setDiscoveredModels(result.models)
      showToast({ variant: "success", title: `已获取 ${result.models.length} 个模型` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取模型列表失败"
      setModelError(message)
      showToast({ variant: "danger", title: "获取模型列表失败", description: message })
    } finally {
      setDiscovering(false)
    }
  }

  async function publishNewModel() {
    const id = await saveModel()
    if (!id) return
    if (modelTest() !== "passed") {
      setModelError("请先完成连接测试，再上线模型")
      return
    }
    if (await execute(() => setModelStatus({ data: { id, status: "active" } }), "模型已上线")) {
      setModelOpen(false)
    }
  }

  function deletionDescription() {
    const target = deleteTarget()
    if (!target) return ""
    if (target.kind === "model") return `模型「${target.resource.id}」将从用户目录与网关路由移除。`
    return `Provider「${target.resource.id}」及其 ${target.resource.modelCount} 个模型将被逻辑删除，保存的凭据材料会被立即清除。`
  }

  return (
    <AdminPageLayout
      title="模型管理"
      description="Provider 管理连接与加密凭据；模型目录决定哪些能力对用户发布。"
    >
      <div {...stylex.attrs(styles.tabBar)} role="tablist" aria-label="模型管理视图">
        <ViewTab selected={view() === "models"} onClick={() => setView("models")}>
          模型目录
        </ViewTab>
        <ViewTab selected={view() === "providers"} onClick={() => setView("providers")}>
          Provider 连接
        </ViewTab>
      </div>
      <Show when={actionError()}>{(error) => <InlineError>{error()}</InlineError>}</Show>
      <Show
        when={!data.isPending}
        fallback={<p {...stylex.attrs(styles.helper)}>正在加载模型目录…</p>}
      >
        <Show
          when={view() === "models"}
          fallback={
            <ProviderList
              providers={providers()}
              loading={action.isPending}
              onCreate={() => openProvider()}
              onEdit={openProvider}
              onTest={(id) =>
                void execute(() => testProvider({ data: { id } }), "Provider 测试通过")
              }
              onStatus={(id, status) =>
                void execute(
                  () => setProviderStatus({ data: { id, status } }),
                  status === "active" ? "Provider 已启用" : "Provider 已停用",
                )
              }
              onDelete={(provider) => setDeleteTarget({ kind: "provider", resource: provider })}
            />
          }
        >
          <ModelList
            models={models()}
            loading={action.isPending}
            onCreate={() => openModel()}
            onEdit={openModel}
            onTest={(id) => void execute(() => testModel({ data: { id } }), "模型测试通过")}
            onStatus={(id, status) =>
              void execute(
                () => setModelStatus({ data: { id, status } }),
                status === "active" ? "模型已上线" : "模型已下线",
              )
            }
            onDelete={(model) => setDeleteTarget({ kind: "model", resource: model })}
          />
        </Show>
      </Show>

      <ModelEditorDrawer
        open={modelOpen()}
        editing={editingModel() !== null}
        providers={providers}
        providerId={modelProvider}
        setProviderId={setModelProvider}
        upstreamModelId={upstreamModelId}
        label={modelLabel}
        setLabel={setModelLabel}
        inputModalities={modelInputModalities}
        setInputModalities={setModelInputModalities}
        savedModelId={savedModelId}
        modelIdPreview={modelIdPreview}
        testState={modelTest}
        discoveredModels={discoveredModels}
        discovering={discovering()}
        error={modelError}
        loading={action.isPending}
        onClose={() => setModelOpen(false)}
        onSaveDraft={() => void saveModel().then((id) => id && setModelOpen(false))}
        onPublish={() => void publishNewModel()}
        onTest={() => void testNewModel()}
        onDiscover={() => void discoverModels()}
        onSelectDiscoveredModel={(id) => {
          if (!id) return
          setUpstreamModelId(id)
          if (!modelLabel().trim()) setModelLabel(id)
        }}
      />
      <ProviderEditorDrawer
        open={providerOpen()}
        editing={editingProvider() !== null}
        id={providerId}
        setId={setProviderId}
        label={providerLabel}
        setLabel={setProviderLabel}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        api={providerApi}
        setApi={setProviderApi}
        apiKey={apiKey}
        setApiKey={setApiKey}
        error={providerError}
        loading={action.isPending}
        onClose={() => setProviderOpen(false)}
        onSave={() => void saveProvider()}
      />
      <ConfirmDialog
        open={deleteTarget() !== null}
        title={deleteTarget()?.kind === "provider" ? "删除 Provider" : "删除模型"}
        description={deletionDescription()}
        confirmLabel="删除"
        loading={action.isPending}
        error={action.error instanceof Error ? action.error.message : null}
        onConfirm={() => {
          const target = deleteTarget()
          if (!target) return
          void execute(
            () =>
              target.kind === "provider"
                ? deleteProvider({ data: { id: target.resource.id } })
                : deleteModel({ data: { id: target.resource.id } }),
            target.kind === "provider" ? "Provider 已删除" : "模型已删除",
          ).then((success) => success && setDeleteTarget(null))
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </AdminPageLayout>
  )
}
