import { VisuallyHidden } from "@tabora/ui"

export default {
  title: "Utility/VisuallyHidden",
  component: VisuallyHidden,
}

export const InParagraph = {
  render: () => (
    <p>
      可见的上下文文本
      <VisuallyHidden>（辅助说明：此部分仅供屏幕阅读器访问）</VisuallyHidden>
      后续可见文本。
    </p>
  ),
}

export const ButtonLabel = {
  render: () => (
    <button
      style={{
        padding: "8px 16px",
        border: "1px solid var(--tbr-color-line)",
        "border-radius": "var(--tbr-radius-control)",
        background: "var(--tbr-color-surface)",
        cursor: "pointer",
      }}
      aria-describedby="vh-desc"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" />
      </svg>
      <VisuallyHidden>添加新项目</VisuallyHidden>
    </button>
  ),
}

export const SectionHeading = {
  render: () => (
    <section>
      <h3>
        <VisuallyHidden>主要功能</VisuallyHidden>
      </h3>
      <p>此处的内容在视觉上已有标题，但需要为屏幕阅读器补充语义。</p>
    </section>
  ),
}
