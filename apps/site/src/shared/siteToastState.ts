import { createSignal, onCleanup } from "solid-js"

export function createSiteToastState() {
  const [message, setMessage] = createSignal("")
  const [visible, setVisible] = createSignal(false)
  let timer = 0

  const showToast = (nextMessage: string) => {
    window.clearTimeout(timer)
    setMessage(nextMessage)
    setVisible(true)
    timer = window.setTimeout(() => setVisible(false), 2600)
  }

  onCleanup(() => window.clearTimeout(timer))

  return { message, visible, showToast }
}
