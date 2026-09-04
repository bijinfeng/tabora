import { describe, expect, it } from "vitest"

import { AI_CHAT_ATTACHMENT_METADATA, buildAttachmentContent } from "./ai-chat-attachments"

describe("AI chat native attachment input", () => {
  it("sends PDF and audio only when the selected model declares those capabilities", async () => {
    const pdf = new File([new Uint8Array([37, 80, 68, 70])], "设计.pdf", {
      type: "application/pdf",
    })
    const audio = new File([new Uint8Array([1, 2, 3])], "录音.mp3", { type: "audio/mpeg" })

    const content = await buildAttachmentContent(
      "请分析",
      [pdf, audio],
      ["text", "audio", "document"],
    )
    expect(content).toMatchObject({
      content: [
        { type: "text", content: "请分析" },
        { type: "audio", source: { type: "data", mimeType: "audio/mpeg" } },
        {
          type: "document",
          source: { type: "data", mimeType: "application/pdf" },
          metadata: { filename: "设计.pdf" },
        },
      ],
      metadata: {
        [AI_CHAT_ATTACHMENT_METADATA]: {
          attachments: [
            { name: "设计.pdf", kind: "document", status: "provided" },
            { name: "录音.mp3", kind: "audio", status: "provided" },
          ],
        },
      },
    })

    const unavailable = await buildAttachmentContent("请分析", [pdf, audio])
    expect(unavailable).toMatchObject({
      metadata: {
        [AI_CHAT_ATTACHMENT_METADATA]: {
          attachments: [
            { name: "设计.pdf", status: "unavailable" },
            { name: "录音.mp3", status: "unavailable" },
          ],
        },
      },
    })
  })
})
