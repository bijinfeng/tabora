import * as stylex from "@stylexjs/stylex"
import { Button, IconButton, Input } from "@tabora/ui"
import { createSignal } from "solid-js"

import type { HomePageContent } from "../homePrototypeContent"

const styles = stylex.create({
  shell: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-panel)",
    boxShadow: "var(--tbr-shadow-raised, var(--tbr-shadow-lg))",
    overflow: "hidden",
    "@media (max-width: 1180px)": {
      maxWidth: 860,
    },
  },
  browserBar: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "auto 1fr auto",
    minHeight: 42,
    paddingInline: 14,
    "@media (max-width: 560px)": {
      gridTemplateColumns: "auto 1fr",
    },
    "@media (max-width: 430px)": {
      gap: 8,
      paddingInline: 10,
    },
  },
  traffic: {
    display: "flex",
    gap: 7,
    "@media (max-width: 430px)": {
      display: "none",
    },
  },
  trafficDot: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: "50%",
    height: 10,
    width: 10,
  },
  address: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-text-subtle))",
    display: "flex",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    height: 26,
    justifyContent: "center",
    minWidth: 0,
  },
  kbd: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: 6,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    height: 22,
    justifyContent: "center",
    minWidth: 24,
  },
  browserKbd: {
    "@media (max-width: 560px)": {
      display: "none",
    },
  },
  workbench: {
    backgroundColor: "rgb(var(--tbr-color-page))",
    display: "grid",
    gridTemplateColumns: "56px 1fr",
    maxHeight: 540,
    minHeight: 420,
    overflow: "hidden",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "1fr",
      maxHeight: "none",
      minHeight: "auto",
    },
  },
  rail: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderRight: "1px solid rgb(var(--tbr-color-line))",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingBlock: 14,
    paddingInline: 8,
    "@media (max-width: 920px)": {
      display: "none",
    },
  },
  railBrand: {
    backgroundColor: "rgb(var(--tbr-color-text))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: 7,
    color: "rgb(var(--tbr-color-page))",
    display: "grid",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 13,
    fontWeight: 760,
    height: 32,
    marginBottom: 4,
    placeItems: "center",
    width: 32,
  },
  railGroups: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  railButton: {
    height: 36,
    width: 36,
  },
  railButtonActive: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-accent))",
  },
  railDivider: {
    backgroundColor: "rgb(var(--tbr-color-line))",
    height: 1,
    marginBlock: 4,
    width: 24,
  },
  railSpacer: {
    flex: 1,
  },
  workspace: {
    minWidth: 0,
    padding: 18,
    "@media (max-width: 560px)": {
      padding: 14,
    },
  },
  greeting: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  greetingText: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 15,
    fontWeight: 660,
  },
  greetingMuted: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontWeight: 500,
  },
  greetingAdd: {
    backgroundColor: "transparent",
    border: "1px dashed rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    minHeight: 28,
    paddingInline: 10,
    ":hover": {
      borderColor: "rgb(var(--tbr-color-accent))",
      color: "rgb(var(--tbr-color-accent))",
    },
  },
  command: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-control)",
    boxShadow: "var(--tbr-shadow-sm)",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "flex",
    gap: 10,
    height: 42,
    marginBottom: 16,
    maxWidth: 640,
    minWidth: 0,
    paddingInline: 12,
  },
  providerBadge: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: 5,
    color: "rgb(var(--tbr-color-text))",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 640,
    gap: 4,
    paddingBlock: 3,
    paddingInline: 8,
  },
  providerDot: {
    backgroundColor: "rgb(var(--tbr-color-success))",
    borderRadius: "50%",
    height: 6,
    width: 6,
  },
  commandSep: {
    backgroundColor: "rgb(var(--tbr-color-line))",
    flexShrink: 0,
    height: 20,
    width: 1,
  },
  commandInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text))",
    flex: 1,
    fontSize: 14,
    minWidth: 0,
    outline: 0,
  },
  widgetGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "1fr",
    },
  },
  widget: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    minHeight: 110,
    padding: 14,
  },
  widgetLarge: {
    gridColumn: "span 2",
    "@media (max-width: 920px)": {
      gridColumn: "auto",
    },
  },
  widgetHead: {
    alignItems: "center",
    display: "flex",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleBlock: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  widgetTitle: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 13,
    fontWeight: 700,
  },
  widgetSub: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  statusDot: {
    backgroundColor: "rgb(var(--tbr-color-success))",
    borderRadius: "50%",
    height: 8,
    width: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontSize: 11,
    minHeight: 22,
    paddingInline: 8,
  },
  chipSuccess: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-line-strong))",
    color: "rgb(var(--tbr-color-success))",
  },
  focusLine: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 15,
    fontWeight: 620,
    lineHeight: 1.4,
  },
  quickLinks: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  quickLink: {
    alignContent: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "grid",
    gap: 1,
    minHeight: 44,
    paddingBlock: 6,
    paddingInline: 10,
    textAlign: "left",
  },
  quickLinkTitle: {
    fontSize: 12,
    fontWeight: 700,
  },
  quickLinkMeta: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
  },
  weather: {
    alignItems: "center",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "auto 1fr",
  },
  weatherMark: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-info))",
    display: "grid",
    height: 44,
    placeItems: "center",
    width: 44,
  },
  metric: {
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1,
  },
  meta: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
  },
  taskList: {
    display: "grid",
    gap: 9,
  },
  task: {
    alignItems: "start",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "grid",
    fontSize: 12,
    gap: 8,
    gridTemplateColumns: "16px 1fr",
  },
  check: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: 4,
    height: 14,
    marginTop: 2,
    width: 14,
  },
  checkDone: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-success))",
  },
  notes: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    lineHeight: 1.6,
    margin: 0,
  },
  pluginStats: {
    display: "grid",
    gap: 6,
  },
  pluginStat: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "flex",
    fontSize: 12,
    justifyContent: "space-between",
  },
  pluginStatValue: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 12,
    fontWeight: 680,
  },
})

export function WorkbenchPreview(props: { content: HomePageContent }) {
  const [command, setCommand] = createSignal(props.content.mock.commandPlaceholder)

  return (
    <div
      {...stylex.attrs(styles.shell)}
      id="product"
      data-site-workbench-preview
      data-component="SiteProductPreview"
    >
      <div {...stylex.attrs(styles.browserBar)}>
        <div {...stylex.attrs(styles.traffic)} aria-hidden="true">
          <span {...stylex.attrs(styles.trafficDot)} />
          <span {...stylex.attrs(styles.trafficDot)} />
          <span {...stylex.attrs(styles.trafficDot)} />
        </div>
        <div {...stylex.attrs(styles.address)}>new-tab://tabora/workbench</div>
        <span {...stylex.attrs(styles.kbd, styles.browserKbd)}>⌘K</span>
      </div>
      <div {...stylex.attrs(styles.workbench)} data-mock-root>
        <aside {...stylex.attrs(styles.rail)} aria-label="工作台导航">
          <span {...stylex.attrs(styles.railBrand)} aria-hidden="true">
            T
          </span>
          <div {...stylex.attrs(styles.railGroups)} role="tablist" aria-label="分组">
            <IconButton
              variant="ghost"
              aria-label="默认分组"
              xstyle={[styles.railButton, styles.railButtonActive]}
              aria-current="true"
            >
              <span>T</span>
            </IconButton>
            <IconButton variant="ghost" aria-label="设计稿" xstyle={styles.railButton}>
              <span>◐</span>
            </IconButton>
            <IconButton variant="ghost" aria-label="阅读" xstyle={styles.railButton}>
              <span>★</span>
            </IconButton>
          </div>
          <div {...stylex.attrs(styles.railDivider)} aria-hidden="true" />
          <IconButton variant="ghost" aria-label="新建分组" xstyle={styles.railButton}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </IconButton>
          <div {...stylex.attrs(styles.railSpacer)} />
          <IconButton variant="ghost" aria-label="切换布局" xstyle={styles.railButton}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </IconButton>
          <IconButton variant="ghost" aria-label="主题" xstyle={styles.railButton}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
            </svg>
          </IconButton>
          <IconButton variant="ghost" aria-label="设置" xstyle={styles.railButton}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </IconButton>
        </aside>

        <div {...stylex.attrs(styles.workspace)}>
          <div {...stylex.attrs(styles.greeting)}>
            <span {...stylex.attrs(styles.greetingText)}>
              {props.content.mock.greeting}
              <span {...stylex.attrs(styles.greetingMuted)}> · {props.content.mock.date}</span>
            </span>
            <Button size="sm" variant="secondary" xstyle={styles.greetingAdd}>
              {props.content.mock.addCard}
            </Button>
          </div>

          <label {...stylex.attrs(styles.command)}>
            <span {...stylex.attrs(styles.providerBadge)}>
              <span {...stylex.attrs(styles.providerDot)} aria-hidden="true" />
              Google
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
            <span {...stylex.attrs(styles.commandSep)} aria-hidden="true" />
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <Input
              size="sm"
              xstyle={styles.commandInput}
              value={command()}
              onInput={setCommand}
              aria-label="命令搜索"
            />
            <span {...stylex.attrs(styles.kbd)}>⌘K</span>
          </label>

          <div {...stylex.attrs(styles.widgetGrid)}>
            <article {...stylex.attrs(styles.widget, styles.widgetLarge)}>
              <div {...stylex.attrs(styles.widgetHead)}>
                <div {...stylex.attrs(styles.titleBlock)}>
                  <span {...stylex.attrs(styles.widgetTitle)}>
                    {props.content.mock.widgets.focus.title}
                  </span>
                  <span {...stylex.attrs(styles.widgetSub)}>
                    {props.content.mock.widgets.focus.sub}
                  </span>
                </div>
                <span {...stylex.attrs(styles.statusDot)} aria-label="已同步" />
              </div>
              <div {...stylex.attrs(styles.focusLine)}>{props.content.mock.widgets.focus.body}</div>
            </article>
            <article {...stylex.attrs(styles.widget)}>
              <div {...stylex.attrs(styles.widgetHead)}>
                <div {...stylex.attrs(styles.titleBlock)}>
                  <span {...stylex.attrs(styles.widgetTitle)}>
                    {props.content.mock.widgets.links.title}
                  </span>
                  <span {...stylex.attrs(styles.widgetSub)}>
                    {props.content.mock.widgets.links.sub}
                  </span>
                </div>
                <span {...stylex.attrs(styles.chip)}>links</span>
              </div>
              <div {...stylex.attrs(styles.quickLinks)}>
                {props.content.mock.widgets.links.items.map((item: [string, string]) => (
                  <Button size="sm" variant="ghost" xstyle={styles.quickLink}>
                    <strong {...stylex.attrs(styles.quickLinkTitle)}>{item[0]}</strong>
                    <span {...stylex.attrs(styles.quickLinkMeta)}>{item[1]}</span>
                  </Button>
                ))}
              </div>
            </article>
            <article {...stylex.attrs(styles.widget)}>
              <div {...stylex.attrs(styles.widgetHead)}>
                <div {...stylex.attrs(styles.titleBlock)}>
                  <span {...stylex.attrs(styles.widgetTitle)}>
                    {props.content.mock.widgets.weather.title}
                  </span>
                  <span {...stylex.attrs(styles.widgetSub)}>
                    {props.content.mock.widgets.weather.sub}
                  </span>
                </div>
                <span {...stylex.attrs(styles.chip, styles.chipSuccess)}>live</span>
              </div>
              <div {...stylex.attrs(styles.weather)}>
                <div {...stylex.attrs(styles.weatherMark)}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2" />
                  </svg>
                </div>
                <div>
                  <div {...stylex.attrs(styles.metric)}>
                    {props.content.mock.widgets.weather.metric}
                  </div>
                  <span {...stylex.attrs(styles.meta)}>
                    {props.content.mock.widgets.weather.meta}
                  </span>
                </div>
              </div>
            </article>
            <article {...stylex.attrs(styles.widget)}>
              <div {...stylex.attrs(styles.widgetHead)}>
                <div {...stylex.attrs(styles.titleBlock)}>
                  <span {...stylex.attrs(styles.widgetTitle)}>
                    {props.content.mock.widgets.todo.title}
                  </span>
                  <span {...stylex.attrs(styles.widgetSub)}>
                    {props.content.mock.widgets.todo.sub}
                  </span>
                </div>
                <span {...stylex.attrs(styles.chip)}>tasks</span>
              </div>
              <div {...stylex.attrs(styles.taskList)}>
                <div {...stylex.attrs(styles.task)}>
                  <span {...stylex.attrs(styles.check, styles.checkDone)} />
                  <span>{props.content.mock.widgets.todo.items[0]}</span>
                </div>
                <div {...stylex.attrs(styles.task)}>
                  <span {...stylex.attrs(styles.check)} />
                  <span>{props.content.mock.widgets.todo.items[1]}</span>
                </div>
                <div {...stylex.attrs(styles.task)}>
                  <span {...stylex.attrs(styles.check)} />
                  <span>{props.content.mock.widgets.todo.items[2]}</span>
                </div>
              </div>
            </article>
            <article {...stylex.attrs(styles.widget, styles.widgetLarge)}>
              <div {...stylex.attrs(styles.widgetHead)}>
                <div {...stylex.attrs(styles.titleBlock)}>
                  <span {...stylex.attrs(styles.widgetTitle)}>
                    {props.content.mock.widgets.notes.title}
                  </span>
                  <span {...stylex.attrs(styles.widgetSub)}>
                    {props.content.mock.widgets.notes.sub}
                  </span>
                </div>
                <span {...stylex.attrs(styles.chip)}>draft</span>
              </div>
              <p {...stylex.attrs(styles.notes)}>{props.content.mock.widgets.notes.body}</p>
            </article>
            <article {...stylex.attrs(styles.widget)}>
              <div {...stylex.attrs(styles.widgetHead)}>
                <div {...stylex.attrs(styles.titleBlock)}>
                  <span {...stylex.attrs(styles.widgetTitle)}>
                    {props.content.mock.widgets.pluginStatus.title}
                  </span>
                  <span {...stylex.attrs(styles.widgetSub)}>
                    {props.content.mock.widgets.pluginStatus.sub}
                  </span>
                </div>
                <span {...stylex.attrs(styles.chip, styles.chipSuccess)}>healthy</span>
              </div>
              <div {...stylex.attrs(styles.pluginStats)}>
                {props.content.mock.widgets.pluginStatus.rows.map((row: [string, string]) => (
                  <div {...stylex.attrs(styles.pluginStat)}>
                    <span>{row[0]}</span>
                    <strong {...stylex.attrs(styles.pluginStatValue)}>{row[1]}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
