import { createMemo, createSignal, Show } from "solid-js"

import { SectionHead } from "../../../shared/SectionHead"
import type { LayoutMode } from "../homeContent"

export function LayoutsSection() {
  const [mode, setMode] = createSignal<LayoutMode>("dashboard")
  const isDashboard = createMemo(() => mode() === "dashboard")

  return (
    <section class="section" id="layouts">
      <SectionHead
        label="LAYOUTS"
        title="同一套内容，两种工作节奏"
        description="仪表盘适合并行扫视，专注布局适合把一张核心卡片放在当下。切换布局不改变卡片语义，只改变你面对信息的方式。"
      />
      <div class="layout-panel">
        <div class="layout-toolbar" aria-label="布局切换">
          <button
            class="layout-tab"
            type="button"
            data-active={isDashboard()}
            onClick={() => setMode("dashboard")}
          >
            Dashboard
          </button>
          <button
            class="layout-tab"
            type="button"
            data-active={!isDashboard()}
            onClick={() => setMode("focus")}
          >
            Focus
          </button>
        </div>
        <div class="layout-stage">
          <Show when={isDashboard()} fallback={<FocusShot />}>
            <DashboardShot />
          </Show>
        </div>
      </div>
    </section>
  )
}

function DashboardShot() {
  return (
    <div class="layout-shot dashboard-shot" aria-label="Dashboard 布局示意">
      <div class="v-rail" />
      <div class="v-main">
        <div class="v-bar" />
        <div class="v-grid">
          <div class="v-card" />
          <div class="v-card" />
          <div class="v-card" />
          <div class="v-card" />
        </div>
      </div>
    </div>
  )
}

function FocusShot() {
  return (
    <div class="layout-shot stream-shot" aria-label="Focus 布局示意">
      <div class="v-bar" />
      <div class="v-columns">
        <div class="v-column" />
        <div class="v-column" />
      </div>
    </div>
  )
}
