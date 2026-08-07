import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import MoreHorizontal from "lucide-solid/icons/ellipsis"
import Plus from "lucide-solid/icons/plus"
import Search from "lucide-solid/icons/search"

import { CreateUserDialog } from "./CreateUserDialog"
import { DeleteUserDialog } from "./DeleteUserDialog"
import { styles } from "./users.styles"
import { banUser, listUsers, setRole, unbanUser, type AdminUser } from "./usersApi"

const PAGE_SIZE = 20

export function UsersPage() {
  const [search, setSearch] = createSignal("")
  const [offset, setOffset] = createSignal(0)
  const [createOpen, setCreateOpen] = createSignal(false)
  const [deleteTarget, setDeleteTarget] = createSignal<AdminUser | null>(null)
  const [actionError, setActionError] = createSignal<string | null>(null)

  const queryClient = useQueryClient()

  const data = useQuery(() => ({
    queryKey: ["users", { search: search(), offset: offset() }],
    queryFn: () =>
      listUsers({
        limit: PAGE_SIZE,
        offset: offset(),
        ...(search() ? { searchValue: search(), searchField: "email" } : {}),
      }),
  }))

  const actionMutation = useMutation(() => ({
    mutationFn: (fn: () => Promise<void>) => fn(),
    onMutate: () => setActionError(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: (err: Error) => setActionError(err.message),
  }))

  const columns = buildColumns({
    onSetRole: (u, role) => actionMutation.mutate(() => setRole(u.id, role)),
    onBan: (u) => actionMutation.mutate(() => banUser(u.id, "管理员封禁")),
    onUnban: (u) => actionMutation.mutate(() => unbanUser(u.id)),
    onDelete: (u) => setDeleteTarget(u),
  })

  return (
    <div {...stylex.attrs(styles.page)}>
      <div {...stylex.attrs(styles.toolbar)}>
        <div {...stylex.attrs(styles.toolbarLeft)}>
          <Input
            value={search()}
            onInput={(v) => {
              setSearch(v)
              setOffset(0)
            }}
            placeholder="按邮箱搜索"
            leadingIcon={<Search size={16} />}
            clearable
            aria-label="搜索用户"
          />
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          新建用户
        </Button>
      </div>

      <Show when={actionError()}>
        <InlineError>{actionError()}</InlineError>
      </Show>

      <UsersTable
        data={data.data}
        loading={data.isPending}
        error={data.error ?? undefined}
        columns={columns}
      />

      <Show when={data.data}>
        {(d) => (
          <Pagination
            offset={offset()}
            total={d().total}
            onPrev={() => setOffset(Math.max(0, offset() - PAGE_SIZE))}
            onNext={() => setOffset(offset() + PAGE_SIZE)}
          />
        )}
      </Show>

      <CreateUserDialog
        open={createOpen()}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: ["users"] })}
      />
      <DeleteUserDialog
        user={deleteTarget()}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void queryClient.invalidateQueries({ queryKey: ["users"] })}
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
    <div {...stylex.attrs(styles.actionCell)}>
      <DropdownMenu items={items} align="end" triggerAriaLabel="用户操作">
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

function UsersTable(props: {
  data: { users: AdminUser[]; total: number } | undefined
  loading: boolean
  error: Error | undefined
  columns: TableColumn<AdminUser>[]
}) {
  return (
    <Show
      when={!props.error}
      fallback={<InlineError>{props.error?.message ?? "加载用户失败"}</InlineError>}
    >
      <Show
        when={props.loading || (props.data && props.data.users.length > 0)}
        fallback={
          <EmptyState title="暂无用户" description="点击右上角新建用户，或调整搜索条件。" />
        }
      >
        <Table
          columns={props.columns}
          rows={props.data?.users ?? []}
          rowKey={(u) => u.id}
          aria-label="用户列表"
        />
      </Show>
    </Show>
  )
}

function Pagination(props: {
  offset: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const from = () => (props.total === 0 ? 0 : props.offset + 1)
  const to = () => Math.min(props.offset + PAGE_SIZE, props.total)
  return (
    <div {...stylex.attrs(styles.pagination)}>
      <span>
        {from()}–{to()} / 共 {props.total}
      </span>
      <Button size="sm" variant="secondary" disabled={props.offset === 0} onClick={props.onPrev}>
        上一页
      </Button>
      <Button size="sm" variant="secondary" disabled={to() >= props.total} onClick={props.onNext}>
        下一页
      </Button>
    </div>
  )
}
