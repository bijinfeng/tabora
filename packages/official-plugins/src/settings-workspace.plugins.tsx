import * as stylex from "@stylexjs/stylex"
import { Button, Checkbox, FieldRow, SegmentedControl, Select, Slider, Switch } from "@tabora/ui"
import { createSignal, For } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { className, styles } from "./styles"

const PLUGIN_INSTANCES = [
  { id: "weather-1", plugin: "天气", summary: "weather-1 · 城市与刷新" },
  { id: "shortcuts-1", plugin: "快捷入口", summary: "shortcuts-1 · 分组与打开方式" },
  { id: "todo-1", plugin: "待办", summary: "todo-1 · 清单与提醒" },
]

const SCHEMA_FIELD_TYPES = [
  { title: "text / textarea", description: "名称、URL、提示词、模板内容" },
  { title: "select / radio", description: "城市、数据源、刷新策略" },
  { title: "switch / checkbox", description: "开关能力、多选权限、显示字段" },
  { title: "range / stepper", description: "刷新间隔、数量、阈值和密度" },
]

const CITY_OPTIONS = ["北京", "上海", "深圳", "杭州"]

export function PluginRuntimeSettingsPanel(_props: SettingsPanelViewProps) {
  const [activeInstanceId, setActiveInstanceId] = createSignal("weather-1")
  const [city, setCity] = createSignal("北京")
  const [refreshInterval, setRefreshInterval] = createSignal(15)
  const [showTemperature, setShowTemperature] = createSignal(true)
  const [showAir, setShowAir] = createSignal(true)
  const [showWind, setShowWind] = createSignal(false)
  const [alertOnAbnormal, setAlertOnAbnormal] = createSignal(false)
  const [isolationEnabled, setIsolationEnabled] = createSignal(true)
  const [allowStorage, setAllowStorage] = createSignal(true)
  const [allowNetwork, setAllowNetwork] = createSignal(true)
  const [allowNotification, setAllowNotification] = createSignal(false)
  const [allowClipboard, setAllowClipboard] = createSignal(false)
  const [fieldScope, setFieldScope] = createSignal("instance")

  const activeInstance = () =>
    PLUGIN_INSTANCES.find((instance) => instance.id === activeInstanceId()) ?? PLUGIN_INSTANCES[0]

  const activePluginName = () => activeInstance()?.plugin ?? "天气"

  return (
    <div {...stylex.attrs(styles.panelStack)} data-settings-panel="plugins">
      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          运行插件配置
          <span {...stylex.attrs(styles.groupTitleMeta)}>{`${activePluginName()} · 当前实例`}</span>
        </div>
        <div {...stylex.attrs(styles.configList)} aria-label="选择插件配置">
          <For each={PLUGIN_INSTANCES}>
            {(instance) => (
              <Button
                size="md"
                variant="ghost"
                xstyle={[
                  styles.configButton,
                  instance.id === activeInstanceId() && styles.selected,
                ]}
                onClick={() => setActiveInstanceId(instance.id)}
              >
                <strong>{instance.plugin}</strong>
                <span>{instance.summary}</span>
              </Button>
            )}
          </For>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="默认城市"
          description="字段 type=select，由天气插件提供城市候选"
          trailing={
            <Select<string>
              size="sm"
              value={city()}
              options={CITY_OPTIONS.map((value) => ({ value, label: value }))}
              onChange={setCity}
              aria-label="天气默认城市"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="刷新间隔"
          description="字段 type=range，宿主负责保存和实时校验"
          trailing={
            <div {...stylex.attrs(styles.rangeControl)}>
              <Slider
                value={refreshInterval()}
                min={5}
                max={60}
                step={5}
                onChange={setRefreshInterval}
                aria-label="刷新间隔"
              />
              <span>{refreshInterval()}min</span>
            </div>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="卡片显示项"
          description="字段 type=checkbox-group，决定卡片紧凑态展示内容"
          trailing={
            <div {...stylex.attrs(styles.checkList)} aria-label="天气卡片显示项">
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={showTemperature()} onChange={setShowTemperature} label="温度" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={showAir()} onChange={setShowAir} label="空气" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={showWind()} onChange={setShowWind} label="风力" />
              </span>
            </div>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="异常时提醒"
          description="字段 type=switch，依赖通知权限"
          trailing={
            <Switch
              size="sm"
              checked={alertOnAbnormal()}
              onChange={setAlertOnAbnormal}
              aria-label="天气异常时提醒"
            />
          }
        />
      </section>

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          插件安全<span {...stylex.attrs(styles.groupTitleMeta)}>本地权限</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="插件隔离运行"
          description="插件错误只影响自身实例，不中断整个工作台"
          trailing={
            <Switch
              size="sm"
              checked={isolationEnabled()}
              onChange={setIsolationEnabled}
              aria-label="插件隔离运行"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="允许的权限"
          description="插件默认只能请求勾选范围内的本地能力"
          trailing={
            <div {...stylex.attrs(styles.checkList)} aria-label="允许的权限">
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={allowStorage()} onChange={setAllowStorage} label="存储" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={allowNetwork()} onChange={setAllowNetwork} label="网络" />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox
                  checked={allowNotification()}
                  onChange={setAllowNotification}
                  label="通知"
                />
              </span>
              <span {...stylex.attrs(styles.checkChip)}>
                <Checkbox checked={allowClipboard()} onChange={setAllowClipboard} label="剪贴板" />
              </span>
            </div>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="插件数据目录"
          description="插件缓存和本地配置的存放位置"
          trailing={
            <div {...stylex.attrs(styles.inlineActions)}>
              <code {...stylex.attrs(styles.pathCode)}>~/Library/Tabora/plugins</code>
              <Button size="sm" variant="secondary">
                更改
              </Button>
            </div>
          }
        />
      </section>

      <section {...stylex.attrs(styles.group)}>
        <div {...stylex.attrs(styles.groupTitle)}>
          开发者协议<span {...stylex.attrs(styles.groupTitleMeta)}>plugin.settings</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="插件声明设置项"
          description="运行插件通过 schema 注入设置，不直接改宿主窗口结构"
          trailing={<span {...stylex.attrs(styles.fieldNote)}>runtime</span>}
        />
        <div {...stylex.attrs(styles.schemaGrid)} aria-label="插件设置表单字段类型">
          <For each={SCHEMA_FIELD_TYPES}>
            {(field) => (
              <div {...stylex.attrs(styles.schemaChip)}>
                <strong>{field.title}</strong>
                <span>{field.description}</span>
              </div>
            )}
          </For>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="字段作用域"
          description="支持全局默认、插件默认、单个卡片实例三层覆盖"
          trailing={
            <SegmentedControl<string>
              size="sm"
              value={fieldScope()}
              options={[
                { value: "instance", label: "实例" },
                { value: "plugin", label: "插件" },
                { value: "global", label: "全局" },
              ]}
              onChange={setFieldScope}
              aria-label="字段作用域"
            />
          }
        />
      </section>
    </div>
  )
}
