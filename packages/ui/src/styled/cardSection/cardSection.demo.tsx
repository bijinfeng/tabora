import { Badge } from "../badge"
import { ListRow } from "../listRow"
import { CardSection } from "./cardSection.styled"

export function CardSectionDemo() {
  return (
    <div class="docs-control-stack">
      <CardSection title="搜索配置" trailing={<Badge>3 sources</Badge>}>
        <ListRow primary="Google" secondary="默认搜索源" />
        <ListRow primary="侧边预览" secondary="打开方式" />
      </CardSection>
      <CardSection title="最近活动" trailing={<Badge variant="success">已同步</Badge>}>
        <ListRow primary="08:32" secondary="保存默认搜索源" />
        <ListRow primary="08:35" secondary="切换结果布局为卡片" />
      </CardSection>
    </div>
  )
}
