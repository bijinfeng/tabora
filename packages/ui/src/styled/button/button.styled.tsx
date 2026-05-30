import { HeadlessButton, HeadlessIconButton } from "../../primitives/button/button"
import type { HeadlessButtonProps, HeadlessIconButtonProps } from "../../primitives/button/button"
import { tv } from "../../tokens/createVariants"
import "./styles.css"

const buttonVariants = tv({
  base: "tbr-btn",
  variants: {
    variant: {
      primary: "tbr-btn--primary",
      secondary: "tbr-btn--secondary",
      subtle: "tbr-btn--subtle",
      ghost: "tbr-btn--ghost",
      danger: "tbr-btn--danger",
    },
    size: {
      sm: "tbr-btn--sm",
      md: "tbr-btn--md",
      lg: "tbr-btn--lg",
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
})

const iconButtonVariants = tv({
  base: "tbr-icon-btn",
  variants: {
    size: {
      sm: "tbr-icon-btn--sm",
      md: "tbr-icon-btn--md",
      lg: "tbr-icon-btn--lg",
    },
  },
  defaultVariants: { size: "md" },
})

export function Button(props: HeadlessButtonProps) {
  return (
    <HeadlessButton
      {...props}
      class={buttonVariants({ variant: props.variant, size: props.size })}
    />
  )
}

export function IconButton(props: HeadlessIconButtonProps) {
  return <HeadlessIconButton {...props} class={iconButtonVariants({ size: props.size })} />
}

// 向后兼容类型
export type ButtonProps = HeadlessButtonProps
export type IconButtonProps = HeadlessIconButtonProps
export type ButtonVariant = HeadlessButtonProps["variant"]
export type ButtonSize = HeadlessButtonProps["size"]
