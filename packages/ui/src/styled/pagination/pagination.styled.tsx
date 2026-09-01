import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { color, control, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Button } from "../button"
import { InputNumber } from "../inputNumber"
import { Select } from "../select"
import { Pagination as P } from "../../primitives/pagination/pagination"
import type { PaginationProps } from "../../primitives/pagination/pagination"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    "[data-pagination-total]": {
      color: color.textMuted,
      fontSize: 12,
      whiteSpace: "nowrap",
    },
  },
  alignCenter: {
    justifyContent: "center",
  },
  alignEnd: {
    justifyContent: "flex-end",
  },
  button: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.r2,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 13,
    height: control.md,
    justifyContent: "center",
    minWidth: control.md,
    paddingBlock: 0,
    paddingInline: 6,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
    "[data-current]": {
      backgroundColor: color.accentSoft,
      borderColor: color.accent,
      color: color.accent,
      fontWeight: font.semibold,
    },
    ":focus-visible": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
      outline: "none",
    },
  },
  ellipsis: {
    alignItems: "center",
    color: color.textSubtle,
    display: "flex",
    fontSize: 13,
    height: control.md,
    justifyContent: "center",
    minWidth: control.md,
  },
  smallButton: {
    fontSize: 12,
    height: control.sm,
    minWidth: control.sm,
  },
  largeButton: {
    fontSize: 14,
    height: control.lg,
    minWidth: control.lg,
  },
  smallEllipsis: {
    fontSize: 12,
    height: control.sm,
    minWidth: control.sm,
  },
  largeEllipsis: {
    fontSize: 14,
    height: control.lg,
    minWidth: control.lg,
  },
  pageSizeSelect: {
    minWidth: 96,
    width: "auto",
  },
  quickJumperInput: {
    minWidth: 0,
    width: 58,
  },
  simpleInput: {
    minWidth: 0,
    textAlign: "center",
    width: 42,
  },
  largeSimpleInput: {
    width: 48,
  },
  quickJumper: {
    alignItems: "center",
    display: "inline-flex",
    gap: 4,
  },
  simple: {
    alignItems: "center",
    color: color.textMuted,
    display: "inline-flex",
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  simpleLarge: {
    fontSize: 14,
  },
})

export type StyledPaginationProps = PaginationProps & {
  xstyle?: StyleXStyles
}

export function Pagination(props: StyledPaginationProps) {
  const [quickJumperValue, setQuickJumperValue] = createSignal<number | null>(null)
  const rootCompiled = () =>
    stylex.attrs(
      styles.root,
      props.align === "center"
        ? styles.alignCenter
        : props.align === "end"
          ? styles.alignEnd
          : undefined,
      props.xstyle,
    )
  const buttonCompiled = () =>
    stylex.attrs(
      styles.button,
      props.size === "small"
        ? styles.smallButton
        : props.size === "large"
          ? styles.largeButton
          : undefined,
    )
  const ellipsisCompiled = () =>
    stylex.attrs(
      styles.ellipsis,
      props.size === "small"
        ? styles.smallEllipsis
        : props.size === "large"
          ? styles.largeEllipsis
          : undefined,
    )
  const controlSize = () => (props.size === "small" ? "sm" : props.size === "large" ? "lg" : "md")

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      pageButtonClass={joinClassNames(buttonCompiled().class, props.pageButtonClass)}
      pageButtonStyle={{ ...props.pageButtonStyle }}
      pageButtonActiveStyle={{ ...props.pageButtonActiveStyle }}
      ellipsisClass={joinClassNames(ellipsisCompiled().class, props.ellipsisClass)}
      ellipsisStyle={props.ellipsisStyle}
      renderPageSizeControl={({ disabled, options, pageSize, onChange }) => (
        <span data-pagination-size>
          <Select
            value={String(pageSize)}
            options={options}
            disabled={disabled}
            size={controlSize()}
            xstyle={styles.pageSizeSelect}
            aria-label="每页条数"
            onChange={(value) => onChange(Number(value))}
          />
        </span>
      )}
      renderQuickJumperControl={({ disabled, goButton, max, onSubmit }) => (
        <form
          {...stylex.attrs(styles.quickJumper)}
          data-pagination-quick-jumper
          onSubmit={(event) => {
            event.preventDefault()
            const page = quickJumperValue()
            if (page !== null) onSubmit(page)
          }}
        >
          <InputNumber
            value={quickJumperValue()}
            onChange={setQuickJumperValue}
            min={1}
            max={max}
            placeholder="页码"
            disabled={disabled}
            controls={false}
            size={controlSize()}
            xstyle={styles.quickJumperInput}
            aria-label="跳转页码"
          />
          <Button type="submit" variant="secondary" size={controlSize()} disabled={disabled}>
            {goButton ?? "跳转"}
          </Button>
        </form>
      )}
      renderSimpleControl={({ current, disabled, max, readOnly, onChange }) => (
        <span
          {...stylex.attrs(styles.simple, props.size === "large" ? styles.simpleLarge : undefined)}
          data-pagination-simple
        >
          {readOnly ? (
            current
          ) : (
            <InputNumber
              value={current}
              onChange={(value) => {
                if (value !== null) onChange(value)
              }}
              min={1}
              max={max}
              disabled={disabled}
              size={controlSize()}
              xstyle={
                props.size === "large"
                  ? [styles.simpleInput, styles.largeSimpleInput]
                  : styles.simpleInput
              }
              aria-label="当前页码"
            />
          )}{" "}
          / {max}
        </span>
      )}
      renderJumpControl={({ disabled, onClick, type }) => (
        <Button
          variant="secondary"
          size={controlSize()}
          disabled={disabled}
          aria-label={type === "jump-prev" ? "跳转到前五页" : "跳转到后五页"}
          onClick={onClick}
        >
          {type === "jump-prev" ? (props.jumpPrevIcon ?? "•••") : (props.jumpNextIcon ?? "•••")}
        </Button>
      )}
    />
  )
}
export type { StyledPaginationProps as PaginationProps }
