import type { HomePageContent } from "../homePrototypeContent"

export function CommandDialog(props: {
  content: HomePageContent
  open: boolean
  close: () => void
  setInputRef: (element: HTMLInputElement) => void
}) {
  return (
    <div
      class="command-dialog"
      classList={{ visible: props.open }}
      data-command-dialog
      data-component="SiteCommandDialog"
      aria-hidden={!props.open}
      onClick={(event) => {
        if (event.target === event.currentTarget) props.close()
      }}
    >
      <div class="palette" role="dialog" aria-modal="true" aria-label="命令面板">
        <div class="palette-head">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={props.setInputRef}
            value={props.content.command.query}
            aria-label="命令搜索示例"
          />
          <span class="kbd kbd-inline">Esc</span>
        </div>
        <div class="palette-list">
          {props.content.command.items.map(
            (item: [string, string, string, string], index: number) => (
              <div class="palette-item" classList={{ active: index === 0 }}>
                <span class="kbd kbd-inline">{item[0]}</span>
                <div>
                  <strong>{item[1]}</strong>
                  <br />
                  <span>{item[2]}</span>
                </div>
                <span class="meta">{item[3]}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
