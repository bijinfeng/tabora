import { describe, expect, it } from "vitest"

import checkboxPrimitiveSource from "../primitives/checkbox/checkbox.tsx?raw"
import chipPrimitiveSource from "../primitives/chip/chip.tsx?raw"
import accordionPrimitiveSource from "../primitives/accordion/accordion.tsx?raw"
import selectPrimitiveSource from "../primitives/select/select.tsx?raw"
import tagInputPrimitiveSource from "../primitives/tagInput/tagInput.tsx?raw"
import buttonSource from "./button/button.styled.tsx?raw"
import accordionSource from "./accordion/accordion.styled.tsx?raw"
import avatarSource from "./avatar/avatar.styled.tsx?raw"
import badgeSource from "./badge/badge.styled.tsx?raw"
import calloutSource from "./callout/callout.styled.tsx?raw"
import cardSectionSource from "./cardSection/cardSection.styled.tsx?raw"
import checkboxSource from "./checkbox/checkbox.styled.tsx?raw"
import chipSource from "./chip/chip.styled.tsx?raw"
import collapsibleSource from "./collapsible/collapsible.styled.tsx?raw"
import comboboxSource from "./combobox/combobox.styled.tsx?raw"
import commandPaletteSource from "./commandPalette/commandPalette.styled.tsx?raw"
import contextMenuSource from "./contextMenu/contextMenu.styled.tsx?raw"
import copyButtonSource from "./copyButton/copyButton.styled.tsx?raw"
import breadcrumbSource from "./breadcrumb/breadcrumb.styled.tsx?raw"
import drawerSource from "./drawer/drawer.styled.tsx?raw"
import dividerSource from "./divider/divider.styled.tsx?raw"
import dropdownMenuSource from "./dropdownMenu/dropdownMenu.styled.tsx?raw"
import dialogSource from "./dialog/dialog.styled.tsx?raw"
import emptyStateSource from "./emptyState/emptyState.styled.tsx?raw"
import hoverCardSource from "./hoverCard/hoverCard.styled.tsx?raw"
import inputSource from "./input/input.styled.tsx?raw"
import inlineErrorSource from "./inlineError/inlineError.styled.tsx?raw"
import kbdSource from "./kbd/kbd.styled.tsx?raw"
import linkSource from "./link/link.styled.tsx?raw"
import listRowSource from "./listRow/listRow.styled.tsx?raw"
import menubarSource from "./menubar/menubar.styled.tsx?raw"
import paginationSource from "./pagination/pagination.styled.tsx?raw"
import progressSource from "./progress/progress.styled.tsx?raw"
import popoverSource from "./popover/popover.styled.tsx?raw"
import radioGroupSource from "./radioGroup/radioGroup.styled.tsx?raw"
import scrollAreaSource from "./scrollArea/scrollArea.styled.tsx?raw"
import selectSource from "./select/select.styled.tsx?raw"
import segmentedControlSource from "./segmentedControl/segmentedControl.styled.tsx?raw"
import skeletonSource from "./skeleton/skeleton.styled.tsx?raw"
import sliderSource from "./slider/slider.styled.tsx?raw"
import spinnerSource from "./spinner/spinner.styled.tsx?raw"
import stepsSource from "./steps/steps.styled.tsx?raw"
import switchSource from "./switch/switch.styled.tsx?raw"
import tabsSource from "./tabs/tabs.styled.tsx?raw"
import tagInputSource from "./tagInput/tagInput.styled.tsx?raw"
import tableSource from "./table/table.styled.tsx?raw"
import timelineSource from "./timeline/timeline.styled.tsx?raw"
import toastSource from "./toast/toast.styled.tsx?raw"
import toggleGroupSource from "./toggleGroup/toggleGroup.styled.tsx?raw"
import tooltipSource from "./tooltip/tooltip.styled.tsx?raw"
import treeViewSource from "./treeView/treeView.styled.tsx?raw"

const motionSensitiveSources = new Map([
  ["button/button.styled.tsx", buttonSource],
  ["select/select.styled.tsx", selectSource],
  ["dropdownMenu/dropdownMenu.styled.tsx", dropdownMenuSource],
  ["contextMenu/contextMenu.styled.tsx", contextMenuSource],
  ["popover/popover.styled.tsx", popoverSource],
])

const tokenizedSources = new Map([
  ["input/input.styled.tsx", inputSource],
  ["tabs/tabs.styled.tsx", tabsSource],
  ["dialog/dialog.styled.tsx", dialogSource],
  ["switch/switch.styled.tsx", switchSource],
])

const statusContentSources = new Map([
  ["accordion/accordion.styled.tsx", accordionSource],
  ["avatar/avatar.styled.tsx", avatarSource],
  ["badge/badge.styled.tsx", badgeSource],
  ["callout/callout.styled.tsx", calloutSource],
  ["cardSection/cardSection.styled.tsx", cardSectionSource],
  ["checkbox/checkbox.styled.tsx", checkboxSource],
  ["chip/chip.styled.tsx", chipSource],
  ["collapsible/collapsible.styled.tsx", collapsibleSource],
  ["copyButton/copyButton.styled.tsx", copyButtonSource],
  ["divider/divider.styled.tsx", dividerSource],
  ["emptyState/emptyState.styled.tsx", emptyStateSource],
  ["inlineError/inlineError.styled.tsx", inlineErrorSource],
  ["listRow/listRow.styled.tsx", listRowSource],
  ["progress/progress.styled.tsx", progressSource],
  ["radioGroup/radioGroup.styled.tsx", radioGroupSource],
  ["scrollArea/scrollArea.styled.tsx", scrollAreaSource],
  ["skeleton/skeleton.styled.tsx", skeletonSource],
  ["slider/slider.styled.tsx", sliderSource],
  ["spinner/spinner.styled.tsx", spinnerSource],
  ["steps/steps.styled.tsx", stepsSource],
  ["switch/switch.styled.tsx", switchSource],
  ["table/table.styled.tsx", tableSource],
  ["timeline/timeline.styled.tsx", timelineSource],
  ["treeView/treeView.styled.tsx", treeViewSource],
])

const overlaySources = new Map([
  ["commandPalette/commandPalette.styled.tsx", commandPaletteSource],
  ["contextMenu/contextMenu.styled.tsx", contextMenuSource],
  ["dialog/dialog.styled.tsx", dialogSource],
  ["drawer/drawer.styled.tsx", drawerSource],
  ["dropdownMenu/dropdownMenu.styled.tsx", dropdownMenuSource],
  ["hoverCard/hoverCard.styled.tsx", hoverCardSource],
  ["menubar/menubar.styled.tsx", menubarSource],
  ["popover/popover.styled.tsx", popoverSource],
  ["toast/toast.styled.tsx", toastSource],
  ["tooltip/tooltip.styled.tsx", tooltipSource],
])

const actionNavigationSources = new Map([
  ["button/button.styled.tsx", buttonSource],
  ["link/link.styled.tsx", linkSource],
  ["kbd/kbd.styled.tsx", kbdSource],
  ["breadcrumb/breadcrumb.styled.tsx", breadcrumbSource],
  ["tabs/tabs.styled.tsx", tabsSource],
  ["pagination/pagination.styled.tsx", paginationSource],
  ["segmentedControl/segmentedControl.styled.tsx", segmentedControlSource],
  ["toggleGroup/toggleGroup.styled.tsx", toggleGroupSource],
])

describe("styled component design contract", () => {
  it("uses Tabora motion tokens instead of raw fallback durations and easings", () => {
    for (const [relativePath, source] of motionSensitiveSources) {
      expect(source, relativePath).not.toContain('transitionDuration: "120ms"')
      expect(source, relativePath).not.toContain('transitionTimingFunction: "ease"')
      expect(source, relativePath).not.toContain('animationDuration: "120ms"')
    }
  })

  it("keeps primary Button border and active feedback aligned with the component spec", () => {
    const source = buttonSource

    expect(source).toContain("borderColor: color.accent")
    expect(source).toContain("borderColor: color.accentHover")
    expect(source).not.toMatch(/":active":\s*\{[^}]*transform\s*:/)
    expect(source).not.toMatch(/transitionProperty:\s*"[^"]*\btransform\b[^"]*"/)
    expect(source).not.toContain('transform: "translateY(1px)"')
    expect(source).toContain("height: 28")
    expect(source).toContain("height: 36")
    expect(source).toContain("height: 44")
  })

  it("uses typed theme tokens across action and navigation styles", () => {
    for (const [relativePath, source] of actionNavigationSources) {
      expect(source, relativePath).toContain("@tabora/theme/tokens.stylex")
      expect(source, relativePath).not.toMatch(
        /(?:backgroundColor|borderColor|color):\s*"rgb\(var\(--tbr-color-/,
      )
      expect(source, relativePath).not.toMatch(/borderRadius:\s*"var\(--tbr-radius-/)
      expect(source, relativePath).not.toMatch(/transition(?:Duration|TimingFunction):\s*"/)
      expect(source, relativePath).not.toMatch(/fontWeight:\s*\d/)
    }
  })

  it("keeps representative styled sources on the theme token path", () => {
    for (const [relativePath, source] of tokenizedSources) {
      expect(source, relativePath).toContain("@tabora/theme/tokens.stylex")
    }
  })

  it("uses typed theme tokens across menus and overlay wrappers", () => {
    for (const [relativePath, source] of overlaySources) {
      expect(source, relativePath).toContain("@tabora/theme/tokens.stylex")
    }

    for (const source of [dropdownMenuSource, contextMenuSource, menubarSource]) {
      expect(source).toContain("color.surface")
      expect(source).toContain("color.line")
    }
    expect(dropdownMenuSource).toContain("color.danger")
    expect(contextMenuSource).toContain("color.danger")

    for (const source of [dialogSource, drawerSource, commandPaletteSource]) {
      expect(source).toContain("radius.panel")
      expect(source).toContain("shadow.floating")
    }

    expect(tooltipSource).toContain("backgroundColor: color.text")
    expect(tooltipSource).toContain("color: color.surface")
    expect(toastSource).toContain("backgroundColor: color.surface")
    expect(toastSource).toContain("borderColor: color.line")
  })

  it("keeps representative form, navigation, overlay, and status tokens aligned", () => {
    expect(inputSource).toMatch(/"::placeholder":\s*\{[^}]*\bcolor:\s*color\.textSubtle\b[^}]*\}/)
    expect(tabsSource).toContain("color.accent")
    expect(dialogSource).toContain("motion.normal")
    expect(dialogSource).toContain("color.surface")
    expect(dialogSource).toContain("radius.panel")
    expect(dialogSource).toContain("shadow.floating")
    expect(switchSource).toContain("color.accent")
    expect(switchSource).toContain("motion.normal")
    expect(treeViewSource).toMatch(
      /"\[data-selected\]":\s*\{[^}]*\bbackgroundColor:\s*color\.accentSoft\b[^}]*\}/,
    )
    expect(progressSource).toContain("color.accent")
  })

  it("keeps TagInput, Select, and Checkbox at their specified compact density", () => {
    expect(tagInputSource).toContain("gap: 4")
    expect(tagInputSource).toContain("height: 24")
    expect(tagInputSource).toContain("fontSize: 11")
    expect(tagInputSource).toContain("borderRadius: radius.r1")
    expect(tagInputSource).toContain("width: 340")
    expect(tagInputSource).toContain("height: 10")
    expect(tagInputSource).toContain("width: 10")
    expect(tagInputSource).toContain("padding: 0")
    expect(tagInputSource).toContain("color: color.accent")
    expect(tagInputSource).toContain("opacity: 0.7")
    expect(selectSource).toContain("gap: 6")
    expect(selectSource).toContain("minWidth: 180")
    expect(selectSource).toContain("paddingInline: 8")
    expect(checkboxSource).toContain("height: 16")
    expect(checkboxPrimitiveSource).toContain("<Check size={10} strokeWidth={1.5} />")
    expect(tagInputPrimitiveSource).toContain("<X size={10} strokeWidth={2.5} />")
    expect(selectPrimitiveSource).toContain("<ChevronDown size={10} strokeWidth={2} />")
  })

  it("centers the Slider thumb on its 4px track without replacing Kobalte positioning", () => {
    expect(sliderSource).toContain("marginTop: -6")
    expect(sliderSource).not.toContain('transform: "translate(-50%, -50%)"')
  })

  it("keeps Accordion density aligned with the component spec", () => {
    expect(accordionSource).toContain("width: 320")
    expect(accordionSource).toContain("fontWeight: 650")
    expect(accordionSource).toContain("borderBottomWidth: 1")
    expect(accordionPrimitiveSource).toContain("defaultValue: props.defaultValue")
    expect(accordionPrimitiveSource).toContain("<KAccordion.Header style={{ margin: 0 }}>")
    expect(accordionPrimitiveSource).toContain("useCollapsibleContext")
    expect(accordionPrimitiveSource).toContain('transform: context.isOpen() ? "rotate(180deg)"')
    expect(accordionPrimitiveSource).toContain("<ChevronDown size={10} strokeWidth={2} />")
  })

  it("keeps the Chip remove icon inside its 14px control", () => {
    expect(chipPrimitiveSource).toContain("<X size={10} strokeWidth={2} />")
    expect(chipSource).toContain("height: 14")
    expect(chipSource).toContain("width: 14")
  })

  it("uses the component-spec Spinner cadence instead of control motion", () => {
    expect(spinnerSource).toContain('animationDuration: "600ms"')
    expect(spinnerSource).toContain('animationTimingFunction: "linear"')
  })

  it("uses the component-spec Skeleton pulse cadence instead of control motion", () => {
    expect(skeletonSource).toContain('animationDuration: "1500ms"')
    expect(skeletonSource).toContain('animationTimingFunction: "ease-in-out"')
  })

  it("centers Steps markers and constrains the workflow to its design width", () => {
    expect(stepsSource).toContain("width: 440")
    expect(stepsSource).toContain('justifySelf: "center"')
    expect(stepsSource).toContain('left: "calc(50% + 12px)"')
    expect(stepsSource).toContain('right: "calc(-50% + 12px)"')
  })

  it("uses typed theme tokens across status and content wrappers", () => {
    for (const [relativePath, source] of statusContentSources) {
      expect(source, relativePath).toContain("@tabora/theme/tokens.stylex")
    }

    expect(checkboxSource).toContain("backgroundColor: color.accent")
    expect(listRowSource).toContain("backgroundColor: color.surfaceHover")
    expect(tableSource).toContain("backgroundColor: color.accentSoft")
    expect(treeViewSource).toContain("backgroundColor: color.accentSoft")
  })

  it("passes selected and disabled select item styles through the styled wrapper", () => {
    const source = selectSource

    expect(source).toContain("itemSelectedCompiled")
    expect(source).toContain("itemDisabledCompiled")
    expect(source).toContain("itemSelectedClass={itemSelectedCompiled().class}")
    expect(source).toContain("itemDisabledClass={itemDisabledCompiled().class}")
  })

  it("uses explicit component-spec dimensions for normal form controls", () => {
    expect(inputSource).toContain("height: 28")
    expect(inputSource).toContain("height: 36")
    expect(inputSource).not.toContain("var(--tbr-control-")
    expect(comboboxSource).toContain("height: 36")
    expect(comboboxSource).not.toContain("var(--tbr-control-")
    expect(tagInputSource).toContain("minHeight: 36")
    expect(tagInputSource).not.toContain("var(--tbr-control-")
  })
})
