import { Button } from "@tabora/ui"
import { useNavigate } from "@solidjs/router"
import { For } from "solid-js"

import { Footer } from "../../shared/Footer"
import { SectionHead } from "../../shared/SectionHead"
import { installSteps, platformCards, supportRows } from "./downloadContent"
import { DownloadConsole } from "./components/DownloadConsole"

export function DownloadPage() {
  const navigate = useNavigate()

  return (
    <main>
      <section class="download-hero" id="download" aria-labelledby="download-title">
        <div class="hero-copy">
          <div class="label">DOWNLOAD TABORA</div>
          <h1 id="download-title">下载 Tabora</h1>
          <p>
            把浏览器新标签页换成一个极简个人工作台。先安装扩展，打开新标签页，再按自己的节奏添加卡片和搜索源。
          </p>
          <div class="hero-actions">
            <Button
              variant="primary"
              onClick={() => document.querySelector("#platforms")?.scrollIntoView()}
            >
              选择平台
            </Button>
            <Button variant="secondary" onClick={() => navigate("/#anatomy")}>
              查看界面
            </Button>
          </div>
        </div>
        <DownloadConsole />
      </section>

      <section class="section" id="platforms">
        <SectionHead
          label="PLATFORMS"
          title="选择你的使用方式"
          description="Tabora 优先作为浏览器新标签页使用。下载页先给用户明确入口，同时保留本地体验和源码入口。"
        />
        <div class="download-grid">
          <For each={platformCards}>
            {(item, index) => (
              <article class="card" classList={{ "card-featured": index() === 0 }}>
                <span class="platform-mark">{item[0]}</span>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
                <div class="card-actions">
                  <span class="button-static">{item[3]}</span>
                  <span class="tag">{item[4]}</span>
                </div>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="section">
        <SectionHead
          label="INSTALL"
          title="三步进入工作台"
          description="安装后不需要复杂配置。先使用默认首屏，再根据工作方式继续整理。"
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

      <section class="section">
        <SectionHead
          label="SUPPORT"
          title="支持范围"
          description="下载页面需要让用户快速判断是否适合自己，而不是阅读完整技术文档。"
        />
        <div class="table" aria-label="支持范围">
          <For each={supportRows}>
            {(row, index) => (
              <div class="table-row">
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
                <span class="tag" classList={{ blue: index() === 1 }}>
                  {row[2]}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="cta" aria-label="下载 Tabora">
        <div class="copy">
          <h2>把新标签页变成真正的工作起点</h2>
          <p>从默认工作台开始，再按自己的节奏添加卡片、搜索源和主题。</p>
        </div>
        <div class="footer-actions">
          <Button
            variant="primary"
            onClick={() => document.querySelector("#platforms")?.scrollIntoView()}
          >
            选择平台
          </Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            返回首页
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  )
}
