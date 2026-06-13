import type { HomePageContent } from "../homePrototypeContent"

export function WorkbenchPreview(props: { content: HomePageContent }) {
  return (
    <div class="site-product-shell" id="product" data-component="SiteProductPreview">
      <div class="site-browser-bar">
        <div class="site-traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div class="site-address">new-tab://tabora/workbench</div>
        <span class="kbd kbd-inline">⌘K</span>
      </div>
      <div class="site-workbench" data-mock-root>
        <aside class="site-rail" aria-label="工作台导航">
          <span class="site-rail-brand" aria-hidden="true">
            T
          </span>
          <div class="site-rail-groups" role="tablist" aria-label="分组">
            <button
              class="site-rail-btn site-rail-group active"
              type="button"
              aria-label="默认分组"
              aria-current="true"
            >
              <span>T</span>
            </button>
            <button class="site-rail-btn site-rail-group" type="button" aria-label="设计稿">
              <span>◐</span>
            </button>
            <button class="site-rail-btn site-rail-group" type="button" aria-label="阅读">
              <span>★</span>
            </button>
          </div>
          <div class="site-rail-divider" aria-hidden="true" />
          <button class="site-rail-btn site-rail-add" type="button" aria-label="新建分组">
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
          </button>
          <div class="site-rail-spacer" />
          <button class="site-rail-btn" type="button" aria-label="切换布局">
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
          </button>
          <button class="site-rail-btn" type="button" aria-label="主题">
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
          </button>
          <button class="site-rail-btn" type="button" aria-label="设置">
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
          </button>
        </aside>

        <div class="site-workspace">
          <div class="site-greeting">
            <span class="site-greeting-text">
              {props.content.mock.greeting}
              <span class="site-greeting-muted"> · {props.content.mock.date}</span>
            </span>
            <button class="site-greeting-add" type="button">
              {props.content.mock.addCard}
            </button>
          </div>

          <label class="site-command">
            <span class="site-provider-badge">
              <span class="site-provider-dot" aria-hidden="true" />
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
            <span class="site-command-sep" aria-hidden="true" />
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
            <input value={props.content.mock.commandPlaceholder} aria-label="命令搜索" />
            <span class="kbd kbd-inline">⌘K</span>
          </label>

          <div class="site-widget-grid">
            <article class="site-widget large">
              <div class="site-widget-head">
                <div class="site-widget-title-block">
                  <span class="site-widget-title">{props.content.mock.widgets.focus.title}</span>
                  <span class="site-widget-sub">{props.content.mock.widgets.focus.sub}</span>
                </div>
                <span class="status-dot" aria-label="已同步" />
              </div>
              <div class="focus-line">{props.content.mock.widgets.focus.body}</div>
            </article>
            <article class="site-widget">
              <div class="site-widget-head">
                <div class="site-widget-title-block">
                  <span class="site-widget-title">{props.content.mock.widgets.links.title}</span>
                  <span class="site-widget-sub">{props.content.mock.widgets.links.sub}</span>
                </div>
                <span class="chip site-chip">links</span>
              </div>
              <div class="quick-links">
                {props.content.mock.widgets.links.items.map((item: [string, string]) => (
                  <button class="quick-link" type="button">
                    <strong>{item[0]}</strong>
                    <span>{item[1]}</span>
                  </button>
                ))}
              </div>
            </article>
            <article class="site-widget">
              <div class="site-widget-head">
                <div class="site-widget-title-block">
                  <span class="site-widget-title">{props.content.mock.widgets.weather.title}</span>
                  <span class="site-widget-sub">{props.content.mock.widgets.weather.sub}</span>
                </div>
                <span class="chip site-chip site-chip-ok">live</span>
              </div>
              <div class="weather">
                <div class="weather-mark">
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
                  <div class="metric">{props.content.mock.widgets.weather.metric}</div>
                  <span class="meta">{props.content.mock.widgets.weather.meta}</span>
                </div>
              </div>
            </article>
            <article class="site-widget">
              <div class="site-widget-head">
                <div class="site-widget-title-block">
                  <span class="site-widget-title">{props.content.mock.widgets.todo.title}</span>
                  <span class="site-widget-sub">{props.content.mock.widgets.todo.sub}</span>
                </div>
                <span class="chip site-chip">tasks</span>
              </div>
              <div class="task-list">
                <div class="task">
                  <span class="check done" />
                  <span>{props.content.mock.widgets.todo.items[0]}</span>
                </div>
                <div class="task">
                  <span class="check" />
                  <span>{props.content.mock.widgets.todo.items[1]}</span>
                </div>
                <div class="task">
                  <span class="check" />
                  <span>{props.content.mock.widgets.todo.items[2]}</span>
                </div>
              </div>
            </article>
            <article class="site-widget large">
              <div class="site-widget-head">
                <div class="site-widget-title-block">
                  <span class="site-widget-title">{props.content.mock.widgets.notes.title}</span>
                  <span class="site-widget-sub">{props.content.mock.widgets.notes.sub}</span>
                </div>
                <span class="chip site-chip">draft</span>
              </div>
              <p class="notes-body">{props.content.mock.widgets.notes.body}</p>
            </article>
            <article class="site-widget">
              <div class="site-widget-head">
                <div class="site-widget-title-block">
                  <span class="site-widget-title">
                    {props.content.mock.widgets.pluginStatus.title}
                  </span>
                  <span class="site-widget-sub">{props.content.mock.widgets.pluginStatus.sub}</span>
                </div>
                <span class="chip site-chip site-chip-ok">healthy</span>
              </div>
              <div class="plugin-stats">
                {props.content.mock.widgets.pluginStatus.rows.map((row: [string, string]) => (
                  <div class="plugin-stat">
                    <span>{row[0]}</span>
                    <strong>{row[1]}</strong>
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
