/** 管理服务 API 基址；开发默认本地 @tabora/server，部署时用 VITE_ADMIN_API_BASE_URL 覆盖。 */
export const ADMIN_API_BASE_URL: string =
  import.meta.env.VITE_ADMIN_API_BASE_URL ?? "http://localhost:4000"
