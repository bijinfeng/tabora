export function SiteToast(props: { visible: boolean; message: string }) {
  return (
    <div
      class="toast"
      classList={{ visible: props.visible }}
      role="status"
      aria-live="polite"
      data-toast
      data-component="SiteToast"
    >
      {props.message}
    </div>
  )
}
