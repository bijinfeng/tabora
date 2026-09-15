import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { Accessor, JSX } from "solid-js"
import Cpu from "lucide-solid/icons/cpu"
import { slashMenuStyles } from "./ai-chat-slash-menu.styles"

type SlashCommand = {
  kind?: "command"
  id: string
  label: string
  description: string
  icon: JSX.Element
  disabled: boolean
  onSelect: () => void
}

type SlashGroup = {
  kind: "group"
  id: string
  label: string
}

export type SlashItem = SlashCommand | SlashGroup

type ModelGroup = {
  id: string
  label: string
  items: Array<{ id: string; label: string }>
}

/** The composer-local command surface, including its model subview. */
export function AiChatSlashMenu(props: {
  open: Accessor<boolean>
  modelPicker: Accessor<boolean>
  modelGroups: Accessor<ModelGroup[]>
  activeModelId: Accessor<string>
  activeIndex: Accessor<number>
  commands: Accessor<SlashItem[]>
  onPickModel: (id: string) => void
}) {
  const isCommand = (item: SlashItem): item is SlashCommand => item.kind !== "group"

  return (
    <Show when={props.open()}>
      <div {...stylex.attrs(slashMenuStyles.menu)} role="menu" aria-label="对话工具">
        <Show
          when={!props.modelPicker()}
          fallback={
            <div {...stylex.attrs(slashMenuStyles.modelList)}>
              <For each={props.modelGroups()}>
                {(group, groupIndex) => (
                  <div {...stylex.attrs(slashMenuStyles.modelGroup)}>
                    <span {...stylex.attrs(slashMenuStyles.modelGroupLabel)}>{group.label}</span>
                    <For each={group.items}>
                      {(model, modelIndex) => {
                        const commandCountBefore = props
                          .modelGroups()
                          .slice(0, groupIndex())
                          .reduce((count, prior) => count + prior.items.length, 0)
                        const flatIndex = commandCountBefore + modelIndex()
                        return (
                          <button
                            type="button"
                            {...stylex.attrs(
                              slashMenuStyles.command,
                              props.activeIndex() === flatIndex && slashMenuStyles.commandActive,
                            )}
                            role="menuitem"
                            aria-label={`切换到模型 ${model.label}`}
                            onClick={() => props.onPickModel(model.id)}
                          >
                            <Cpu size={16} />
                            <span {...stylex.attrs(slashMenuStyles.commandCopy)}>
                              <span {...stylex.attrs(slashMenuStyles.commandTitle)}>
                                {model.label}
                              </span>
                              <span {...stylex.attrs(slashMenuStyles.commandDescription)}>
                                {model.id === props.activeModelId() ? "当前模型" : model.id}
                              </span>
                            </span>
                          </button>
                        )
                      }}
                    </For>
                  </div>
                )}
              </For>
            </div>
          }
        >
          <For each={props.commands()}>
            {(item, index) => {
              if (!isCommand(item)) {
                return (
                  <div role="separator" aria-label={item.label}>
                    <span {...stylex.attrs(slashMenuStyles.commandGroupLabel)}>{item.label}</span>
                  </div>
                )
              }
              const activeCount = props
                .commands()
                .slice(0, index() + 1)
                .filter((entry) => isCommand(entry)).length
              return (
                <button
                  type="button"
                  {...stylex.attrs(
                    slashMenuStyles.command,
                    props.activeIndex() === activeCount - 1 && slashMenuStyles.commandActive,
                  )}
                  role="menuitem"
                  aria-label={`执行工具 ${item.label}`}
                  disabled={item.disabled}
                  onClick={item.onSelect}
                >
                  {item.icon}
                  <span {...stylex.attrs(slashMenuStyles.commandCopy)}>
                    <span {...stylex.attrs(slashMenuStyles.commandTitle)}>{item.label}</span>
                    <span {...stylex.attrs(slashMenuStyles.commandDescription)}>
                      {item.description}
                    </span>
                  </span>
                </button>
              )
            }}
          </For>
        </Show>
      </div>
    </Show>
  )
}
