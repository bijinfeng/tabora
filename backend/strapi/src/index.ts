import type { Core } from "@strapi/strapi"

// 需要授予 Authenticated 角色的自定义 API 动作（登录用户可访问）
const AUTHENTICATED_ACTIONS = [
  "api::sync.sync.pull",
  "api::sync.sync.push",
  "api::attachment.attachment.prepare",
  "api::attachment.attachment.commit",
  "api::attachment.attachment.access",
  "api::attachment.attachment.bind",
  "api::attachment.attachment.unbind",
  // Strapi upload 插件的上传动作（附件 prepare→上传→commit 三段式的中间步）
  "plugin::upload.content-api.upload",
]

async function grantAuthenticatedActions(strapi: Core.Strapi): Promise<void> {
  const roleService = strapi.plugin("users-permissions").service("role")
  const role = await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "authenticated" } })
  if (!role) return

  const permissionQuery = strapi.db.query("plugin::users-permissions.permission")
  for (const action of AUTHENTICATED_ACTIONS) {
    const existing = await permissionQuery.findOne({ where: { action, role: role.id } })
    if (!existing) {
      await permissionQuery.create({ data: { action, role: role.id } })
    }
  }
  // 触发权限缓存刷新
  void roleService
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantAuthenticatedActions(strapi)
  },
}
