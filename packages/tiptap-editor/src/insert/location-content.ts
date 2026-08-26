import type { Editor } from "@tiptap/core"

import { insertLink } from "./link-content"

export function insertCurrentLocation(editor: Editor) {
  return new Promise<void>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("当前浏览器不支持获取位置"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        insertLink(
          editor,
          `位置：${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
        )
        resolve()
      },
      () => reject(new Error("未能获取当前位置，请检查位置权限后重试")),
    )
  })
}
