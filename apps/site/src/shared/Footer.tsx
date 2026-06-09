import { A } from "@solidjs/router"

export function Footer() {
  return (
    <footer class="footer">
      <span>Tabora</span>
      <div class="footer-links">
        <A href="/#workbench">工作台</A>
        <A href="/#anatomy">界面</A>
        <A href="/#plugins">插件</A>
        <A href="/download">下载</A>
        <A href="/docs">文档</A>
      </div>
    </footer>
  )
}
