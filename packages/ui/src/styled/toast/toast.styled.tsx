import { Toast as Primitive } from "../../primitives/toast/toast"
import type { ToastProps, ToastVariant } from "../../primitives/toast/toast"
import "./styles.css"

export function Toast(props: ToastProps) {
  return <Primitive {...props} class={`tbr-toast ${props.class ?? ""}`} />
}

export type { ToastProps, ToastVariant }
