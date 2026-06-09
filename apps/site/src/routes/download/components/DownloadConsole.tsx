import { For } from "solid-js"

import { consoleRows } from "../downloadContent"

export function DownloadConsole() {
  return (
    <aside class="download-console" aria-label="下载状态">
      <div class="console-top">
        <span>release channel</span>
        <span>tabora.newtab</span>
      </div>
      <div class="console-body">
        <For each={consoleRows}>
          {(item) => (
            <div class="console-row">
              <div>
                <h3>{item[0]}</h3>
                <p class="muted">{item[1]}</p>
              </div>
              <span class="tag" classList={{ blue: item[3] === "blue" }}>
                {item[2]}
              </span>
            </div>
          )}
        </For>
      </div>
    </aside>
  )
}
