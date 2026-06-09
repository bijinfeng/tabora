import { Badge } from "../badge"
import { ListRow } from "../listRow"
import { CardSection } from "./cardSection.styled"

export function CardSectionDemo() {
  return (
    <CardSection title="搜索" trailing={<Badge>3 sources</Badge>}>
      <ListRow primary="Google" secondary="默认搜索源" />
    </CardSection>
  )
}
