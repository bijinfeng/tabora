# Tabora 数据同步后端实现路线图与 S1 设计

日期：2026-07-06

状态：设计稿（brainstorming 产出，待 writing-plans）

关联事实源：

- 需求与决策：`docs/technical/mpz35mfq-16-data-sync-prd.md`（PRD V0.2）
- 实现事实源：`docs/technical/tabora-data-sync-technical-design.md`（技术方案 V0.1）
- 回归治理：`docs/technical/tabora-regression-baseline.md`

## 0. 本文档定位

本文档是数据同步**后端实现的路线图**，并给出第一个子项目 S1 的详细设计。范围经用户确认：端到端后端，**UI 本轮不写**。后续每个子项目（S2-S6）各自走独立的 spec → plan → 实现循环。

已锁定的前置决策（不再讨论）：

- PRD §3.1：state-based 当前态 + Edge Function 网关 + 平台级加密。
- 客户端同步引擎独立成包 `@tabora/sync`（原技术方案 §6.1 待确认项，本轮拍板为独立包）。
- 迁移落地走 Supabase CLI 初始化 + `db pull` 反向生成。

已核实的环境现状：

- Supabase 项目 tabora `ajetfjtfterbkczrbjlq`（eu-central-2, Postgres 17, ACTIVE_HEALTHY）。
- 远端已建 5 表 + 每表 4 条 RLS 策略并通过 security advisors（本地迁移文件尚未生成）。
- 本地：Supabase CLI 未安装、无 `supabase/` 目录、无 Docker。

## 1. 后端工作分解（S1-S6）

```txt
S1  迁移落地与本地 Supabase 工程        [基础设施，无依赖]
S2  Edge Function 同步网关 sync-gateway   [依赖 S1]
S3  storage 增强（syncQueue/syncMeta）    [无依赖，可与 S2 并行]
S4  auth 会话层（Email OTP + 会话持有）   [依赖 S1，可与 S2/S3 并行]
S5  @tabora/sync 客户端引擎               [依赖 S2/S3/S4]
S6  bootstrap 装配集成                    [依赖 S5]
```

关键路径：S1 → S2 → S5 → S6；S3/S4 可并行插入。S2 是安全边界（token 不给插件 + 服务端过滤）的落地点，风险最高。

UI（设置中心「账号」「数据同步」页、冲突收件箱、恢复入口）明确不在本轮范围。

### 各子项目要点

- **S2 sync-gateway**：单 Edge Function 按 action 分发（register-device / push / pull / snapshot / list-devices / remove-device / list-conflicts / resolve-conflict）。服务端敏感过滤 + 危险声明拒绝 + state-based 合并 + 冲突检测。用真实 HTTP 验证。见技术方案 §5。
- **S3 storage 增强**：Dexie version bump，新增 `syncQueue` / `syncMeta` 表及 repository，不混入 pluginData / workspace 装配数据。见技术方案 §9。
- **S4 auth 会话层**：supabase-js client + Email OTP 封装；host-adapters 按宿主注入会话 storage（extension=chrome.storage，web=localStorage）；token 不出 core。见技术方案 §2.2 / §6.2。
- **S5 @tabora/sync 引擎**：changeDetector（Dexie hooks）+ localChangeQueue + syncEngine + gatewayClient + 客户端预过滤 + 权威时间戳兜底 + 增量 pull cursor + 合并/冲突模型；新增架构守卫。见技术方案 §6 / §7。
- **S6 bootstrap 集成**：workbench-app bootstrap 接入 @tabora/sync；触发时机接线；失败回退不阻塞本地工作台。见技术方案 §6.3 / §10。

## 2. S1 详细设计

### 2.1 目标

把远端已验证的 5 表 + RLS 结构落成仓库版本化迁移文件，并建立 `supabase/` 本地工程骨架，供 S2 部署 Edge Function 复用。

### 2.2 产物

- `supabase/` 目录：`config.toml` + `migrations/<timestamp>_remote_schema.sql`，进仓库版本控制。
- 迁移文件内容 = `supabase db pull` 从 tabora 远端反向生成（零漂移，方式 A）。
- 文档同步：技术方案 §13（或对应小节）标注"迁移已落地 + 文件路径"；`docs/README.md` 视情况登记 supabase 工程入口。

### 2.3 执行流程

标注 [用户] 的步骤需用户手动授权或提供凭据，计划中作为 checkpoint，不假装自动完成。

1. [用户] 安装 Supabase CLI（Homebrew），`supabase --version` 验证。
2. `supabase init` 建工程骨架。
3. [用户] `supabase link --project-ref ajetfjtfterbkczrbjlq`，需要 access token 或 database password。
4. `supabase db pull` 生成迁移文件。
5. `supabase migration list` 验证本地/远端一致。

### 2.4 边界与非目标

- 不改远端结构（已验证通过，S1 只落成文件）。
- 不含 Edge Function（S2）。
- 不碰 Dexie / 客户端（S3+）。
- 不走 Docker 路径（本地无 Docker；`db pull`、后续 `deploy --use-api` 都不需要 Docker）。

### 2.5 验证

- `supabase migration list` 显示本地迁移与远端对齐。
- 迁移文件的表名与 RLS 策略数，与远端 `pg_policies` 查询结果一致（可用 MCP `execute_sql` 复核：5 表、每表 4 策略、RLS 全开）。
- `pnpm check`（文档变更）。

对齐回归基准 L1（事实源一致性）、L6（安全、权限、数据隔离）。

### 2.6 风险

- CLI 安装和 `link` 依赖用户手动授权/提供凭据——S1 唯一阻塞点，计划显式标为 checkpoint。
- 若 `db pull` 生成的 SQL 与技术方案手写 DDL 排版不同：以远端 pull 结果为准（远端是已验证事实源），排版差异不阻塞。

## 3. 后续

S1 spec 批准后转 writing-plans 产出 S1 实现计划。S2-S6 在各自启动时再走独立的 brainstorming → spec → plan 循环，避免一次性展开未验证的下游设计。
