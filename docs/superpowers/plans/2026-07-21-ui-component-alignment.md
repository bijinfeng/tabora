# `@tabora/ui` Component Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every implemented `@tabora/ui` styled component represented in `component-spec.html` with the current Tabora design system without changing component semantics or public business APIs.

**Architecture:** Keep the existing primitive-to-styled-wrapper boundary. Each styled wrapper consumes `@tabora/theme/tokens.stylex` for solid semantic values and uses CSS-variable fragments only when a static alpha or `color-mix` expression requires it. Apply the work by shared visual behavior, then protect the rules with source-contract tests and playground checks.

**Tech Stack:** Solid, TypeScript, StyleX, Kobalte, Vitest, Vite Plus, pnpm.

---

## File Structure

- `packages/ui/src/styled/designContract.test.ts`: source-level visual contract for motion, typed tokens, form state, menu state, and Button no-layout-shift feedback.
- `packages/ui/src/styled/{input,textarea,select,combobox,tagInput,field,fieldRow}/*.styled.tsx`: form and selection controls.
- `packages/ui/src/styled/{button,link,kbd,breadcrumb,tabs,pagination,segmentedControl,toggleGroup}/*.styled.tsx`: action and navigation controls; `button` also owns `IconButton`.
- `packages/ui/src/styled/{dropdownMenu,contextMenu,menubar,popover,hoverCard,tooltip,dialog,drawer,toast,commandPalette}/*.styled.tsx`: menus, dialogs and low-level overlay primitives.
- `packages/ui/src/styled/{accordion,avatar,badge,callout,cardSection,checkbox,chip,collapsible,copyButton,divider,emptyState,inlineError,listRow,progress,radioGroup,scrollArea,skeleton,slider,spinner,steps,switch,table,timeline,treeView,truncate,visuallyHidden}/*.styled.tsx`: status and content-organization components.
- `docs/superpowers/specs/2026-07-21-ui-component-alignment-design.md`: approved scope and source hierarchy. No product fact source is changed.

`datePicker/datePicker.styled.tsx` remains unchanged because `component-spec.html` has no DatePicker specification.

### Task 1: Establish the design-contract regression tests

**Files:**

- Modify: `packages/ui/src/styled/designContract.test.ts`
- Verify: `packages/ui/src/global.d.ts`

- [ ] **Step 1: Extend the raw-source imports for the component clusters.**

  Add imports for the representative files that guard each cluster. Keep the existing `?raw` declaration in `global.d.ts`; do not add a second declaration.

  ```ts
  import inputSource from "./input/input.styled.tsx?raw"
  import progressSource from "./progress/progress.styled.tsx?raw"
  import switchSource from "./switch/switch.styled.tsx?raw"
  import tabsSource from "./tabs/tabs.styled.tsx?raw"
  import treeViewSource from "./treeView/treeView.styled.tsx?raw"
  import dialogSource from "./dialog/dialog.styled.tsx?raw"

  const tokenizedSources = new Map([
    ["input/input.styled.tsx", inputSource],
    ["tabs/tabs.styled.tsx", tabsSource],
    ["dialog/dialog.styled.tsx", dialogSource],
    ["switch/switch.styled.tsx", switchSource],
  ])
  ```

- [ ] **Step 2: Add failing expectations for the approved rules.**

  Replace the existing assertion that requires `scale(0.98)` with the no-layout-shift contract. Add focused assertions for typed token imports, Input placeholder hierarchy, and overlay motion tokens.

  ```ts
  expect(buttonSource).not.toContain('transform: "scale(0.98)"')
  expect(buttonSource).not.toContain(
    'transitionProperty: "background-color, border-color, color, transform"',
  )
  expect(inputSource).toContain("color: color.textSubtle")
  expect(dialogSource).toContain("animationDuration: motion.normal")

  for (const [relativePath, source] of tokenizedSources) {
    expect(source, relativePath).toContain("@tabora/theme/tokens.stylex")
    expect(source, relativePath).not.toContain('transitionDuration: "120ms"')
  }
  ```

- [ ] **Step 3: Run the targeted test and confirm the current implementation fails for the intended reasons.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: FAIL because Button still contains `scale(0.98)`, and at least one unconverted cluster source lacks the required typed-token import or required state expression.

- [ ] **Step 4: Keep the test focused on stable source-level contracts.**

  Do not assert generated class names, declaration order, exact shadows, or every implementation detail. The test must only assert the semantic design rules above plus the existing Select selected/disabled slot forwarding check.

### Task 2: Align form and selection controls

**Files:**

- Modify: `packages/ui/src/styled/input/input.styled.tsx`
- Modify: `packages/ui/src/styled/textarea/textarea.styled.tsx`
- Modify: `packages/ui/src/styled/select/select.styled.tsx`
- Modify: `packages/ui/src/styled/combobox/combobox.styled.tsx`
- Modify: `packages/ui/src/styled/tagInput/tagInput.styled.tsx`
- Modify: `packages/ui/src/styled/field/field.styled.tsx`
- Modify: `packages/ui/src/styled/fieldRow/fieldRow.styled.tsx`
- Test: `packages/ui/src/styled/designContract.test.ts`

- [ ] **Step 1: Add the form-specific source assertions before styling.**

  ```ts
  expect(inputSource).toContain("color: color.textSubtle")
  expect(inputSource).toContain("borderColor: color.accent")
  expect(selectSource).toContain("itemSelectedClass={itemSelectedCompiled().class}")
  expect(selectSource).toContain("itemDisabledClass={itemDisabledCompiled().class}")
  ```

- [ ] **Step 2: Run the targeted test and confirm these assertions fail before the edits.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: FAIL until Input placeholder text is changed from `textMuted` to `textSubtle` and unconverted form wrappers import typed tokens.

- [ ] **Step 3: Convert solid style values to semantic typed tokens and preserve controlled alpha expressions.**

  For every file above, import only the required members from `@tabora/theme/tokens.stylex`, then replace solid values with those members. Follow this pattern:

  ```ts
  import { color, motion, radius } from "@tabora/theme/tokens.stylex"

  control: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    color: color.text,
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.ease,
    "::placeholder": { color: color.textSubtle },
    ":focus": { borderColor: color.accent },
  }
  ```

  Keep the design-draft dimensions: `sm` controls are 28px with 10px horizontal padding; `md` controls are 36px with 12px horizontal padding. Preserve Select's existing single and multiple selection behavior and its selected/disabled item style forwarding.

- [ ] **Step 4: Apply the specified form states without changing primitive APIs.**

  Use `surfaceSoft` plus opacity for disabled controls, `danger` for invalid borders, `lineStrong` on non-focused hover where the control supports hover, and a 3px accent focus ring. Do not add public `*Class` or `*Style` props, and do not remove existing ones in this task.

- [ ] **Step 5: Run the targeted test and package test suite.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: PASS.

  Run: `pnpm --filter @tabora/ui test`

  Expected: PASS with no Select, Input, Textarea, Combobox, or Field regressions.

### Task 3: Align actions and navigation controls

**Files:**

- Modify: `packages/ui/src/styled/button/button.styled.tsx`
- Modify: `packages/ui/src/styled/link/link.styled.tsx`
- Modify: `packages/ui/src/styled/kbd/kbd.styled.tsx`
- Modify: `packages/ui/src/styled/breadcrumb/breadcrumb.styled.tsx`
- Modify: `packages/ui/src/styled/tabs/tabs.styled.tsx`
- Modify: `packages/ui/src/styled/pagination/pagination.styled.tsx`
- Modify: `packages/ui/src/styled/segmentedControl/segmentedControl.styled.tsx`
- Modify: `packages/ui/src/styled/toggleGroup/toggleGroup.styled.tsx`
- Test: `packages/ui/src/styled/designContract.test.ts`

- [ ] **Step 1: Add a failing Button motion assertion and one navigation token assertion.**

  ```ts
  expect(buttonSource).toContain("borderColor: color.accentHover")
  expect(buttonSource).not.toContain('transform: "scale(0.98)"')
  expect(tabsSource).toContain("@tabora/theme/tokens.stylex")
  ```

- [ ] **Step 2: Run the targeted contract test.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: FAIL until the Button active scale and `transform` transition are removed.

- [ ] **Step 3: Implement the action and navigation style changes.**

  Keep Button `sm` at 28px, `md` at 36px and `lg` at 44px, with `600` weight. Keep IconButton at 26px, 32px and 38px. Use color/border changes for active feedback rather than transforms:

  ```ts
  primary: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.inverse,
    ":hover": {
      backgroundColor: color.accentHover,
      borderColor: color.accentHover,
    },
    ":active": { backgroundColor: color.accentHover },
  }
  ```

  Preserve `focus-visible` outlines, selected-tab indicators, and segmented/toggle selected colors. Convert untyped solid colors, radii, font weights, shadows and durations in the listed files to typed semantic token imports. Do not alter link destinations, pagination arithmetic, or state management.

- [ ] **Step 4: Re-run the targeted and package tests.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: PASS.

  Run: `pnpm --filter @tabora/ui test`

  Expected: PASS.

### Task 4: Align menus and overlay primitives

**Files:**

- Modify: `packages/ui/src/styled/dropdownMenu/dropdownMenu.styled.tsx`
- Modify: `packages/ui/src/styled/contextMenu/contextMenu.styled.tsx`
- Modify: `packages/ui/src/styled/menubar/menubar.styled.tsx`
- Modify: `packages/ui/src/styled/popover/popover.styled.tsx`
- Modify: `packages/ui/src/styled/hoverCard/hoverCard.styled.tsx`
- Modify: `packages/ui/src/styled/tooltip/tooltip.styled.tsx`
- Modify: `packages/ui/src/styled/dialog/dialog.styled.tsx`
- Modify: `packages/ui/src/styled/drawer/drawer.styled.tsx`
- Modify: `packages/ui/src/styled/toast/toast.styled.tsx`
- Modify: `packages/ui/src/styled/commandPalette/commandPalette.styled.tsx`
- Test: `packages/ui/src/styled/designContract.test.ts`

- [ ] **Step 1: Add failing overlay contract assertions.**

  ```ts
  expect(dropdownMenuSource).toContain("transitionDuration: motion.fast")
  expect(dialogSource).toContain("backgroundColor: color.surface")
  expect(dialogSource).toContain("borderRadius: radius.panel")
  expect(dialogSource).toContain("boxShadow: shadow.floating")
  ```

- [ ] **Step 2: Run the targeted contract test.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: FAIL for any remaining raw duration, raw overlay color, radius, or hand-written floating shadow.

- [ ] **Step 3: Implement overlay surface and motion alignment.**

  Import `color`, `motion`, `radius`, `shadow` and `zIndex` only where used. Apply `surface` and `line` to menu/dialog surfaces, `radius.panel` to dialogs, drawers and command palette, and `shadow.floating` to floating primitives. Use `scrim` for modal/drawer backdrops. Preserve primitive placement, portals, focus management, and dismissal behavior.

  ```ts
  content: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    boxShadow: shadow.floating,
    transitionDuration: motion.normal,
    transitionTimingFunction: motion.ease,
  }
  ```

  Keep opacity/transform entrance animations only for overlays; do not animate margin, padding, border width, or any dimension that changes layout. Keep dangerous menu rows on `danger`/`dangerSoft` tokens.

- [ ] **Step 4: Run overlay and package tests.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: PASS.

  Run: `pnpm --filter @tabora/ui test`

  Expected: PASS, including existing drawer and StyleX overlay tests.

### Task 5: Align status and content-organization components

**Files:**

- Modify: `packages/ui/src/styled/accordion/accordion.styled.tsx`
- Modify: `packages/ui/src/styled/avatar/avatar.styled.tsx`
- Modify: `packages/ui/src/styled/badge/badge.styled.tsx`
- Modify: `packages/ui/src/styled/callout/callout.styled.tsx`
- Modify: `packages/ui/src/styled/cardSection/cardSection.styled.tsx`
- Modify: `packages/ui/src/styled/checkbox/checkbox.styled.tsx`
- Modify: `packages/ui/src/styled/chip/chip.styled.tsx`
- Modify: `packages/ui/src/styled/collapsible/collapsible.styled.tsx`
- Modify: `packages/ui/src/styled/copyButton/copyButton.styled.tsx`
- Modify: `packages/ui/src/styled/divider/divider.styled.tsx`
- Modify: `packages/ui/src/styled/emptyState/emptyState.styled.tsx`
- Modify: `packages/ui/src/styled/inlineError/inlineError.styled.tsx`
- Modify: `packages/ui/src/styled/listRow/listRow.styled.tsx`
- Modify: `packages/ui/src/styled/progress/progress.styled.tsx`
- Modify: `packages/ui/src/styled/radioGroup/radioGroup.styled.tsx`
- Modify: `packages/ui/src/styled/scrollArea/scrollArea.styled.tsx`
- Modify: `packages/ui/src/styled/skeleton/skeleton.styled.tsx`
- Modify: `packages/ui/src/styled/slider/slider.styled.tsx`
- Modify: `packages/ui/src/styled/spinner/spinner.styled.tsx`
- Modify: `packages/ui/src/styled/steps/steps.styled.tsx`
- Modify: `packages/ui/src/styled/switch/switch.styled.tsx`
- Modify: `packages/ui/src/styled/table/table.styled.tsx`
- Modify: `packages/ui/src/styled/timeline/timeline.styled.tsx`
- Modify: `packages/ui/src/styled/treeView/treeView.styled.tsx`
- Modify: `packages/ui/src/styled/truncate/truncate.styled.tsx`
- Modify: `packages/ui/src/styled/visuallyHidden/visuallyHidden.styled.tsx`
- Test: `packages/ui/src/styled/designContract.test.ts`

- [ ] **Step 1: Add a focused failing assertion for semantic state colors and stable feedback.**

  ```ts
  expect(switchSource).toContain("backgroundColor: color.accent")
  expect(switchSource).toContain("transitionDuration: motion.normal")
  expect(treeViewSource).toContain("backgroundColor: color.accentSoft")
  expect(progressSource).toContain("backgroundColor: color.accent")
  ```

- [ ] **Step 2: Run the targeted contract test.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: FAIL while state/content components still reference raw solid token strings or fixed durations.

- [ ] **Step 3: Convert the listed wrappers in cohesive batches.**

  Apply the import and replacement pattern below to the listed files, selecting only needed token groups. Preserve existing dimensions and structure; use semantic variants instead of new colors.

  ```ts
  import { color, font, motion, radius, shadow } from "@tabora/theme/tokens.stylex"

  selected: {
    backgroundColor: color.accentSoft,
    borderColor: color.accent,
    color: color.accent,
  }
  disabled: {
    backgroundColor: color.surfaceSoft,
    color: color.textSubtle,
    opacity: 0.5,
  }
  ```

  Use `danger`, `warning`, `success` and `info` only for matching semantic states. Keep list rows, tree rows, table rows and chips border-led at rest; use `surfaceHover` for hover and `accentSoft` plus `accent` only for selected feedback. Keep loading controls dimensionally stable. Keep arrow rotation local to arrow glyphs, not container layout.

- [ ] **Step 4: Re-run the source contract and package tests.**

  Run: `pnpm --filter @tabora/ui test -- designContract.test.ts`

  Expected: PASS.

  Run: `pnpm --filter @tabora/ui test`

  Expected: PASS.

### Task 6: Run repository validation and perform visual smoke checks

**Files:**

- Verify: `packages/ui/src/styled/**/*.styled.tsx`
- Verify: `packages/ui/src/styled/designContract.test.ts`
- Verify: `docs/superpowers/specs/2026-07-21-ui-component-alignment-design.md`

- [ ] **Step 1: Run the UI package suite after all groups are complete.**

  Run: `pnpm --filter @tabora/ui test`

  Expected: all UI tests pass. Record any Vitest close-timeout warning separately from test failures.

- [ ] **Step 2: Run repository tests and static checks.**

  Run: `pnpm test`

  Expected: PASS, or report only pre-existing unrelated failures with exact file and reason.

  Run: `pnpm check`

  Expected: PASS for formatting, lint, type checking and architecture checks.

- [ ] **Step 3: Build all workspace packages.**

  Run: `pnpm build`

  Expected: PASS and generated StyleX CSS is emitted for UI consumers without type or bundling errors.

- [ ] **Step 4: Start playground for visual validation.**

  Run: `pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort`

  Expected: development server reports `http://127.0.0.1:5173/`. If port 5173 is occupied, select an unused port and report the actual URL.

- [ ] **Step 5: Inspect representative paths in light and dark themes.**

  Confirm Button and IconButton active/focus/disabled states, Input/Select invalid and disabled states, menu and overlay surfaces, Tabs selected states, and ListRow/TreeView selection. Confirm no horizontal overflow, clear focus rings, stable outer dimensions during interaction, and no new console errors.

- [ ] **Step 6: Update the final report without committing automatically.**

  List the component groups changed, the exact validation results, any unrelated failures, and the playground URL. Do not create a commit unless the user explicitly requests one.
