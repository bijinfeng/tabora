import type { JSX, Accessor } from "solid-js"
import type { SettingsFieldNode, SettingsPanelModel } from "@tabora/plugin-api"
import { Field } from "@tabora/ui/field"
import { FieldRow } from "@tabora/ui/field-row"
import { Input } from "@tabora/ui/input"
import { Switch } from "@tabora/ui/switch"

type FieldRendererProps = {
  field: SettingsFieldNode
  model: Accessor<SettingsPanelModel | null>
  values: Accessor<Record<string, unknown>>
  setFieldValue: (field: SettingsFieldNode, value: string | boolean) => void
}

export function renderField(props: FieldRendererProps): JSX.Element {
  const { field, model, values, setFieldValue } = props

  if (field.control === "switch") {
    return (
      <div data-settings-schema-field-row={field.id}>
        <FieldRow
          label={field.label}
          description={field.description}
          trailing={
            <Switch
              size="sm"
              checked={Boolean(values()[field.id])}
              {...(field.disabled !== undefined ? { disabled: field.disabled } : {})}
              aria-label={field.label}
              onChange={(checked) => setFieldValue(field, checked)}
            />
          }
        />
      </div>
    )
  }

  const currentValue = () => {
    const value = values()[field.id]
    return typeof value === "string" ? value : ""
  }

  const accountLayout = model()?.layout === "account"
  const inputId = `settings-schema-${field.id}`

  return (
    <Field
      label={field.label}
      {...(field.description !== undefined ? { helper: field.description } : {})}
      {...(field.required !== undefined && !accountLayout ? { required: field.required } : {})}
      htmlFor={inputId}
      {...(accountLayout ? { layout: "inline" as const } : {})}
    >
      <Input
        id={inputId}
        type={field.control === "password" ? "password" : "text"}
        size="sm"
        {...(accountLayout ? { appearance: "embedded" as const } : {})}
        value={currentValue()}
        onInput={(value) => setFieldValue(field, value)}
        inputAttrs={{ "data-settings-schema-field": field.id }}
        {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
        {...(field.disabled !== undefined ? { disabled: field.disabled } : {})}
        {...(field.required !== undefined && !accountLayout ? { required: field.required } : {})}
      />
    </Field>
  )
}
