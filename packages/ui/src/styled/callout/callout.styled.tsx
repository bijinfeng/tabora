import {
  Alert as PrimitiveAlert,
  Banner as PrimitiveBanner,
} from "../../primitives/callout/callout"
import type { AlertProps, BannerProps, CalloutVariant } from "../../primitives/callout/callout"
import "./styles.css"

export function Banner(props: BannerProps) {
  return <PrimitiveBanner {...props} class={`tbr-banner ${props.class ?? ""}`} />
}

export function Alert(props: AlertProps) {
  return <PrimitiveAlert {...props} class={`tbr-alert ${props.class ?? ""}`} />
}

export type { AlertProps, BannerProps, CalloutVariant }
