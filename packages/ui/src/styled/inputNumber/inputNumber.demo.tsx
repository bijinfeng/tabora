import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { InputNumber } from "./inputNumber.styled"

export function InputNumberDemo() {
  const [quantity, setQuantity] = createSignal(2)
  const [price, setPrice] = createSignal(19.9)
  const [percent, setPercent] = createSignal(75)

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.row)}>
        <InputNumber
          value={quantity()}
          min={1}
          max={10}
          onChange={(value) => value !== null && setQuantity(value)}
          aria-label="购买数量"
        />
        <span {...stylex.attrs(demoStyles.muted)}>范围 1–10，当前 {quantity()}</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <InputNumber
          value={price()}
          min={0}
          step={0.1}
          precision={2}
          formatter={(value) => (value === undefined ? "" : `¥ ${value.toFixed(2)}`)}
          parser={(value) => Number(value?.replace(/[^\d.]/g, ""))}
          onChange={(value) => value !== null && setPrice(value)}
          aria-label="单价"
        />
        <span {...stylex.attrs(demoStyles.muted)}>格式化、解析和精度</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <InputNumber
          value={percent()}
          min={0}
          max={100}
          size="sm"
          controls={false}
          onChange={(value) => value !== null && setPercent(value)}
          aria-label="完成进度"
        />
        <span {...stylex.attrs(demoStyles.muted)}>small + 无步进按钮：{percent()}%</span>
      </div>
    </div>
  )
}
