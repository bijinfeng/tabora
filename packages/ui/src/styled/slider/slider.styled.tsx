import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Slider as P } from "../../primitives/slider/slider"
import type { SliderProps } from "../../primitives/slider/slider"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    height: 20,
    position: "relative",
    touchAction: "none",
    width: "100%",
  },
  track: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: 999,
    height: 4,
    position: "relative",
    width: "100%",
  },
  fill: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderRadius: 999,
    height: "100%",
    position: "absolute",
  },
  thumb: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderColor: "rgb(var(--tbr-color-surface))",
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 1px 3px rgb(var(--tbr-color-shadow) / 0.12)",
    display: "block",
    height: 16,
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 16,
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 3,
    },
  },
})

type SliderStyleProp =
  | "class"
  | "style"
  | "trackClass"
  | "trackStyle"
  | "fillClass"
  | "fillStyle"
  | "thumbClass"
  | "thumbStyle"

export type StyledSliderProps = Omit<SliderProps, SliderStyleProp> & {
  xstyle?: StyleXStyles
}

export function Slider(props: StyledSliderProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const trackCompiled = () => stylex.attrs(styles.track)
  const fillCompiled = () => stylex.attrs(styles.fill)
  const thumbCompiled = () => stylex.attrs(styles.thumb)

  return (
    <P
      {...props}
      class={rootCompiled().class}
      style={undefined}
      trackClass={trackCompiled().class}
      trackStyle={undefined}
      fillClass={fillCompiled().class}
      fillStyle={undefined}
      thumbClass={thumbCompiled().class}
      thumbStyle={undefined}
    />
  )
}

export type { StyledSliderProps as SliderProps }
