import { CardSection as Primitive } from "../../primitives/cardSection/cardSection"
import type { CardSectionProps } from "../../primitives/cardSection/cardSection"
import "./styles.css"

export function CardSection(props: CardSectionProps) {
  return <Primitive {...props} class="tbr-card-section" />
}

export type { CardSectionProps }
