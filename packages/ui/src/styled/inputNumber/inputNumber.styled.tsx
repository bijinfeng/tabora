import * as stylex from "@stylexjs/stylex"
import ChevronDown from "lucide-solid/icons/chevron-down"
import ChevronUp from "lucide-solid/icons/chevron-up"

import { color, control, motion, radius } from "@tabora/theme/tokens.stylex"
import { IconButton } from "../button"
import { InputNumber as Primitive } from "../../primitives/inputNumber/inputNumber"
import type { InputNumberProps, InputNumberSize } from "../../primitives/inputNumber/inputNumber"
import type { XStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "inline-flex",
    minWidth: 112,
    position: "relative",
  },
  input: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxSizing: "border-box",
    color: color.text,
    fontFamily: "inherit",
    fontSize: 13,
    height: control.md,
    outline: "none",
    paddingInlineEnd: 30,
    paddingInlineStart: 10,
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      borderColor: color.lineStrong,
    },
    ":focus": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
    },
    ":disabled": {
      backgroundColor: color.surfaceSoft,
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  inputSm: {
    fontSize: 12,
    height: control.sm,
    paddingInlineEnd: 24,
    paddingInlineStart: 8,
  },
  inputLg: {
    fontSize: 14,
    height: control.lg,
    paddingInlineEnd: 34,
    paddingInlineStart: 12,
  },
  inputWithoutControls: {
    paddingInlineEnd: 10,
  },
  inputSmWithoutControls: {
    paddingInlineEnd: 8,
  },
  controls: {
    display: "grid",
    gap: 0,
    position: "absolute",
    right: 2,
    top: "50%",
    transform: "translateY(-50%)",
  },
  control: {
    borderRadius: radius.r1,
    height: 14,
    minHeight: 0,
    padding: 0,
    width: 20,
  },
  controlSm: {
    height: 10,
    width: 16,
  },
  controlLg: {
    height: 18,
    width: control.sm,
  },
})

type InputNumberStyleProp = "class" | "style" | "inputClass" | "inputStyle" | "renderControls"

export type StyledInputNumberProps = Omit<InputNumberProps, InputNumberStyleProp> & {
  xstyle?: XStyle
}

export function InputNumber(props: StyledInputNumberProps) {
  const rootAttrs = () => stylex.attrs(styles.root, props.xstyle)
  const inputAttrs = () =>
    stylex.attrs(
      styles.input,
      props.size === "sm" ? styles.inputSm : undefined,
      props.size === "lg" ? styles.inputLg : undefined,
      props.controls === false
        ? props.size === "sm"
          ? styles.inputSmWithoutControls
          : styles.inputWithoutControls
        : undefined,
    )
  const controlStyle = () =>
    props.size === "sm"
      ? [styles.control, styles.controlSm]
      : props.size === "lg"
        ? [styles.control, styles.controlLg]
        : styles.control

  return (
    <Primitive
      {...props}
      class={rootAttrs().class}
      style={undefined}
      inputClass={inputAttrs().class}
      inputStyle={undefined}
      renderControls={({ canDecrement, canIncrement, decrement, disabled, increment }) => (
        <span {...stylex.attrs(styles.controls)}>
          <IconButton
            aria-label="增加"
            variant="ghost"
            size="mini"
            disabled={disabled || !canIncrement}
            xstyle={controlStyle()}
            onClick={increment}
          >
            {(typeof props.controls === "object" ? props.controls.upIcon : undefined) ?? (
              <ChevronUp size={12} strokeWidth={2} />
            )}
          </IconButton>
          <IconButton
            aria-label="减少"
            variant="ghost"
            size="mini"
            disabled={disabled || !canDecrement}
            xstyle={controlStyle()}
            onClick={decrement}
          >
            {(typeof props.controls === "object" ? props.controls.downIcon : undefined) ?? (
              <ChevronDown size={12} strokeWidth={2} />
            )}
          </IconButton>
        </span>
      )}
    />
  )
}

export type { InputNumberSize, StyledInputNumberProps as InputNumberProps }
