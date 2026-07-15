import { Progress } from "./progress.styled"
import "./progress.demo.css"

export function ProgressDemo() {
  return (
    <div class="docs-control-stack">
      <div class="demo-section">
        <h4>线性 — 尺寸</h4>
        <div class="demo-col">
          <Progress value={100} size="sm" aria-label="小尺寸进度 100%" />
          <div>
            <Progress value={60} aria-label="默认尺寸进度 60%" />
            <div class="progress-label">
              <span>60%</span>
              <span>3/5 完成</span>
            </div>
          </div>
          <Progress value={30} size="lg" aria-label="大尺寸进度 30%" />
        </div>
      </div>

      <div class="demo-section">
        <h4>圆形</h4>
        <div class="demo-row">
          <Progress value={60} variant="circular" showLabel aria-label="圆形进度 60%" />
        </div>
      </div>

      <div class="demo-section">
        <h4>导入插件包</h4>
        <div class="demo-row">
          <div style={{ width: "180px" }}>
            <Progress value={0} indeterminate aria-label="导入插件包进度" />
          </div>
        </div>
      </div>
    </div>
  )
}
