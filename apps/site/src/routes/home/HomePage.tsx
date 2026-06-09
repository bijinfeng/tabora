import { Button } from "@tabora/ui"
import { useNavigate } from "@solidjs/router"

import { Footer } from "../../shared/Footer"
import { scrollToHash } from "../../shared/scrollToHash"
import { AnatomySection, SignalStrip, WorkbenchSection } from "./components/WorkbenchSections"
import { Cta } from "./components/Cta"
import { LayoutsSection } from "./components/LayoutsSection"
import { PluginsSection } from "./components/PluginsSection"
import { ProductStage } from "./components/ProductStage"
import { StartSection } from "./components/StartSection"

export function HomePage() {
  const navigate = useNavigate()

  return (
    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <div class="label">PERSONAL BROWSER WORKBENCH</div>
          <h1 id="hero-title">Tabora</h1>
          <p>
            一个插件优先的个人工作台新标签页。把今日重点、快捷入口、便签、待办和命令搜索放进同一个极简界面。
          </p>
          <div class="hero-actions">
            <Button variant="primary" onClick={() => navigate("/download")}>
              下载 Tabora
            </Button>
            <Button variant="secondary" onClick={() => scrollToHash("#anatomy")}>
              查看界面
            </Button>
          </div>
        </div>

        <ProductStage />
      </section>

      <SignalStrip />
      <WorkbenchSection />
      <AnatomySection />
      <LayoutsSection />
      <PluginsSection />
      <StartSection />
      <Cta />
      <Footer />
    </main>
  )
}
