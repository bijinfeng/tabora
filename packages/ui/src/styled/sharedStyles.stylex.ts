import * as stylex from "@stylexjs/stylex"

import { color, motion, radius, shadow } from "@tabora/theme/tokens.stylex"

export const scaleIn = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "scale(0.98)",
  },
  to: {
    opacity: 1,
    transform: "scale(1)",
  },
})

export const sharedStyles = stylex.create({
  scaleIn: {
    animationDuration: motion.fast,
    animationName: scaleIn,
    animationTimingFunction: motion.ease,
  },
  menuContent: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    maxWidth: 260,
    minWidth: 180,
    overflow: "hidden",
    padding: 0,
  },
  menuItem: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 0,
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 12,
    gap: 7,
    paddingBlock: 6,
    paddingInline: 10,
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    "[data-highlighted]": {
      backgroundColor: color.surfaceHover,
    },
    "[data-disabled]": {
      backgroundColor: "transparent",
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  menuDanger: {
    color: color.danger,
    ":hover": {
      backgroundColor: color.dangerSoft,
    },
    "[data-highlighted]": {
      backgroundColor: color.dangerSoft,
    },
  },
  menuSeparator: {
    backgroundColor: color.line,
    borderStyle: "none",
    borderWidth: 0,
    color: "inherit",
    height: 1,
    marginBlock: 2,
    marginInline: 0,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
  },
  choiceRoot: {
    alignItems: "center",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 13,
    gap: 8,
    ":focus-within": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
  },
  choiceRootDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  choiceInput: {
    clip: "rect(0, 0, 0, 0)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    width: 1,
  },
  choiceLabel: {
    fontSize: 13,
  },
})
