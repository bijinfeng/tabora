import { describe, expect, it, vi } from "vitest"
import type { AiChatConnection, WidgetViewData } from "@tabora/plugin-api/sdk"

import { getAiChatSession, setAiChatRuntime } from "./ai-chat-session"
import type { AiChatStoredConversation } from "./ai-chat-session"

function makeDataStore() {
  const map = new Map<string, unknown>()
  const data: WidgetViewData = {
    get: async <T>(key: string) => map.get(key) as T | undefined,
    save: async <T>(key: string, value: T) => {
      map.set(key, value)
    },
  }
  return { data, map }
}

async function waitForLoaded(session: { loaded(): boolean }) {
  await vi.waitFor(() => expect(session.loaded()).toBe(true))
}

async function waitForPersistedSave() {
  await new Promise((resolve) => setTimeout(resolve, 320))
}

type WireMessage = { id: string; role: string; parts: Array<{ type: string; content: string }> }

describe("AI chat reasoning persistence", () => {
  it("persists provider reasoning summaries and returns their opaque signature on the next turn", async () => {
    const requests: WireMessage[][] = []
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () =>
        ({
          async *connect(messages) {
            requests.push(messages as WireMessage[])
            yield { type: "RUN_STARTED", threadId: "t", runId: "r" }
            yield { type: "REASONING_MESSAGE_CONTENT", messageId: "a1", delta: "先检查约束" }
            yield {
              type: "REASONING_ENCRYPTED_VALUE",
              subtype: "message",
              entityId: "a1",
              encryptedValue: "opaque-provider-state",
            }
            yield { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "结论" }
            yield { type: "RUN_FINISHED", threadId: "t", runId: "r" }
          },
        }) satisfies AiChatConnection,
    })

    const store = makeDataStore()
    const session = getAiChatSession({ instanceId: "session-reasoning", data: store.data })
    await waitForLoaded(session)
    session.createConversation()
    await session.send("分析")
    expect(session.messages()[1]?.parts).toContainEqual(
      expect.objectContaining({ type: "thinking", content: "先检查约束" }),
    )

    await waitForPersistedSave()
    const saved = store.map.get("ai-chat-conversations") as AiChatStoredConversation[]
    expect(saved[0]?.messages[1]?.parts).toContainEqual(
      expect.objectContaining({ type: "thinking", signature: "opaque-provider-state" }),
    )

    await session.send("继续")
    expect(requests[1]?.[1]?.parts).toContainEqual(
      expect.objectContaining({ type: "thinking", signature: "opaque-provider-state" }),
    )
  })
})
