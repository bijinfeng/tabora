/**
 * 统一分页响应信封。
 *
 * 所有返回列表 + 总数的 admin 接口统一使用该结构，
 * 避免 {rows,total} / {records,total} / {files,total} / {data,meta} 多种形态并存。
 */
export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

/**
 * 构造分页响应信封。
 */
export function paginated<T>(
  rows: T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedResponse<T> {
  return { data: rows, meta: { total, limit, offset } }
}
