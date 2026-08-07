# SMTP 邮件发送端到端验证

## 前置条件

1. 启动服务器：`pnpm dev`
2. 准备测试用 SMTP 服务器（推荐使用 Mailtrap、Gmail App Password 或本地 mailhog）

## 验证步骤

### 1. 配置 SMTP 设置

通过管理后台或 API 配置 SMTP：

```bash
# 获取当前管理员 session token
# 先登录管理后台，从浏览器 DevTools > Application > Cookies 获取 better-auth.session_token

curl -X PUT http://localhost:3000/admin-api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{
    "smtpHost": "smtp.example.com",
    "smtpPort": 587,
    "smtpFrom": "noreply@tabora.dev",
    "smtpUser": "your-smtp-user",
    "smtpPassword": "your-smtp-password"
  }'
```

或者通过管理后台 UI：

- 访问 http://localhost:5174/settings（假设 admin 运行在 5174）
- 滚动到"邮件发送服务"区域
- 填写 SMTP 配置
- 点击保存

### 2. 创建测试用户

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

注意：如果 `signupEnabled` 为 false，需要通过管理员创建用户：

```bash
curl -X POST http://localhost:3000/api/auth/admin/create-user \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=ADMIN_SESSION_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "role": "user"
  }'
```

### 3. 触发密码重置

```bash
curl -X POST http://localhost:3000/api/auth/forget-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "redirectTo": "http://localhost:5173/reset-password"
  }'
```

### 4. 验证邮件接收

检查 test@example.com 邮箱（或 SMTP 测试服务面板）：

- [ ] 收到来自配置的 smtpFrom 地址的邮件
- [ ] 邮件主题为 `Tabora - 重置密码`（或自定义的 siteName）
- [ ] 邮件包含重置密码链接
- [ ] 链接格式正确：`http://localhost:5173/reset-password?token=...&callbackURL=...`

### 5. 验证 SMTP 配置变更后缓存重置

```bash
# 修改 SMTP 配置（例如改端口）
curl -X PUT http://localhost:3000/admin-api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=ADMIN_SESSION_TOKEN" \
  -d '{"smtpPort": 465}'

# 再次触发密码重置，验证新配置生效
curl -X POST http://localhost:3000/api/auth/forget-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "redirectTo": "http://localhost:5173/reset-password"}'
```

## 预期结果

✅ SMTP 配置从 settings 表动态读取  
✅ better-auth 密码重置触发邮件发送  
✅ 邮件内容包含重置链接和站点名称  
✅ SMTP 配置变更后立即生效（缓存重置）  
✅ SMTP 未配置时返回友好错误提示

## 常见问题

### SMTP 配置不完整

错误：`SMTP 配置不完整，请前往系统设置配置邮件发送服务`

解决：确保 smtpHost、smtpUser、smtpPassword 都已配置且非空。

### 邮件发送失败

检查：

1. SMTP 服务器地址和端口是否正确
2. 用户名和密码是否正确
3. 防火墙是否允许出站 SMTP 连接
4. 查看服务器日志中的详细错误信息

### 密码字段显示"已配置"

这是正常的安全设计。密码字段：

- GET 返回空字符串 + `smtpPasswordConfigured: true`
- PUT 时空字符串表示"不修改现有密码"
- 只有提交非空值才会更新密码
