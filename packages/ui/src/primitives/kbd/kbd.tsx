export type KbdProps = { children: string; class?: string }

export function Kbd(props: KbdProps) {
  return <kbd class={props.class}>{props.children}</kbd>
}
