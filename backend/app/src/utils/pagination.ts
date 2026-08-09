/**
 * 统一分页响应信封，与后端 server routes 对齐。
 */
export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}
