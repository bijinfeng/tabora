import { Button } from "@tabora/ui"
import { useNavigate } from "@solidjs/router"

export function Cta() {
  const navigate = useNavigate()

  return (
    <section class="cta" aria-label="开始使用 Tabora">
      <div class="copy">
        <h2>把浏览器打开后的第一屏，留给真正要做的事</h2>
        <p>Tabora 让新标签页成为一个可扩展、可持续整理的个人工作台。</p>
      </div>
      <div class="footer-actions">
        <Button variant="primary" onClick={() => navigate("/download")}>
          下载 Tabora
        </Button>
        <Button variant="secondary" onClick={() => navigate("/#anatomy")}>
          查看界面
        </Button>
      </div>
    </section>
  )
}
