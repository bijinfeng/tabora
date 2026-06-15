import type { DocsPageContent } from "./docsPageContent.types"

export const enDocsPageContent: DocsPageContent = {
  sidebarTitle: "Tabora Docs",
  sidebarGroups: [
    {
      title: "Getting started",
      items: [
        { id: "quickstart", label: "Quick start" },
        { id: "manifest", label: "Manifest" },
        { id: "runtime", label: "Runtime API" },
        { id: "contributions", label: "Contribution types" },
        { id: "tokens", label: "Design tokens" },
      ],
    },
    {
      title: "Inputs",
      items: [
        { id: "button", label: "Button" },
        { id: "input", label: "Input" },
        { id: "textarea", label: "Textarea" },
      ],
    },
    {
      title: "Selection controls",
      items: [
        { id: "select", label: "Select" },
        { id: "checkbox", label: "Checkbox" },
        { id: "switch", label: "Switch" },
        { id: "radio", label: "Radio" },
      ],
    },
    {
      title: "Overlays and menus",
      items: [
        { id: "tabs", label: "Tabs" },
        { id: "dialog", label: "Dialog" },
        { id: "drawer", label: "Drawer" },
        { id: "tooltip", label: "Tooltip" },
      ],
    },
    {
      title: "Feedback",
      items: [
        { id: "toast", label: "Toast" },
        { id: "progress", label: "Spinner / Progress" },
        { id: "skeleton", label: "Skeleton" },
        { id: "empty", label: "Empty state" },
      ],
    },
    {
      title: "Labels and layout",
      items: [
        { id: "badge", label: "Badge" },
        { id: "table", label: "Table" },
        { id: "card", label: "Card" },
      ],
    },
  ],
  sections: {
    quickstart: {
      eyebrow: "QUICKSTART",
      title: "Create your first Tabora plugin in three steps",
      description:
        "The Tabora plugin folder stays minimal: the manifest declares contributions, component files only render the plugin content area, and host capabilities are requested through runtime context instead of direct DOM control.",
      demos: [
        {
          title: "1 — Create the folder structure",
          codeBlock: {
            label: "terminal",
            copyLabel: "Copy",
            copiedLabel: "Copied",
            copyId: "qs-cmd",
            code: `mkdir plugins/today-focus
cd plugins/today-focus
touch tabora.plugin.json TodayFocusWidget.tsx`,
          },
        },
        {
          title: "2 — Folder structure",
          treeBlock: {
            label: "file tree",
            code: `plugins/today-focus/
├── tabora.plugin.json      # plugin manifest
├── TodayFocusWidget.tsx    # widget entry component
├── TodayFocusSettings.tsx  # settings panel (optional)
└── assets/                 # private assets (optional)`,
          },
        },
        {
          title: "3 — Minimal manifest",
          codeBlock: {
            label: "tabora.plugin.json",
            copyLabel: "Copy",
            copiedLabel: "Copied",
            copyId: "qs-manifest",
            code: `{
  "id": "official.widgets.today-focus",
  "name": "Today Focus",
  "version": "1.0.0",
  "contributions": {
    "widgets": [{ "id": "today-focus", "title": "Today Focus", "entry": "./TodayFocusWidget.tsx", "sizes": ["medium", "large"] }]
  },
  "permissions": ["storage:read", "storage:write"]
}`,
          },
        },
      ],
    },
    manifest: {
      eyebrow: "MANIFEST",
      title: "Manifest describes capabilities, not host implementation",
      description:
        "All contribution points are declared through the contributions field. Plugins cannot create global containers directly and must request host capabilities from runtime.",
      anatomyTitle: "Field structure",
      anatomyItems: [
        "id — globally unique, formatted as namespace.category.name",
        "name — user-facing display name",
        "version — follows semver for host update decisions",
        "contributions — declares widgets / layouts / searchProviders / settingsPanels",
        "permissions — required host permissions that can be revoked in settings",
      ],
      codeBlock: {
        label: "Full manifest example",
        copyLabel: "Copy",
        copiedLabel: "Copied",
        copyId: "manifest-full",
        code: `{
  "id": "official.widgets.today-focus",
  "name": "Today Focus",
  "version": "1.0.0",
  "contributions": {
    "widgets": [
      {
        "id": "today-focus",
        "title": "Today Focus",
        "entry": "./TodayFocusWidget.tsx",
        "sizes": ["medium", "large"],
        "settingsPanel": "today-focus-settings"
      }
    ],
    "settingsPanels": [
      {
        "id": "today-focus-settings",
        "title": "Today Focus settings",
        "entry": "./TodayFocusSettings.tsx"
      }
    ]
  },
  "permissions": ["storage:read", "storage:write"]
}`,
      },
      table: {
        columns: ["Field", "Type", "Required", "Description"],
        rows: [
          ["id", "string", "✓", "Globally unique identifier, preferably three-part naming"],
          ["name", "string", "✓", "User-visible name, under 32 characters"],
          ["version", "string", "✓", "Semver format: 1.0.0"],
          [
            "contributions",
            "object",
            "✓",
            "Contribution declaration object with at least one child field",
          ],
          ["permissions", "string[]", "—", "Requested permissions, empty array by default"],
          ["description", "string", "—", "Plugin description shown in settings or marketplace"],
        ],
      },
    },
    runtime: {
      eyebrow: "RUNTIME API",
      title: "Plugins use host capabilities through runtime context",
      description:
        "Each contribution entry component receives a runtime prop that exposes storage, external links, toast, and global host state.",
      demos: [
        {
          title: "Widget example",
          codeBlock: {
            label: "TodayFocusWidget.tsx",
            copyLabel: "Copy",
            copiedLabel: "Copied",
            copyId: "rt-widget",
            code: `export function TodayFocusWidget({ runtime }) {
  const tasks = runtime.storage.useList("tasks")

  return (
    <CardSection title="Today focus">
      {tasks.map((task) => (
        <ListRow key={task.id} title={task.title}>
          <Checkbox checked={task.done} onCheckedChange={(v) => runtime.storage.update(task.id, { done: v })} />
        </ListRow>
      ))}
      <Button variant="secondary" size="sm" onClick={() => runtime.toast.show({ title: "Added" })}>
        Add task
      </Button>
    </CardSection>
  )
}`,
          },
        },
        {
          title: "Search Provider example",
          codeBlock: {
            label: "githubProvider.ts",
            copyLabel: "Copy",
            copiedLabel: "Copied",
            copyId: "rt-search",
            code: `export const githubProvider = {
  id: "github",
  label: "GitHub",
  prefix: "@github",
  async query(input: string, runtime) {
    if (!input.trim()) return []
    const url = \`https://github.com/search?q=\${encodeURIComponent(input)}\`
    return [{
      id: "github-search",
      title: input,
      subtitle: "Search on GitHub",
      action: () => runtime.external.open(url)
    }]
  }
}`,
          },
        },
        {
          title: "Settings Panel example",
          codeBlock: {
            label: "TodayFocusSettings.tsx",
            copyLabel: "Copy",
            copiedLabel: "Copied",
            copyId: "rt-settings",
            code: `export function TodayFocusSettings({ runtime }) {
  const compact = runtime.settings.useBoolean("compact", false)
  const maxItems = runtime.settings.useNumber("maxItems", 5)

  return (
    <>
      <Field label="Compact mode" description="Reduce card padding for smaller widget sizes.">
        <Switch checked={compact.value} onCheckedChange={compact.set} />
      </Field>
      <Field label="Maximum visible items">
        <Select value={maxItems.value.toString()} onValueChange={(v) => maxItems.set(Number(v))}>
          <SelectItem value="3">3 items</SelectItem>
          <SelectItem value="5">5 items</SelectItem>
          <SelectItem value="10">10 items</SelectItem>
        </Select>
      </Field>
    </>
  )
}`,
          },
        },
      ],
      table: {
        columns: ["runtime namespace", "Description", "Common methods"],
        rows: [
          [
            "runtime.storage",
            "Persistent key-value and list storage",
            "useList, get, set, update, remove",
          ],
          ["runtime.toast", "Trigger host-level toast", "show({ title, variant })"],
          ["runtime.external", "Open external links safely", "open(url)"],
          ["runtime.settings", "Persist plugin-level settings", "useBoolean, useString, useNumber"],
          ["runtime.theme", "Read current theme state", "useColorScheme()"],
        ],
      },
    },
    contributions: {
      eyebrow: "CONTRIBUTION TYPES",
      title: "Four contribution types cover the visible workbench experience",
      description:
        "Each contribution type is declared through the manifest's contributions field. The host discovers and mounts them at startup.",
      table: {
        columns: ["Contribution", "Field", "Usage", "Size constraint"],
        rows: [
          ["Widget", "widgets", "Workbench card content", "small / medium / large"],
          [
            "Layout",
            "layouts",
            "Custom overall layout scheme",
            "Fullscreen, shell-managed container",
          ],
          [
            "Search Provider",
            "searchProviders",
            "Custom search source",
            "Dropdown rendered by the host",
          ],
          ["Settings Panel", "settingsPanels", "Plugin-specific settings UI", "Inside host modal"],
        ],
      },
      doTitle: "✓ Do",
      doBody:
        "Each contribution type should only own content logic, not the surrounding shell. Widgets focus on card DOM and layouts focus on slot arrangement.",
      dontTitle: "✗ Don't",
      dontBody:
        "Do not create global modals or standalone toasts inside widgets. Use runtime.toast and host-provided containers to avoid z-index conflicts.",
    },
    tokens: {
      eyebrow: "DESIGN TOKENS",
      title: "Refined Sage V2.3 — CSS custom properties",
      description:
        "All components consume design tokens through CSS variables. Dark mode is switched by the .dark class, and plugin content inherits host tokens automatically.",
      previewTitle: "Color token preview",
      swatches: [
        {
          name: "--cp-accent",
          style:
            "padding: 10px 12px; background: var(--cp-accent); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
        },
        {
          name: "--cp-accent-soft",
          style:
            "padding: 10px 12px; background: var(--cp-accent-soft); color: var(--cp-accent); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
        },
        {
          name: "--cp-surface",
          style:
            "padding: 10px 12px; background: var(--cp-surface); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
        },
        {
          name: "--cp-surface-soft",
          style:
            "padding: 10px 12px; background: var(--cp-surface-soft); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
        },
        {
          name: "--cp-surface-hover",
          style:
            "padding: 10px 12px; background: var(--cp-surface-hover); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
        },
        {
          name: "--cp-page",
          style:
            "padding: 10px 12px; background: var(--cp-page); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
        },
        {
          name: "--cp-danger",
          style:
            "padding: 10px 12px; background: var(--cp-danger); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
        },
        {
          name: "--cp-success",
          style:
            "padding: 10px 12px; background: var(--cp-success); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
        },
      ],
      table: {
        columns: ["Token", "Light", "Dark", "Usage"],
        rows: [
          [
            "--cp-accent",
            "#1a9070",
            "#34d19e",
            "Primary accent for buttons, links, and focus rings",
          ],
          ["--cp-accent-soft", "#eaf5f0", "#1a2e26", "Soft accent background, selected chips"],
          ["--cp-surface", "#ffffff", "#252927", "Cards, inputs, and overlays"],
          ["--cp-text", "#1c1e1c", "#edf0ed", "Primary text color"],
          ["--cp-text-muted", "#6b6e6a", "#b6bab6", "Secondary text and placeholders"],
          ["--cp-line", "#e6e8e3", "#3b403c", "Dividers and borders"],
          ["--cp-danger", "#c94545", "#ef8b8b", "Danger and error state"],
          ["--cp-radius-control", "8px", "8px", "Control radius for buttons and inputs"],
        ],
      },
    },
  },
  componentSpecs: {
    inputControls: [
      {
        id: "button",
        title: "Button",
        description:
          "Primary action trigger. Six variants, three sizes, and clear action hierarchy. In plugin content, prefer primary and secondary, while dangerous actions must be paired with a confirmation dialog.",
        metaTags: ["6 variants", "3 sizes", "Button group", "Icon button"],
        anatomyTitle: "Anatomy",
        anatomyItems: [
          ".btn — base class required by every variant",
          ".btn-{variant} — primary / secondary / subtle / ghost / danger / danger-subtle",
          ".btn-{size} — sm (28px) / md (36px) / lg (44px)",
          ".btn-full — stretches to parent width",
          ".btn-group — wraps and visually connects buttons",
        ],
        demos: [{ title: "Example", exampleId: "button" }],
        table: {
          columns: ["Variant", "Background", "Text", "Use case"],
          rows: [
            [".btn-primary", "--cp-accent", "#fff", "The single most important action on a screen"],
            [
              ".btn-secondary",
              "--cp-surface",
              "--cp-text",
              "Secondary actions, cancel, navigation",
            ],
            [
              ".btn-subtle",
              "--cp-accent-soft",
              "--cp-accent",
              "Low-emphasis toolbar and filter actions",
            ],
            [
              ".btn-ghost",
              "transparent",
              "--cp-text-muted",
              "Inline helpers and card-level utilities",
            ],
            [
              ".btn-danger",
              "--cp-danger",
              "#fff",
              "Irreversible destructive actions with confirmation",
            ],
            [
              ".btn-danger-subtle",
              "--cp-danger-soft",
              "--cp-danger",
              "Lower-intensity danger state",
            ],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Keep at most one primary button per functional area. Use secondary or ghost for supporting actions so hierarchy stays clear.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not place multiple primary buttons in the same row. Danger actions must not be the first step without confirmation.",
        pluginExample: {
          label: "Plugin usage example",
          copyLabel: "Copy",
          copiedLabel: "Copied",
          copyId: "btn-code",
          code: `// Basic usage
<Button variant="primary">Confirm</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost" size="sm">View details</Button>

// Dangerous action with Dialog
<Button variant="danger" onClick={() => setConfirmOpen(true)}>Delete record</Button>

// Full width
<Button variant="primary" fullWidth>Start sync</Button>`,
        },
      },
      {
        id: "input",
        title: "Input",
        description:
          "Single-line text input. Supports three sizes, prefix and suffix slots, and four validation states. All input controls share the same radius and border tokens.",
        metaTags: ["3 sizes", "4 states", "Prefix / suffix", "Clearable"],
        demos: [{ title: "Example", exampleId: "input" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Size", ".ipt-sm / default / .ipt-lg", "28px / 36px / 44px height"],
            ["Validation", ".ipt-success / .ipt-error", "Green or red border feedback"],
            ["Disabled", "disabled", "Reduces opacity and blocks interaction"],
            ["Wrapper", ".ipt-wrap", "Container for prefix and suffix positioning"],
            ["Prefix", ".ipt-prefix", "Icon or text on the left side"],
            ["Suffix", ".ipt-suffix", "Icon or text on the right side"],
            ["Clear", ".ipt-clear", "Clear button shown when the input has content"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Always provide a placeholder that hints at the expected format. Error states must show field-error text, and form inputs must be paired with a label.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not use title as a label replacement, and do not hide essential guidance only inside placeholders.",
      },
      {
        id: "textarea",
        title: "Textarea",
        description:
          "Multiline text input. Supports auto-grow, character counting, and resizing. Shares validation and labeling patterns with Input.",
        metaTags: ["Auto grow", "Counter", "Resizable"],
        demos: [{ title: "Example", exampleId: "textarea" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".txa", "Base multiline input class"],
            ["Auto grow", ".txa-auto", "Grows with content"],
            ["Error state", ".txa-error", "Red border feedback"],
            ["Resize", "resize: vertical", "Vertically resizable by default"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Show a live counter when the content has limits, and prefer txa-auto for longer input flows.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not disable resizing, and avoid rows below 2 because it collapses into an Input-like control.",
      },
    ],
    selectionControls: [
      {
        id: "select",
        title: "Select",
        description:
          "Single-choice dropdown. Styled on top of native select to preserve keyboard accessibility and mobile-native behavior. Replace with Combobox for complex cases.",
        metaTags: ["3 sizes", "Grouped", "Disabled option"],
        demos: [{ title: "Example", exampleId: "select" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Size", ".sel-sm / default / .sel-lg", "28px / 36px / 44px height"],
            ["Error", ".sel-error", "Red border for required-but-missing state"],
            ["Disabled", "disabled", "Muted background and blocked interaction"],
            ["Grouping", "<optgroup>", "Native grouping with nested options"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Use Select when options stay under 15. Keep the first option as an empty placeholder and group related choices clearly.",
        dontTitle: "✗ Don't",
        dontBody:
          "Switch to Combobox when options exceed 15, and never use Select for multi-select.",
      },
      {
        id: "checkbox",
        title: "Checkbox",
        description:
          "Multi-select toggle. Supports checked, unchecked, and indeterminate states. Useful in settings panels and bulk operations.",
        metaTags: ["3 states", "2 sizes", "Grouped use"],
        demos: [{ title: "Example", exampleId: "checkbox" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".chk", "Checkbox container wrapped by label"],
            ["Box", ".chk-box", "Custom checkbox visual element"],
            ["Indeterminate", ".chk-indeterminate", "Middle state for partial selection"],
            ["Disabled", "disabled on input", "Reduced opacity and blocked interaction"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          'Offer a "select all" checkbox when the list grows, and write labels around user intent rather than status.',
        dontTitle: "✗ Don't",
        dontBody:
          "Do not use Checkbox for binary toggles and do not mix unrelated form controls into one checkbox group.",
      },
      {
        id: "switch",
        title: "Switch",
        description:
          "Binary toggle that takes effect immediately. Best for settings-panel toggles that do not require an explicit save action.",
        metaTags: ["2 sizes", "Immediate", "With labels"],
        demos: [{ title: "Example", exampleId: "switch" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".swi", "Switch container wrapped by label"],
            ["Track", ".swi-track", "Track visual element"],
            ["Small", ".swi-sm", "Compact size for dense lists"],
            ["Disabled", "disabled on input", "Reduced opacity and blocked interaction"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Use Switch only for immediate binary toggles. Keep the label on the left and the control aligned on the right.",
        dontTitle: "✗ Don't",
        dontBody:
          "Use Checkbox instead when the change should wait for Save, and never use one Switch row to represent multi-select.",
      },
      {
        id: "radio",
        title: "Radio",
        description:
          "Mutually exclusive options. Best when the set stays small and all choices should remain visible at once.",
        metaTags: ["Mutually exclusive", "Grouped", "Horizontal / vertical"],
        demos: [{ title: "Example", exampleId: "radio" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".rad", "Radio container wrapped by label"],
            ["Dot", ".rad-dot", "Custom circular indicator"],
            ["Grouping", "same name attribute", "Browser-managed mutual exclusion"],
            ["Disabled", "disabled on input", "Reduced opacity and blocked interaction"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Use Radio when there are only a few options and give the group a sensible default selection.",
        dontTitle: "✗ Don't",
        dontBody:
          "Switch to Select or Combobox when the list gets longer, and do not mix Radio with Checkbox semantics.",
      },
    ],
    overlayControls: [
      {
        id: "tabs",
        title: "Tabs",
        description:
          "Section navigation for sibling panels within the same view. Best for settings partitions and plugin detail panes.",
        metaTags: ["Linear", "Pill", "Scrollable", "Icon"],
        demos: [{ title: "Example", exampleId: "tabs" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Container", ".tbr-tabs", "Kobalte Tabs root container"],
            ["List", ".tbr-tabs-list", "Horizontal tab bar with overflow handling"],
            ["Item", ".tbr-tabs-trigger", "Single tab trigger"],
            ["Active", "data-selected", "Currently selected tab"],
            ["Pill", 'variant="pills"', "Rounded pill variant"],
            ["Badge", 'Badge variant="counter"', "Inline count badge"],
            ["Disabled", "disabled: true", "Non-interactive tab"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Keep tab counts tight, make the active state obvious, and switch content without causing layout jumps.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not nest Tabs or use them as top-level navigation. Lazy tab panels should still show loading feedback.",
      },
      {
        id: "dialog",
        title: "Dialog",
        description:
          "Modal overlay for critical confirmations and short forms. It interrupts the flow to focus the current decision.",
        metaTags: ["3 sizes", "Confirmation", "Form", "Destructive"],
        demos: [{ title: "Example", exampleId: "dialog" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Overlay", ".dialog-overlay", "Semi-transparent backdrop"],
            ["Container", ".dialog", "Centered surface panel"],
            ["Small", ".dialog-sm", "360px max width for short confirmations"],
            ["Medium", "default", "480px max width for forms"],
            ["Large", ".dialog-lg", "640px max width for denser content"],
            ["Close", "ESC / backdrop / close button", "Three close paths"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Use Dialog for destructive confirmation, close it after successful submission, and keep focus trapped inside it.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not nest Dialogs. If content grows beyond one screen, switch to Drawer or a dedicated page.",
      },
      {
        id: "drawer",
        title: "Drawer",
        description:
          "Side panel that keeps users on the current page while exposing more details or a larger editing form.",
        metaTags: ["Slide-in", "Embedded forms", "Backdrop close"],
        demos: [{ title: "Example", exampleId: "drawer" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Overlay", ".drawer-overlay", "Backdrop that closes on click"],
            ["Panel", ".drawer", "Right-side panel, 360px by default"],
            ["Header", ".drawer-head", "Title and close action"],
            ["Body", ".drawer-body", "Scrollable content area"],
            ["Footer", ".drawer-foot", "Pinned action bar"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Prefer Drawer for editing flows, pin the actions to the bottom, and warn about unsaved changes on close.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not turn tiny 1-2 field forms into a Drawer and avoid opening another Drawer from inside one.",
      },
      {
        id: "tooltip",
        title: "Tooltip",
        description:
          "Short helper text shown on hover or focus. Ideal for icon buttons and compact UI where labels are hidden.",
        metaTags: ["4 directions", "Delayed", "Non-interactive"],
        demos: [{ title: "Example", exampleId: "tooltip" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Container", ".tip-wrap", "Relative positioning wrapper"],
            ["Bubble", ".tip", "Shown on hover / focus"],
            ["Direction", ".tip-top / .tip-bottom / .tip-left / .tip-right", "Bubble placement"],
            ["Delay", "300ms", "Reduces flicker"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Give icon-only buttons a Tooltip, keep the content to one line, and preserve an aria-label on touch devices.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not place interactive controls inside Tooltip, and skip it when the button already has visible text.",
      },
    ],
    feedbackControls: [
      {
        id: "toast",
        title: "Toast",
        description:
          "Non-blocking feedback that appears briefly and then disappears. Best for action outcomes and lightweight notices.",
        metaTags: ["4 variants", "Auto dismiss", "Dismissible", "Stackable"],
        demos: [{ title: "Example", exampleId: "toast" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Success", ".toast-success", "Green success feedback"],
            ["Error", ".toast-error", "Red failure feedback"],
            ["Warning", ".toast-warning", "Orange caution notice"],
            ["Info", ".toast-info", "Blue neutral notice"],
            ["Duration", "3000ms default", "Success / info are shorter than error / warning"],
            ["Position", "Top-right", "Stacks vertically"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Show Toast feedback immediately after actions, offer undo for reversible actions, and keep errors visible longer.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not use Toast for dense content or complex workflows, and avoid flooding the viewport with too many notices.",
      },
      {
        id: "progress",
        title: "Spinner / Progress",
        description:
          "Async feedback primitives. Spinner fits unknown waiting time, while Progress communicates measurable completion.",
        metaTags: ["Spinner", "Progress bar", "3 sizes", "Inline / full area"],
        demos: [{ title: "Example", exampleId: "progress" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Spinner", ".spinner", "Circular loading indicator"],
            ["Sizes", ".spinner-sm / default / .spinner-lg", "16px / 24px / 32px"],
            ["Track", ".progress", "Progress track"],
            ["Fill", ".progress-bar", "Width reflects percentage"],
            [
              "Semantic fill",
              ".progress-bar-success / .progress-bar-danger",
              "Completion or failure color",
            ],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Use loading feedback for operations above 200ms, prefer Progress when progress is measurable, and disable loading buttons.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not pile Spinner on top of an existing Skeleton region, and never leave Progress stuck at 100% without resolution.",
      },
      {
        id: "skeleton",
        title: "Skeleton",
        description:
          "Shape-matched loading placeholder that outlines incoming content before data arrives, reducing perceived wait time.",
        metaTags: ["Text", "Circle", "Rectangle", "Animated"],
        demos: [{ title: "Example", exampleId: "skeleton" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".skeleton", "Muted block with pulse animation"],
            ["Text", ".skeleton-text", "Rounded line placeholder"],
            ["Rectangle", ".skeleton-rect", "Generic media placeholder"],
            ["Circle", ".skeleton-circle", "Avatar or icon placeholder"],
            ["Animation", "pulse", "Opacity breathing motion"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Match the real layout as closely as possible and vary widths to avoid obviously fake placeholder text.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not flash Skeleton after data is ready, and avoid using it for tiny localized loading like a single button state.",
      },
      {
        id: "empty",
        title: "Empty state",
        description:
          "Fallback for empty lists, tables, or content regions that explains the state and points to the next action.",
        metaTags: ["Guided action", "Illustration", "Responsive"],
        demos: [{ title: "Example", exampleId: "empty" }],
        table: {
          columns: ["Element", "Required", "Description"],
          rows: [
            ["Illustration / icon", "Recommended", "48-64px visual anchor"],
            ["Title", "Required", "Short explanation of the current state"],
            ["Description", "Recommended", "One-line hint for resolution"],
            ["Action", "Optional", "Guide users to create, add, or import"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Offer a clear next step, keep the illustration aligned with the product tone, and use a consistent empty-state voice.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not make empty states look like errors or dead ends, and never leave a large blank region unexplained.",
      },
    ],
    structureControls: [
      {
        id: "badge",
        title: "Badge",
        description:
          "Status label and count primitive. Useful in tabs, lists, and compact summaries, including dot-only status mode.",
        metaTags: ["5 variants", "Dot mode", "Counter"],
        demos: [{ title: "Example", exampleId: "badge" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Default", ".badge-default", "Neutral gray label"],
            ["Primary", ".badge-primary", "Accent active label"],
            [
              "Success / warning / danger",
              ".badge-success / .badge-warning / .badge-danger",
              "Semantic states",
            ],
            ["Dot", ".badge-dot", "Indicator without text"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Clamp large counts to 99+, reserve dot mode for binary presence, and keep semantic colors consistent across the product.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not put long text inside Badge or turn it into a button, and avoid packing too many badges into one row.",
      },
      {
        id: "table",
        title: "Table",
        description:
          "Structured data layout for plugin lists, logs, and admin-style dense views where scanning rows matters.",
        metaTags: ["Sorting", "Selection", "Striped", "Responsive"],
        demos: [{ title: "Example", exampleId: "table" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".tbl", "Core table styling"],
            ["Striped", ".tbl-striped", "Alternating row backgrounds"],
            ["Hover", ".tbl-hover", "Hover emphasis for rows"],
            ["Compact", ".tbl-compact", "Reduced padding for density"],
            ["Responsive", "outer overflow-x: auto", "Horizontal scroll on narrow screens"],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Allocate width by information priority, add sorting or filtering for long datasets, and align action columns consistently.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not overload the table with too many columns, avoid nested tables, and always provide an empty state when no rows exist.",
      },
      {
        id: "card",
        title: "Card",
        description:
          "Container that groups related content into header, body, and footer regions. It is the base unit for workbench content.",
        metaTags: ["3 regions", "Clickable", "Shadow", "Bordered"],
        demos: [{ title: "Example", exampleId: "card" }],
        table: {
          columns: ["Property", "Class / value", "Description"],
          rows: [
            ["Base", ".card", "Rounded bordered container"],
            ["Header", ".card-head", "Title and actions"],
            ["Body", ".card-body", "Primary content area"],
            ["Footer", ".card-foot", "Action row"],
            [
              "Clickable / selected",
              ".card-clickable / .card-selected",
              "Interactive and selected states",
            ],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Keep actions grouped near the footer, give clickable cards visible hover feedback, and keep content focused.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not nest cards, avoid wildly uneven card heights within a group, and do not rely on shadow alone for separation.",
      },
    ],
  },
}
