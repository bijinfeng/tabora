import { describe, expect, it } from "vitest"

import { settingsPanelModelSchema } from "./settingsSchema"

describe("settingsPanelModelSchema", () => {
  it("accepts semantic layout, controls, status, and actions", () => {
    const result = settingsPanelModelSchema.safeParse({
      version: 1,
      ariaLabel: "Account settings",
      nodes: [
        {
          type: "group",
          title: "Account",
          children: [
            { type: "field", id: "email", label: "Email", control: "email" },
            {
              type: "field",
              id: "password",
              label: "Password",
              control: "password",
              persistence: "ephemeral",
            },
            { type: "status", label: "State", value: "Ready", tone: "success" },
            {
              type: "actions",
              actions: [{ id: "submit", label: "Submit", variant: "primary" }],
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it("rejects style and class escape hatches", () => {
    const result = settingsPanelModelSchema.safeParse({
      version: 1,
      nodes: [
        {
          type: "text",
          text: "Unsafe",
          style: { color: "red" },
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it("requires password fields to be ephemeral and forbids password defaults", () => {
    const persistentPassword = settingsPanelModelSchema.safeParse({
      version: 1,
      nodes: [{ type: "field", id: "password", label: "Password", control: "password" }],
    })
    const passwordWithValue = settingsPanelModelSchema.safeParse({
      version: 1,
      nodes: [
        {
          type: "field",
          id: "password",
          label: "Password",
          control: "password",
          persistence: "ephemeral",
          value: "must-not-cross-the-provider-boundary",
        },
      ],
    })

    expect(persistentPassword.success).toBe(false)
    expect(passwordWithValue.success).toBe(false)
  })
})
