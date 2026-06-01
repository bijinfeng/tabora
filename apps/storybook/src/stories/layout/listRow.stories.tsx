import { ListRow } from "@tabora/ui"

export default {
  title: "Layout/ListRow",
  component: ListRow,
  args: {
    primary: "列表项标题",
    secondary: "列表项描述信息",
  },
}

export const Default = {
  render: () => <ListRow primary="列表项标题" secondary="列表项描述信息" />,
}

export const WithLeading = {
  render: () => (
    <ListRow
      leading={
        <div
          style={{
            width: "32px",
            height: "32px",
            "border-radius": "50%",
            background: "var(--tbr-color-accent)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            color: "white",
            "font-size": "14px",
          }}
        >
          A
        </div>
      }
      primary="用户名称"
      secondary="user@example.com"
    />
  ),
}

export const WithTrailing = {
  render: () => (
    <ListRow
      primary="版本号"
      trailing={<span style={{ color: "var(--tbr-color-text-muted)" }}>v2.1.0</span>}
    />
  ),
}

export const Clickable = {
  render: () => (
    <ListRow
      primary="点击此列表项"
      secondary="点击后会触发 onClick 事件"
      onClick={() => alert("列表项被点击")}
    />
  ),
}

export const WithDivider = {
  render: () => <ListRow primary="带分割线的列表项" divider />,
}

export const FullLayout = {
  render: () => (
    <ListRow
      leading={
        <div
          style={{
            width: "32px",
            height: "32px",
            "border-radius": "50%",
            background: "var(--tbr-color-success)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            color: "white",
          }}
        >
          ✓
        </div>
      }
      primary="完成的任务"
      secondary="于 2024年 3月 15日 完成"
      trailing={
        <span style={{ color: "var(--tbr-color-text-subtle)", "font-size": "12px" }}>3分钟前</span>
      }
      onClick={() => {}}
    />
  ),
}
