import { Alert, Banner } from "./callout.styled"

export function BannerDemo() {
  return <Banner variant="info" title="新版本可用" description="Tabora v0.2.0 已发布。" />
}

export function AlertDemo() {
  return <Alert variant="warning" title="注意" description="该操作仅影响当前工作区。" />
}
