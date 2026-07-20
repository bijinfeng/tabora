import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import {
  Badge,
  CardSection,
  EmptyState,
  Field,
  FieldRow,
  InlineError,
  ListRow,
  Progress,
  Skeleton,
  SkeletonText,
  Spinner,
} from "../index"

const migratedClassFragments = [
  "tbr-badge",
  "tbr-card-section",
  "tbr-empty-state",
  "tbr-field",
  "tbr-field-row",
  "tbr-inline-error",
  "tbr-list-row",
  "tbr-progress",
  "tbr-skeleton",
  "tbr-spinner",
]

describe("content component StyleX migration", () => {
  it("uses generated classes while preserving representative states", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <Badge variant="success">运行中</Badge>
          <CardSection title="插件状态" trailing={<Badge variant="counter">3</Badge>}>
            内容
          </CardSection>
          <EmptyState title="没有卡片" description="添加一个组件" action={<button>添加</button>} />
          <Field label="名称" htmlFor="name" helper="公开显示" error="必填">
            <input id="name" />
          </Field>
          <FieldRow
            label="启用插件"
            description="立即生效"
            helper="本地保存"
            trailing={<span>开</span>}
          />
          <InlineError>加载失败</InlineError>
          <ListRow primary="危险操作" selected danger onClick={() => {}} />
          <Progress value={50} aria-label="进度" />
          <Skeleton aria-label="加载卡片" />
          <SkeletonText lines={2} />
          <Spinner />
        </>
      ),
      root,
    )

    const badge = root.querySelector("[data-variant='success']") as HTMLElement
    const progress = root.querySelector("[role='progressbar']") as HTMLElement
    const status = root.querySelector("[role='status']") as HTMLElement

    expect(badge.className.length).toBeGreaterThan(0)
    expect(badge.className).not.toContain("tbr-badge")
    expect(progress.getAttribute("aria-valuenow")).toBe("50")
    expect(progress.className).not.toContain("tbr-progress")
    expect(status.getAttribute("aria-label")).toBe("加载中")

    for (const classFragment of migratedClassFragments) {
      expect(root.querySelector(`[class*='${classFragment}']`)).toBeNull()
    }
  })
})
