import { afterEach, describe, expect, it, vi } from "vitest"

import { formatAdminTimestamp } from "./formatTimestamp"

describe("formatAdminTimestamp", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("formats epoch seconds and parseable timestamp strings with the browser locale", () => {
    const format = vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("formatted")

    expect(formatAdminTimestamp(1_704_067_200)).toBe("formatted")
    expect(formatAdminTimestamp("2024-01-01T00:00:00.000Z")).toBe("formatted")
    expect(format).toHaveBeenCalledTimes(2)
  })

  it("keeps invalid timestamp values visible", () => {
    expect(formatAdminTimestamp("not-a-date")).toBe("not-a-date")
  })
})
