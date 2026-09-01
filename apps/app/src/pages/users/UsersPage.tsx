import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button, IconButton } from "@tabora/ui/button"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import type { TableColumn } from "@tabora/ui/table"
import { useMutation } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import MoreHorizontal from "lucide-solid/icons/ellipsis"
import Plus from "lucide-solid/icons/plus"
import Search from "lucide-solid/icons/search"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import {
  AdminDataTablePanel,
  type AdminDataTableActions,
} from "../../components/AdminDataTablePanel"
import { useToast } from "../../contexts/ToastContext"
import { shared } from "../shared.styles"
import { CreateUserDialog } from "./CreateUserDialog"
import { styles } from "./users.styles"
import {
  banUser,
  listUsers,
  removeUser,
  setRole,
  unbanUser,
  type AdminUser,
} from "../../server/admin/users"

const PAGE_SIZE = 20

type UsersTableParams = {
  search: string
}

export function UsersPage() {
  const [createOpen, setCreateOpen] = createSignal(false)
  const [deleteTarget, setDeleteTarget] = createSignal<AdminUser | null>(null)
  const [actionError, setActionError] = createSignal<string | null>(null)

  const { showToast } = useToast()
  let tableActions: AdminDataTableActions | undefined

  const actionMutation = useMutation(() => ({
    mutationFn: (fn: () => Promise<void>) => fn(),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      showToast({ variant: "success", title: "操作成功" })
      tableActions?.reload()
    },
    onError: (err: Error) => {
      setActionError(err.message)
      showToast({ variant: "danger", title: "操作失败", description: err.message })
    },
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      setDeleteTarget(null)
      showToast({ variant: "success", title: "用户已删除" })
      tableActions?.reload()
    },
  }))

  const columns = buildColumns({
    onSetRole: (u, role) =>
      actionMutation.mutate(() =>
        setRole({ data: { userId: u.id, role: role as "user" | "admin" } }),
      ),
    onBan: (u) =>
      actionMutation.mutate(() => banUser({ data: { userId: u.id, banReason: "管理员封禁" } })),
    onUnban: (u) => actionMutation.mutate(() => unbanUser({ data: { userId: u.id } })),
    onDelete: (u) => setDeleteTarget(u),
  })

  return (
    <div {...stylex.attrs(shared.page)}>
      <AdminDataTablePanel<AdminUser, UsersTableParams>
        queryKey={["users"]}
        request={async ({ current, pageSize, search }) => {
          const result = await listUsers({
            data: {
              limit: pageSize,
              offset: (current - 1) * pageSize,
              ...(search ? { searchValue: search } : {}),
            },
          })
          return { data: result.users, total: result.total }
        }}
        pageSize={PAGE_SIZE}
        toolbar={{
          filters: [
            {
              key: "search",
              kind: "text",
              ariaLabel: "搜索用户",
              placeholder: "按邮箱搜索",
              leadingIcon: <Search size={16} />,
              clearable: true,
              grow: true,
            },
          ],
          actions: (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              新建用户
            </Button>
          ),
          notice: (
            <Show when={actionError()}>
              <InlineError>{actionError()}</InlineError>
            </Show>
          ),
        }}
        columns={columns}
        rowKey={(u) => u.id}
        errorMessage="加载用户失败"
        empty={
          <EmptyState compact title="暂无用户" description="点击右上角新建用户，或调整搜索条件。" />
        }
        actionRef={(actions) => (tableActions = actions)}
        ariaLabel="用户列表"
      />

      <CreateUserDialog
        open={createOpen()}
        onClose={() => setCreateOpen(false)}
        onCreated={() => tableActions?.reload(true)}
      />
      <ConfirmDialog
        open={deleteTarget() !== null}
        title="删除用户"
        description={`确认删除 ${deleteTarget()?.email ?? ""}？该操作不可撤销，用户数据与会话将一并移除。`}
        confirmLabel="删除"
        loading={deleteMutation.isPending}
        error={(deleteMutation.error as Error | null)?.message ?? null}
        onConfirm={() => {
          const target = deleteTarget()
          if (target && !deleteMutation.isPending) deleteMutation.mutate(target.id)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

type ColumnHandlers = {
  onSetRole: (user: AdminUser, role: string) => void
  onBan: (user: AdminUser) => void
  onUnban: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

function isAdmin(user: AdminUser): boolean {
  return (user.role ?? "").split(",").includes("admin")
}

function RowActions(props: { user: AdminUser; handlers: ColumnHandlers }) {
  const u = props.user
  const h = props.handlers
  const items = [
    isAdmin(u)
      ? { id: "demote", label: "降为普通用户", onClick: () => h.onSetRole(u, "user") }
      : { id: "promote", label: "提升为管理员", onClick: () => h.onSetRole(u, "admin") },
    u.banned
      ? { id: "unban", label: "解除封禁", onClick: () => h.onUnban(u) }
      : { id: "ban", label: "封禁用户", onClick: () => h.onBan(u) },
    { id: "sep", separator: true as const, label: "" },
    { id: "delete", label: "删除用户", danger: true, onClick: () => h.onDelete(u) },
  ]
  return (
    <div {...stylex.attrs(shared.actionCell)}>
      <DropdownMenu items={items} align="end" triggerAs={IconButton} triggerAriaLabel="用户操作">
        <MoreHorizontal size={16} />
      </DropdownMenu>
    </div>
  )
}

function buildColumns(handlers: ColumnHandlers): TableColumn<AdminUser>[] {
  return [
    {
      key: "email",
      header: "用户",
      cell: (u) => (
        <div>
          <div {...stylex.attrs(styles.emailText)}>{u.email}</div>
          <div {...stylex.attrs(styles.mono)}>{u.name}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "角色",
      cell: (u) => (
        <Badge variant={isAdmin(u) ? "accent" : "neutral"} size="sm">
          {isAdmin(u) ? "管理员" : "普通用户"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "状态",
      cell: (u) => (
        <Badge variant={u.banned ? "danger" : "success"} size="sm">
          {u.banned ? "已封禁" : "正常"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (u) => <RowActions user={u} handlers={handlers} />,
    },
  ]
}
