import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  /** 工具栏 + 表格 + 分页收在同一张卡片里，避免三块浮空元素各自为政。 */
  panel: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  toolbar: {
    alignItems: "center",
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: space.s4,
    justifyContent: "space-between",
    paddingBlock: space.s4,
    paddingInline: space.s5,
  },
  toolbarLeft: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    flex: 1,
    maxWidth: 360,
    minWidth: 200,
  },
  panelNotice: {
    paddingBlock: space.s3,
    paddingInline: space.s5,
  },
  panelFooter: {
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    paddingBlock: space.s4,
    paddingInline: space.s5,
  },
  /** 表格嵌在卡片内，去掉自带边框与圆角，避免双层描边。 */
  table: {
    borderRadius: 0,
    borderWidth: 0,
  },
  cell: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
  },
  emailText: {
    color: color.text,
    fontSize: 13,
  },
  mono: {
    color: color.textSubtle,
    fontFamily: font.mono,
    fontSize: 11,
  },
  banBanner: {
    backgroundColor: color.dangerSoft,
    borderRadius: radius.control,
    color: color.danger,
    fontSize: 12,
    padding: space.s2,
  },
})
