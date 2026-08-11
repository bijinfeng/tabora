import * as stylex from "@stylexjs/stylex"
import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.page,
    color: color.text,
    display: "flex",
    justifyContent: "center",
    minHeight: "100vh",
    padding: space.s6,
    textAlign: "center",
  },
  panel: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    maxWidth: 640,
    padding: space.s6,
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: font.bold,
    margin: 0,
  },
  detail: {
    color: color.textMuted,
    fontSize: 14,
    marginBlock: space.s3,
    overflowWrap: "anywhere",
  },
  error: {
    backgroundColor: color.page,
    borderRadius: radius.control,
    color: color.textMuted,
    display: "block",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12,
    overflowWrap: "anywhere",
    padding: space.s3,
    textAlign: "left",
    whiteSpace: "pre-wrap",
  },
})

export function LayoutUnavailableState(props: { layoutId: string; message: string }) {
  return (
    <main {...stylex.attrs(styles.root)} data-layout-unavailable role="alert">
      <section {...stylex.attrs(styles.panel)}>
        <h1 {...stylex.attrs(styles.title)}>没有可用的布局插件</h1>
        <p {...stylex.attrs(styles.detail)}>布局插件「{props.layoutId}」无法渲染。</p>
        <code {...stylex.attrs(styles.error)}>{props.message}</code>
      </section>
    </main>
  )
}
