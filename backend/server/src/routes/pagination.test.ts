import { describe, expect, it } from "vitest"

import { paginated } from "./pagination"

describe("paginated", () => {
  it("将行数据与分页元信息包装为统一信封", () => {
    expect(paginated([{ id: 1 }, { id: 2 }], 10, 50, 0)).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 10, limit: 50, offset: 0 },
    })
  })

  it("空列表也保留 meta", () => {
    expect(paginated([], 0, 20, 40)).toEqual({
      data: [],
      meta: { total: 0, limit: 20, offset: 40 },
    })
  })
})
