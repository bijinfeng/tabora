export {
  TiptapEditor,
  MinimalTiptapEditor,
  StandardTiptapEditor,
  StandardMenuTiptapEditor,
  FocusTiptapEditor,
  TiptapEditor as default,
} from "./tiptap-editor.styled"
export { HeadlessTiptapEditor } from "./tiptap-editor"
export { useTiptapEditor } from "./use-tiptap-editor"
export { TiptapEditorDemo } from "./tiptap-editor.demo"

export { TiptapEditorRoot, ensureTiptapContentStyles } from "./tiptap-editor-root"
export { TiptapEditorProvider, useTiptapEditorContext } from "./tiptap-editor-context"
export { TiptapEditorContent } from "./tiptap-editor-content"
export { TiptapEditorActions } from "./tiptap-editor-actions"
export { TiptapEditorFocusShell, TiptapEditorFocusEntry } from "./tiptap-editor-focus-shell"
export {
  buildInsertMenuItems as buildTiptapInsertMenuItems,
  defaultInsertMenuItems as defaultTiptapInsertMenuItems,
} from "./tiptap-editor-insert-menu"
export {
  Toolbar,
  defaultToolbar,
  compactToolbar as compactTiptapToolbar,
  minimalToolbar as minimalTiptapToolbar,
  commandIsActive as tiptapCommandIsActive,
  commandCanExecute as tiptapCommandCanExecute,
  executeCommand as executeTiptapCommand,
} from "./tiptap-editor-toolbar"

export type {
  TiptapEditorProps,
  TiptapEditorSize,
  ToolbarCommand,
  ToolbarContext,
  ToolbarGroupConfig,
  ToolbarItemConfig,
  TiptapEditorVariant,
  TiptapEditorActionInsertItem,
  TiptapEditorInsertMenuItem,
  TiptapEditorInsertKind,
  TiptapEditorVisibility,
} from "./tiptap-editor.styled"
export type { HeadlessTiptapEditorProps } from "./tiptap-editor"
export type { TiptapEditorState, UseTiptapEditorOptions } from "./use-tiptap-editor"
export type { Editor as TiptapEditorInstance } from "@tiptap/core"
export type { TiptapEditorPrimitiveContext } from "./tiptap-editor-context"
export type { TiptapEditorRootProps, RootState, SolidAttrs } from "./tiptap-editor-root"
export type { TiptapEditorContentProps } from "./tiptap-editor-content"
export type { TiptapEditorActionsProps } from "./tiptap-editor-actions"
export type { TiptapEditorFocusShellProps } from "./tiptap-editor-focus-shell"
export type { TiptapEditorInsertMenuOptions } from "./tiptap-editor-insert-menu"
