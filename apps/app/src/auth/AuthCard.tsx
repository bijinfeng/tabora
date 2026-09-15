import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"

import { TaboraMark } from "@tabora/brand"

import { styles } from "./auth.styles"

type AuthCardProps = {
  title: string
  subtitle: string
  children: JSX.Element
}

/** 认证页居中卡片壳：品牌标识 + 标题 + 表单 slot。app 级容器，不进 @tabora/ui。 */
export function AuthCard(props: AuthCardProps) {
  return (
    <div {...stylex.attrs(styles.page)}>
      <div {...stylex.attrs(styles.card)}>
        <div {...stylex.attrs(styles.header)}>
          <div {...stylex.attrs(styles.brandRow)}>
            <TaboraMark {...stylex.attrs(styles.brandMark)} />
            <span {...stylex.attrs(styles.brandName)}>Tabora Admin</span>
          </div>
          <h1 {...stylex.attrs(styles.title)}>{props.title}</h1>
          <p {...stylex.attrs(styles.subtitle)}>{props.subtitle}</p>
        </div>
        {props.children}
      </div>
    </div>
  )
}
