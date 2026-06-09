export function SectionHead(props: { label: string; title: string; description: string }) {
  return (
    <div class="section-head">
      <div class="label">{props.label}</div>
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </div>
  )
}
