export function scrollToHash(hash: string) {
  queueMicrotask(() => document.querySelector(hash)?.scrollIntoView())
}
