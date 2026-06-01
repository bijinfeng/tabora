import "@tabora/ui/styles.css"
import type { Preview } from "storybook-solidjs"

const preview: Preview = {
  globalTypes: {
    docsMode: {
      name: "Docs Mode",
      description: "Storybook 文档站视图提示",
      defaultValue: "component-docs",
      toolbar: {
        icon: "book",
        items: [
          { value: "component-docs", title: "Component Docs" },
          { value: "workbench-reference", title: "Workbench Reference" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    options: {
      storySort: {
        order: [
          "Introduction",
          ["Getting Started", "Contribution Guide", "Component Coverage"],
          "Actions",
          "Inputs",
          "Selections",
          "Navigation",
          "Layout",
          "Display",
          "Feedback",
          "Overlays",
          "Utility",
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "page",
      values: [
        { name: "page", value: "rgb(246, 247, 244)" },
        { name: "surface", value: "rgb(255, 255, 255)" },
        { name: "dark", value: "rgb(28, 30, 28)" },
      ],
    },
    layout: "padded",
  },
  tags: ["autodocs"],
}

export default preview
