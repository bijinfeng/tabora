import { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { afterEach, describe, expect, it } from "vitest"

import { insertRecordedAudio } from "./audio-content"
import { audioExtension } from "./audio-extension"
import { insertFile } from "./file-content"
import { attachmentExtension } from "./file-extension"
import { insertIncomingFiles } from "./file-handler-extension"
import { insertLink } from "./link-content"
import { linkExtension } from "./link-extension"
import { insertCurrentLocation } from "./location-content"
import { insertMedia } from "./media-content"
import { mediaExtension } from "./media-extension"

const editors: Editor[] = []

function createEditor() {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ link: false }),
      linkExtension,
      mediaExtension,
      audioExtension,
      attachmentExtension,
    ],
  })
  editors.push(editor)
  return editor
}

function contentNodes(editor: Editor) {
  return editor.getJSON().content ?? []
}

afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy())
})

describe("insert content", () => {
  it("writes link, image, audio, and attachment nodes into the editor document", async () => {
    const editor = createEditor()

    insertLink(editor, "Tabora", "https://tabora.app")
    await insertMedia(editor, new File(["image"], "tabora.png", { type: "image/png" }))
    await insertRecordedAudio(editor, [new Blob(["audio"], { type: "audio/webm" })], "audio/webm")
    await insertFile(editor, new File(["file"], "notes.txt", { type: "text/plain" }))

    const nodes = contentNodes(editor)
    expect(nodes[0]).toMatchObject({
      content: [
        { text: "Tabora", marks: [{ type: "link", attrs: { href: "https://tabora.app" } }] },
      ],
    })
    expect(nodes.find((node) => node.type === "image")).toMatchObject({
      attrs: { src: expect.stringMatching(/^data:image\/png;base64,/) },
    })
    expect(nodes.find((node) => node.type === "audio")).toMatchObject({
      attrs: { src: expect.stringMatching(/^data:audio\/webm;base64,/) },
    })
    expect(nodes.find((node) => node.type === "attachment")).toMatchObject({
      attrs: { name: "notes.txt", mediaType: "text/plain" },
    })
  })

  it("routes pasted or dropped images and files through the same insert paths", async () => {
    const editor = createEditor()

    await insertIncomingFiles(editor, [
      new File(["image"], "tabora.png", { type: "image/png" }),
      new File(["file"], "notes.txt", { type: "text/plain" }),
    ])

    const nodes = contentNodes(editor)
    expect(nodes.find((node) => node.type === "image")).toMatchObject({
      attrs: { src: expect.stringMatching(/^data:image\/png;base64,/) },
    })
    expect(nodes.find((node) => node.type === "attachment")).toMatchObject({
      attrs: { name: "notes.txt" },
    })
  })

  it("inserts an OpenStreetMap link from the browser location", async () => {
    const editor = createEditor()
    const geolocation = navigator.geolocation
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({ coords: { latitude: 31.2304, longitude: 121.4737 } } as GeolocationPosition),
      },
    })

    await insertCurrentLocation(editor)

    expect(editor.getHTML()).toContain(
      "https://www.openstreetmap.org/?mlat=31.2304&amp;mlon=121.4737",
    )
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: geolocation })
  })

  it("reports a recoverable error when the browser location API is unavailable", async () => {
    const editor = createEditor()
    const geolocation = navigator.geolocation
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined })

    await expect(insertCurrentLocation(editor)).rejects.toThrow("当前浏览器不支持获取位置")
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: geolocation })
  })
})
