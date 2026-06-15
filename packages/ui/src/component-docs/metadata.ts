import { componentDocsCategories } from "./metadata.categories"
import { componentDocItems } from "./metadata.items"

export { componentDocItems, componentDocsCategories }

export function getComponentDoc(id: string) {
  return componentDocItems.find((item) => item.id === id)
}
