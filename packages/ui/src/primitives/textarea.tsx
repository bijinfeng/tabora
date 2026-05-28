export type TextareaProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  invalid?: boolean
  "aria-label"?: string
  id?: string
}

export function Textarea(props: TextareaProps) {
  return (
    <textarea
      class="tabora-textarea"
      id={props.id}
      rows={props.rows ?? 4}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      aria-invalid={props.invalid ? true : undefined}
      data-invalid={props.invalid ? "" : undefined}
      onInput={(e) => props.onInput(e.currentTarget.value)}
    />
  )
}
