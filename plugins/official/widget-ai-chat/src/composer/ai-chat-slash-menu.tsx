import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { Accessor, JSX } from "solid-js"
import Cpu from "lucide-solid/icons/cpu"
import { slashMenuStyles } from "./ai-chat-slash-menu.styles"

type SlashCommand = {
  id: string
  label: string
  description: string
  icon: JSX.Element
  disabled: boolean
  onSelect: () => void
}

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
  commands: Accessor<SlashCommand[]>
  onPickModel: (id: string) => void
}) {
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
                      {(model, modelIndex) => (
                        <button
                          type="button"
                          {...stylex.attrs(
                            slashMenuStyles.command,
                            props.activeIndex() ===
                              props
                                .modelGroups()
                                .slice(0, groupIndex())
                                .reduce((count, prior) => count + prior.items.length, 0) +
                                modelIndex() && slashMenuStyles.commandActive,
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
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          }
        >
          <For each={props.commands()}>
            {(command, index) => (
              <button
                type="button"
                {...stylex.attrs(
                  slashMenuStyles.command,
                  props.activeIndex() === index() && slashMenuStyles.commandActive,
                )}
                role="menuitem"
                aria-label={`执行工具 ${command.label}`}
                disabled={command.disabled}
                onClick={command.onSelect}
              >
                {command.icon}
                <span {...stylex.attrs(slashMenuStyles.commandCopy)}>
                  <span {...stylex.attrs(slashMenuStyles.commandTitle)}>{command.label}</span>
                  <span {...stylex.attrs(slashMenuStyles.commandDescription)}>
                    {command.description}
                  </span>
                </span>
              </button>
            )}
          </For>
        </Show>
      </div>
    </Show>
  )
}
