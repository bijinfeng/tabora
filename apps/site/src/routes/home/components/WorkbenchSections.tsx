import { For } from "solid-js"

import { SectionHead } from "../../../shared/SectionHead"
import { workbenchScreenshot } from "../../../shared/workbenchScreenshot"
import { problems, signals } from "../homeContent"
import { UiFragment } from "./UiFragment"

export function SignalStrip() {
  return (
    <section class="signal-strip" aria-label="Tabora 核心能力">
      <For each={signals}>
        {(item) => (
          <div class="signal">
            <strong>{item[0]}</strong>
            <span>{item[1]}</span>
          </div>
        )}
      </For>
    </section>
  )
}

export function WorkbenchSection() {
  return (
    <section class="section" id="workbench">
      <SectionHead
        label="WHY TABORA"
        title="新标签页不应该只是搜索框和背景图"
        description="Tabora 面向每天反复打开浏览器的人。它把工作启动时最常见的三个问题，放到一个稳定、可整理的界面里。"
      />
      <div class="problem-row">
        <For each={problems}>
          {(item, index) => (
            <article class="problem">
              <span class="problem-index">{item[0]}</span>
              <h3>{item[1]}</h3>
              <p class="muted">{item[2]}</p>
              <UiFragment variant={index()} />
            </article>
          )}
        </For>
      </div>
    </section>
  )
}

export function AnatomySection() {
  return (
    <section class="section" id="anatomy">
      <SectionHead
        label="INTERFACE"
        title="一个工作台，而不是一组松散的小组件"
        description="搜索、卡片、主题和设置在同一个界面里各司其职。默认视图保持安静，卡片变多时仍然按工作流组织。"
      />
      <div class="anatomy">
        <img src={workbenchScreenshot} alt="Tabora 工作台区域说明" />
        <span class="pin search">Command Search</span>
        <span class="pin focus">Today Focus</span>
        <span class="pin links">Quick Links</span>
        <span class="pin notes">Notes</span>
        <span class="pin theme">Theme</span>
      </div>
    </section>
  )
}
