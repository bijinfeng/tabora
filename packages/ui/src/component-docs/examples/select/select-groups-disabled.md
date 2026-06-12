# Select Groups And Disabled

```html
<div class="demo-row" style="flex-direction: column; gap: 12px">
  <select class="sel">
    <option value="">请选择插件类型</option>
    <optgroup label="布局类">
      <option>sidebar</option>
      <option>panel</option>
    </optgroup>
    <optgroup label="功能类">
      <option>widget</option>
      <option>searchProvider</option>
    </optgroup>
  </select>
  <select class="sel" disabled>
    <option>禁用状态</option>
  </select>
  <select class="sel sel-error">
    <option value="">必选 - 错误状态</option>
  </select>
</div>
```
