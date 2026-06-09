import { workbenchScreenshot } from "../../../shared/workbenchScreenshot"

export function ProductStage() {
  return (
    <div class="product-stage" aria-label="Tabora 产品界面">
      <div class="stage-top">
        <div class="stage-dots" aria-hidden="true">
          <span class="stage-dot" />
          <span class="stage-dot" />
          <span class="stage-dot" />
        </div>
        <span>tabora://workbench</span>
      </div>
      <img src={workbenchScreenshot} alt="Tabora 工作台界面截图" />
    </div>
  )
}
