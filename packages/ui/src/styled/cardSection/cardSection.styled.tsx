import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { CardSection as Primitive } from "../../primitives/cardSection/cardSection"
import type { CardSectionProps } from "../../primitives/cardSection/cardSection"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: "inherit",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: 650,
    margin: 0,
  },
  trailing: {
    alignItems: "center",
    display: "flex",
  },
  body: {
    padding: 10,
  },
})

export type StyledCardSectionProps = CardSectionProps & {
  xstyle?: StyleXStyles
}

export function CardSection(props: StyledCardSectionProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const headerCompiled = () => stylex.props(styles.header)
  const titleCompiled = () => stylex.props(styles.title)
  const trailingCompiled = () => stylex.props(styles.trailing)
  const bodyCompiled = () => stylex.props(styles.body)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      headerClass={joinClassNames(headerCompiled().className, props.headerClass)}
      headerStyle={mergeSolidStyles(toSolidStyle(headerCompiled().style), props.headerStyle)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
      trailingClass={joinClassNames(trailingCompiled().className, props.trailingClass)}
      trailingStyle={mergeSolidStyles(toSolidStyle(trailingCompiled().style), props.trailingStyle)}
      bodyClass={joinClassNames(bodyCompiled().className, props.bodyClass)}
      bodyStyle={mergeSolidStyles(toSolidStyle(bodyCompiled().style), props.bodyStyle)}
    />
  )
}

export type { StyledCardSectionProps as CardSectionProps }
