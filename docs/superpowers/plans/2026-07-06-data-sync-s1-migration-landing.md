# 数据同步 S1：迁移落地与本地 Supabase 工程 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把远端 tabora 项目已验证的 5 表 + RLS 结构，通过 Supabase CLI `db pull` 落成仓库版本化迁移文件，并建立 `supabase/` 本地工程骨架。

**Architecture:** 走 Supabase CLI 初始化 + link + `db pull` 反向生成迁移（方式 A，零漂移）。不改远端结构，不碰客户端/Dexie，不用 Docker。本计划含两个必须用户手动操作的 checkpoint（装 CLI、link 项目提供凭据），执行者到此必须停下等待用户，不得伪造完成。

**Tech Stack:** Supabase CLI，PostgreSQL，Supabase MCP（用于跨核对远端结构）。

## Global Constraints

- 目标项目：tabora，project-ref `ajetfjtfterbkczrbjlq`（eu-central-2，Postgres 17）。
- 远端事实源为准：`db pull` 结果与技术方案手写 DDL 排版不同时，以 pull 结果为准，不回改远端。
- 迁移文件不含任何密钥；access token / database password 绝不写入仓库任何文件。
- `supabase/.temp/`、`supabase/.branches/` 等 CLI 本地态目录必须被 gitignore。
- 本地无 Docker：只用不依赖 Docker 的 CLI 路径（`db pull --linked`），不运行 `supabase start`。
- 不改远端 schema（S1 只落文件）；不含 Edge Function（S2）；不碰 storage/客户端（S3+）。
- 验证事实源：远端 5 表（profiles / sync_devices / synced_records / sync_snapshots / sync_conflicts），每表 4 条 RLS 策略，RLS 全开。
- 文档变更后运行 `pnpm check`。

---

### Task 1: 安装 Supabase CLI 并验证

**Files:**

- 无仓库文件变更（本地工具安装）。

**Interfaces:**

- Consumes: 无。
- Produces: 可用的 `supabase` CLI 命令，供 Task 2-4 使用。

- [ ] **Step 1 [需用户操作]: 请用户安装 Supabase CLI**

执行者不要自行 `brew install`（需用户授权系统级安装）。向用户输出以下选项之一，并停下等待确认：

```bash
# macOS Homebrew（推荐）
brew install supabase/tap/supabase

# 或：Homebrew 不可用时，用官方 tarball / 其他方式
# 见 https://supabase.com/docs/guides/local-development/cli/getting-started
```

Expected: 用户回复已安装完成。

- [ ] **Step 2: 验证 CLI 可用**

Run: `supabase --version`
Expected: 打印版本号（例如 `2.x.x`）。若报 "command not found"，回到 Step 1 让用户确认安装路径已进 PATH。

- [ ] **Step 3: 确认版本满足已知门槛**

Supabase skill 已知门槛：`db query` 需 v2.79.0+，`db advisors` 需 v2.81.3+。S1 只用 `init` / `link` / `db pull` / `migration list`，无版本硬门槛，但记录版本供后续 S2 参考。

Run: `supabase --version`
Expected: 记下版本号，无需动作。本任务无代码、无提交。

---

### Task 2: 初始化 supabase 工程并加固 gitignore

**Files:**

- Create: `supabase/config.toml`（由 `supabase init` 生成）
- Modify: `.gitignore`（追加 supabase 本地态忽略项）

**Interfaces:**

- Consumes: Task 1 的可用 CLI。
- Produces: `supabase/` 工程目录，供 Task 3 link 和 Task 4 pull 使用。

- [ ] **Step 1: 在仓库根初始化 supabase 工程**

Run: `supabase init`
Expected: 生成 `supabase/config.toml`（可能还有 `supabase/.gitignore`、`supabase/functions/` 等）。若提示已存在则跳过。

若交互式询问是否生成 VS Code / IntelliJ settings，回答 no（本仓库不需要）。

- [ ] **Step 2: 检查 init 产物**

Run: `ls -la supabase/ && cat supabase/config.toml | head -20`
Expected: 存在 `config.toml`，其中 `project_id` 字段可能为占位；确认没有生成任何含密钥的文件。

- [ ] **Step 3: 加固根 .gitignore**

把以下内容追加到 `.gitignore`（若 `supabase init` 已生成 `supabase/.gitignore` 覆盖了这些，仍在根 gitignore 补一份，双保险）。用编辑工具追加，不用 shell 重定向：

```gitignore
# Supabase CLI 本地态（不进仓库）
supabase/.temp/
supabase/.branches/
```

- [ ] **Step 4: 确认无密钥文件将被提交**

Run: `git status --short --untracked-files=all`
Expected: 只出现 `supabase/config.toml`、可能的 `supabase/.gitignore`、修改后的 `.gitignore`。确认没有 `.env`、access token、password 文件出现在列表中。

- [ ] **Step 5: 提交工程骨架**

```bash
git add supabase/config.toml supabase/.gitignore .gitignore
git commit -m "chore(sync): 初始化 supabase CLI 工程骨架"
```

注：若 `supabase/.gitignore` 不存在则从 add 列表中去掉它。

---

### Task 3: link 到远端 tabora 项目

**Files:**

- Modify: `supabase/config.toml`（link 可能写入 `project_id`）
- 本地生成 `supabase/.temp/`（已 gitignore，不提交）

**Interfaces:**

- Consumes: Task 2 的 `supabase/` 工程。
- Produces: 已 link 的项目上下文，供 Task 4 `db pull` 使用。

- [ ] **Step 1 [需用户操作]: 请用户提供 link 凭据**

`supabase link` 需要认证。执行者不要猜测或伪造凭据。向用户说明两种方式，停下等待：

```bash
# 方式一：先登录（浏览器 OAuth），再 link
supabase login
supabase link --project-ref ajetfjtfterbkczrbjlq

# 方式二：用 access token 环境变量（用户提供 token 时）
# 用户在自己终端执行，token 不进仓库、不进聊天记录
export SUPABASE_ACCESS_TOKEN=<用户的 token>
supabase link --project-ref ajetfjtfterbkczrbjlq
```

`link` 过程可能提示输入 database password（用于后续 `db pull`）。这是用户手动输入项，执行者不代填。

Expected: 用户回复 link 成功（输出类似 `Finished supabase link.`）。

- [ ] **Step 2: 验证 link 状态**

Run: `supabase projects list`
Expected: 输出中 tabora / `ajetfjtfterbkczrbjlq` 一行带有 link 标记（● 或 linked 列）。若未标记，回 Step 1 排查登录/token。

- [ ] **Step 3: 确认无凭据进入待提交区**

Run: `git status --short --untracked-files=all`
Expected: `supabase/.temp/` 不出现（已 gitignore）。若 `config.toml` 有 `project_id` 变更，仅此一处，且不含密钥。无提交（config 变更留到 Task 4 一起提交）。

---

### Task 4: db pull 生成迁移文件并跨核对

**Files:**

- Create: `supabase/migrations/<timestamp>_remote_schema.sql`（由 `db pull` 生成）
- Modify: `supabase/config.toml`（若 Task 3 有变更，一并提交）

**Interfaces:**

- Consumes: Task 3 的已 link 项目。
- Produces: 版本化迁移文件（S1 最终交付物），供 S2 及后续复用。

- [ ] **Step 1: 从远端拉取 schema 生成迁移**

Run: `supabase db pull`
Expected: 生成 `supabase/migrations/<timestamp>_remote_schema.sql`。若提示输入 database password，由用户输入（[需用户操作]，执行者不代填）。若提示 "no schema changes" 说明本地已有等价迁移，检查 `supabase/migrations/` 是否已存在文件。

- [ ] **Step 2: 检查迁移文件内容覆盖 5 表 + RLS**

Run: `rg -n 'create table|enable row level security|create policy' supabase/migrations/*_remote_schema.sql`
Expected: 出现 5 个 `create table`（profiles / sync_devices / synced_records / sync_snapshots / sync_conflicts）、5 个 `enable row level security`、20 个 `create policy`（每表 4 条）。

若数量不符：说明远端与预期不一致，停下报告差异，不要手改迁移文件掩盖问题。

- [ ] **Step 3: 用 MCP 跨核对远端真实结构（权威验证）**

用 Supabase MCP `execute_sql`（project_id `ajetfjtfterbkczrbjlq`）执行：

```sql
select t.tablename, t.rowsecurity as rls_enabled, count(p.policyname) as policy_count
from pg_tables t
left join pg_policies p on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename, t.rowsecurity
order by t.tablename;
```

Expected: 5 行，每行 `rls_enabled=true`、`policy_count=4`。与 Step 2 迁移文件计数一致，则迁移文件忠实反映远端。

- [ ] **Step 4: 验证本地迁移与远端对齐**

Run: `supabase migration list`
Expected: 迁移出现在 Local 与 Remote 两列并对齐（时间戳一致，无仅本地/仅远端的差异行）。

- [ ] **Step 5: 提交迁移文件**

```bash
git add supabase/migrations/ supabase/config.toml
git commit -m "chore(sync): 落地数据同步 schema 迁移文件（db pull 自远端）"
```

---

### Task 5: 同步事实源文档

**Files:**

- Modify: `docs/technical/tabora-data-sync-technical-design.md`（标注迁移已落地 + 路径）
- Modify: `docs/README.md`（视情况登记 supabase 工程入口）

**Interfaces:**

- Consumes: Task 4 生成的迁移文件路径。
- Produces: 与实现对齐的事实源文档。

- [ ] **Step 1: 在技术方案标注迁移已落地**

在 `docs/technical/tabora-data-sync-technical-design.md` §3（数据库 Schema）开头或 §13（验证入口）处，追加一句说明迁移文件已生成及其路径，例如：

```markdown
> 落地状态（2026-07-06）：本节 5 表 + RLS 已在远端 tabora 项目（`ajetfjtfterbkczrbjlq`）验证通过，并经 `supabase db pull` 落成迁移文件 `supabase/migrations/<timestamp>_remote_schema.sql`。后续结构变更走 `execute_sql` 迭代 + `db pull` 重新生成迁移。
```

把 `<timestamp>` 替换为 Task 4 的真实文件名。

- [ ] **Step 2: 在 docs/README.md 登记 supabase 工程入口（若合适）**

检查 `docs/README.md` 事实源表是否需要新增一行指向 `supabase/`。若认为迁移由技术方案文档覆盖已足够，可跳过并在提交信息说明。避免过度登记。

- [ ] **Step 3: 运行文档检查**

Run: `pnpm exec vp check --fix docs/technical/tabora-data-sync-technical-design.md docs/README.md`
Expected: `Formatting completed`。

- [ ] **Step 4: 运行全量 check**

Run: `pnpm check`
Expected: 通过（既有的 `packages/ui/src/primitives/select/select.tsx` 格式化报错是进入前既有状态，非本计划引入，可忽略；除此之外应无新增报错）。

- [ ] **Step 5: 提交文档同步**

```bash
git add docs/technical/tabora-data-sync-technical-design.md docs/README.md
git commit -m "docs(sync): 标注 S1 迁移已落地并登记工程入口"
```

---

## 完成标准（S1 Done）

- `supabase/` 工程骨架进仓库，`config.toml` 无密钥。
- `supabase/migrations/<timestamp>_remote_schema.sql` 忠实反映远端 5 表 + 20 条 RLS 策略。
- `supabase migration list` 本地/远端对齐。
- MCP 跨核对：5 表、RLS 全开、每表 4 策略。
- 事实源文档标注迁移落地路径。
- `.gitignore` 覆盖 CLI 本地态，无凭据入库。
- 对齐回归基准 L1（事实源一致性）、L6（数据隔离）。

## 非目标（明确不在 S1）

- Edge Function `sync-gateway`（S2）。
- Dexie `syncQueue` / `syncMeta`（S3）。
- auth 会话层（S4）。
- `@tabora/sync` 包（S5）。
- bootstrap 集成（S6）。
- 任何 UI。
