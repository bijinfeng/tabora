# Workbench App Package Agent Rules

本文件适用于 `packages/workbench-app/`，并继承仓库根 `AGENTS.md`。

## 所有权

- 本包承担跨 playground、extension 和未来 shell 复用的 workbench 应用组合：runtime/session、workspace、layout、search、appearance、surface state 与 host action 编排。
- 通用插件 contract 放 `@tabora/plugin-api`，无 UI 的跨插件目录/解析模型优先放 `@tabora/orchestrator`，通用宿主视图放 `@tabora/workbench-shell`，基础控件放 `@tabora/ui`。
- 本包不决定官方 builtin 列表或默认 preset；由 app 组合根通过 `@tabora/builtin-plugin-registry` 注入。
- 不 import `apps/*`、具体官方/community 插件实现，或用插件 ID 硬编码业务特例。

## 实现

- 修改前搜索相邻 store/state/controller/host action 和 subpath export，扩展现有领域所有者，不建立第二套状态模型。
- UI 状态、workspace 装配、plugin instance 与 plugin data 分层；不能通过一个大 store 混合所有生命周期。
- `bootstrap` 只做组合与生命周期连接；可测试的解析、状态转换和副作用边界放到既有领域模块。
- host capability 通过 adapter 或显式依赖注入；浏览器全局 API 不散落在领域状态中。
- 新 public subpath 必须有跨 shell 的真实消费者，并同步 source/publish exports、build entry 和 package boundary 测试。
- 替换 controller/store/helper 时同时移除旧调用路径，避免新旧 orchestration 并存。

## 验证

本目录变更至少运行：

```bash
pnpm --dir packages/workbench-app test
pnpm --dir packages/workbench-app build
pnpm test
pnpm check
```

bootstrap、跨 shell contract、public export、workspace/storage 或 host capability 变化追加根 `pnpm build`；surface 交互变化还需在 playground 做浏览器验证。
