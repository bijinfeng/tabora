import { Accordion as P } from "../../primitives/accordion/accordion"
import type { AccordionProps, AccordionItem } from "../../primitives/accordion/accordion"
import "./styles.css"
export function Accordion(props: AccordionProps) {
  return <P {...props} />
}
export type { AccordionProps, AccordionItem }
