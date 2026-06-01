import { Link } from "@tabora/ui"

export default {
  title: "Navigation/Link",
  component: Link,
}

export const Internal = {
  render: () => <Link href="#internal">内部链接</Link>,
}

export const External = {
  render: () => (
    <Link href="https://example.com" external>
      外部链接
    </Link>
  ),
}

export const Muted = {
  render: () => (
    <Link href="#" muted>
      次要链接
    </Link>
  ),
}

export const Plain = {
  render: () => <Link>纯文本链接（无 href）</Link>,
}

export const InParagraph = {
  render: () => (
    <p style={{ "font-size": "14px", "line-height": "1.6" }}>
      了解更多关于 Tabora 插件系统的信息，请查看{" "}
      <Link href="#docs" external>
        官方文档
      </Link>
      。
    </p>
  ),
}
