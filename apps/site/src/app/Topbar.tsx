import { TaboraMark } from "@tabora/brand"
import { A, useLocation } from "@solidjs/router"

import { scrollToHash } from "../shared/scrollToHash"

export function Topbar(props: { onToggleTheme: () => void }) {
  const location = useLocation()
  const isDocs = () => location.pathname.startsWith("/docs")

  return (
    <header class="topbar">
      <A class="brand" aria-label="Tabora 首页" href="/">
        <TaboraMark class="brand-mark" />
        <span>Tabora</span>
      </A>
      <nav class="nav" aria-label="主导航">
        <A href="/#workbench" onClick={() => scrollToHash("#workbench")}>
          工作台
        </A>
        <A href="/#anatomy" onClick={() => scrollToHash("#anatomy")}>
          界面
        </A>
        <A href="/#layouts" onClick={() => scrollToHash("#layouts")}>
          布局
        </A>
        <A href="/#plugins" onClick={() => scrollToHash("#plugins")}>
          插件
        </A>
        <A href="/download">下载</A>
        <A href="/docs" classList={{ active: isDocs() }}>
          文档
        </A>
      </nav>
      <button
        class="theme-toggle"
        type="button"
        aria-label="切换主题"
        onClick={props.onToggleTheme}
      >
        <span class="theme-dot" aria-hidden="true" />
      </button>
    </header>
  )
}
