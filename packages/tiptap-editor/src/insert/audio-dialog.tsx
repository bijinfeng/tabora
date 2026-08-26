import * as stylex from "@stylexjs/stylex"
import type { Accessor } from "solid-js"
import { createSignal, onCleanup, Show } from "solid-js"

import type { Editor } from "@tiptap/core"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"

import { insertRecordedAudio } from "./audio-content"
import { insertDialogStyles } from "./insert-dialog-styles"

export function AudioInsertDialog(props: { editor: Accessor<Editor | null>; onClose: () => void }) {
  let recorder: MediaRecorder | undefined
  let stream: MediaStream | undefined
  let chunks: Blob[] = []
  let discardRecording = false
  const [recording, setRecording] = createSignal(false)
  const [error, setError] = createSignal<string>()

  const stopTracks = () => {
    stream?.getTracks().forEach((track) => track.stop())
    stream = undefined
  }
  const close = () => {
    discardRecording = true
    if (recorder?.state === "recording") recorder.stop()
    stopTracks()
    recorder = undefined
    setRecording(false)
    props.onClose()
  }
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("当前浏览器不支持录音。")
      return
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      discardRecording = false
      recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => chunks.push(event.data)
      recorder.onstop = async () => {
        stopTracks()
        setRecording(false)
        const editor = props.editor()
        if (discardRecording || !editor || chunks.length === 0) return
        try {
          await insertRecordedAudio(editor, chunks, recorder?.mimeType || "audio/webm")
          props.onClose()
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "无法插入录音，请重试。")
        }
      }
      recorder.start()
      setRecording(true)
    } catch {
      setError("未获得麦克风权限，无法录音。")
    }
  }

  onCleanup(close)

  return (
    <Dialog
      open
      onCancel={close}
      title="录制音频"
      description="录音会嵌入当前编辑器内容，单段不超过 5 MB。"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            取消
          </Button>
          <Button
            variant={recording() ? "danger" : "primary"}
            size="sm"
            onClick={() => (recording() ? recorder?.stop() : void startRecording())}
          >
            {recording() ? "停止并插入" : "开始录音"}
          </Button>
        </>
      }
    >
      <div {...stylex.attrs(insertDialogStyles.body)}>
        <span {...stylex.attrs(insertDialogStyles.hint)}>
          {recording() ? "正在录音…" : "开始后请允许浏览器使用麦克风。"}
        </span>
        <Show when={error()}>
          <span {...stylex.attrs(insertDialogStyles.error)}>{error()}</span>
        </Show>
      </div>
    </Dialog>
  )
}
