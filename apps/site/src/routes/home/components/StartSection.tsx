import { For } from "solid-js"

import { SectionHead } from "../../../shared/SectionHead"
import { installSteps } from "../homeContent"

export function StartSection() {
  return (
    <section class="section" id="start">
      <SectionHead
        label="START"
        title="从一个极简的新标签页开始"
        description="先使用默认工作台，再根据自己的工作方式增加卡片、搜索源和主题。"
      />
      <div class="start-grid">
        <For each={installSteps}>
          {(item) => (
            <article class="start-card">
              <span class="problem-index">{item[0]}</span>
              <h3>{item[1]}</h3>
              <p class="muted">{item[2]}</p>
            </article>
          )}
        </For>
      </div>
    </section>
  )
}
