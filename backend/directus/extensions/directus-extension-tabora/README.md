# directus-extension-tabora

Tabora 的内部 Directus endpoint 扩展，提供认证适配、会话管理和私有附件引用接口。

## 路由

- `/auth/*`：注册、登录、刷新、退出、当前用户、密码重置和会话撤销。
- `/attachments/*`：上传策略检查、附件引用、访问检查、元数据和删除。

## 设计约束

- 通过 Directus `UsersService`、`AuthenticationService` 和 `FilesService` 操作核心资源。
- 请求体使用 Zod 校验，错误交给 Directus 全局错误处理中间件。
- 会话接口不返回原始 token，只暴露 SHA-256 摘要形式的 session id。
- 附件提交、绑定、读取和删除按当前用户校验文件归属。
- 附件 policy 在 prepare 和 commit/bind 阶段都会校验，客户端不能绕过。

## 开发

```bash
pnpm typecheck
pnpm build
pnpm validate
```

Endpoint 测试位于 `backend/directus/tests/endpoints/`，直接导入扩展源码。
