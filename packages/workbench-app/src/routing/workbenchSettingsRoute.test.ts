import { describe, expect, it } from "vitest"

import {
  parseWorkbenchSettingsRoute,
  settingsHomePath,
  settingsRoutePath,
} from "./workbenchSettingsRoute"

describe("workbench settings routes", () => {
  it("maps each settings section to a stable secondary route", () => {
    expect(settingsHomePath()).toBe("/settings")
    expect(settingsRoutePath("general")).toBe("/settings/general")
    expect(parseWorkbenchSettingsRoute("/settings/appearance")).toEqual({
      kind: "settings",
      pathname: "/settings/appearance",
      section: "appearance",
    })
  })

  it("normalizes the settings entry route and trailing slashes", () => {
    expect(parseWorkbenchSettingsRoute("/settings")).toEqual({
      kind: "settings",
      pathname: "/settings",
      section: null,
    })
    expect(parseWorkbenchSettingsRoute("settings/search/")).toEqual({
      kind: "settings",
      pathname: "/settings/search",
      section: "search",
    })
  })

  it("keeps unknown paths outside the settings route and invalid sections explicit", () => {
    expect(parseWorkbenchSettingsRoute("/")).toEqual({
      kind: "workbench",
      pathname: "/",
    })
    expect(parseWorkbenchSettingsRoute("/settings/missing")).toEqual({
      kind: "settings",
      pathname: "/settings/missing",
      section: null,
    })
  })
})
