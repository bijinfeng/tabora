import { Button } from "@tabora/ui"
import { useNavigate } from "@solidjs/router"
import { For } from "solid-js"

import { plugins } from "../homeContent"

export function PluginsSection() {
  const navigate = useNavigate()

  return (
    <section class="section" id="plugins">
      <div class="plugin-grid">
        <div class="copy">
          <div class="label">PLUGIN-FIRST</div>
          <h2>默认好用，也能继续扩展</h2>
          <p>
            用户先获得稳定的默认工作台。搜索源、卡片、背景、主题和设置面板可以继续由插件贡献，让新标签页不会被固定模板锁死。
          </p>
          <div class="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/download")}>
              下载 Tabora
            </Button>
            <Button variant="secondary" onClick={() => navigate("/#anatomy")}>
              查看界面
            </Button>
          </div>
        </div>

        <div class="plugin-list">
          <For each={plugins}>
            {(item) => (
              <article class="plugin-row">
                <div>
                  <h3>{item[0]}</h3>
                  <p class="muted">{item[1]}</p>
                </div>
                <span
                  class="tag"
                  classList={{ blue: item[3] === "blue", amber: item[3] === "amber" }}
                >
                  {item[2]}
                </span>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}
