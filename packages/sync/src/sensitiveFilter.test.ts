import { describe, expect, it } from "vitest"
import { rejectSensitiveFields, isSafeToSync, SensitiveFieldError } from "./sensitiveFilter"

describe("rejectSensitiveFields", () => {
  it("allows clean payloads", () => {
    const payload = {
      name: "My Workspace",
      settings: {
        theme: "dark",
        notifications: true,
      },
      items: [{ id: "1", title: "Task 1" }],
    }

    expect(() => rejectSensitiveFields(payload)).not.toThrow()
  })

  it("rejects apiKey field", () => {
    const payload = {
      name: "Plugin Config",
      apiKey: "sk-1234567890",
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
    expect(() => rejectSensitiveFields(payload)).toThrow("apiKey")
  })

  it("rejects token field (case insensitive)", () => {
    const payload = {
      name: "Auth Config",
      accessToken: "eyJhbGciOiJIUzI1NiIs...",
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
    expect(() => rejectSensitiveFields(payload)).toThrow("accessToken")
  })

  it("rejects password field", () => {
    const payload = {
      username: "user@example.com",
      password: "secret123",
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
    expect(() => rejectSensitiveFields(payload)).toThrow("password")
  })

  it("rejects secret field", () => {
    const payload = {
      config: {
        clientSecret: "abc123",
      },
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
    expect(() => rejectSensitiveFields(payload)).toThrow("clientSecret")
  })

  it("rejects Unix file paths", () => {
    const payload = {
      name: "Document",
      filepath: "/Users/admin/Documents/secret.txt",
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
    expect(() => rejectSensitiveFields(payload)).toThrow("filepath")
  })

  it("rejects Windows file paths", () => {
    const payload = {
      name: "Document",
      path: "C:\\Users\\admin\\Documents\\secret.txt",
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
  })

  it("rejects file:// URLs", () => {
    const payload = {
      name: "Document",
      url: "file:///Users/admin/Documents/secret.txt",
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
  })

  it("rejects nested sensitive fields", () => {
    const payload = {
      workspace: {
        name: "My Workspace",
        plugins: [
          {
            id: "plugin-1",
            config: {
              apiKey: "sk-1234567890",
            },
          },
        ],
      },
    }

    expect(() => rejectSensitiveFields(payload)).toThrow(SensitiveFieldError)
    expect(() => rejectSensitiveFields(payload)).toThrow("workspace.plugins[0].config.apiKey")
  })

  it("allows relative paths", () => {
    const payload = {
      name: "Document",
      path: "documents/notes.txt",
    }

    expect(() => rejectSensitiveFields(payload)).not.toThrow()
  })

  it("allows URL-like strings without file://", () => {
    const payload = {
      name: "Link",
      url: "https://example.com/page",
    }

    expect(() => rejectSensitiveFields(payload)).not.toThrow()
  })
})

describe("isSafeToSync", () => {
  it("returns true for clean payloads", () => {
    const payload = {
      name: "My Workspace",
      settings: { theme: "dark" },
    }

    expect(isSafeToSync(payload)).toBe(true)
  })

  it("returns false for payloads with sensitive fields", () => {
    const payload = {
      name: "Plugin Config",
      apiKey: "sk-1234567890",
    }

    expect(isSafeToSync(payload)).toBe(false)
  })

  it("returns false for payloads with file paths", () => {
    const payload = {
      name: "Document",
      filepath: "/Users/admin/Documents/secret.txt",
    }

    expect(isSafeToSync(payload)).toBe(false)
  })
})
