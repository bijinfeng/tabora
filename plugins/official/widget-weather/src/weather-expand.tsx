import { createSignal, For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, InlineError, SegmentedControl, Select, Skeleton } from "@tabora/ui"
import { RefreshCw } from "lucide-solid"
import { WeatherIcon } from "./weather-icon"
import { createWeatherStore } from "./weather-store"
import {
  aqiLabel,
  formatUpdatedAt,
  weatherCodeToText,
  windDirectionLabel,
  type WeatherSnapshot,
} from "./weather-data"
import { styles, sx } from "./styles"

type WeatherView = "hourly" | "forecast" | "advice"

// 常用城市预设，作为 Select 快速切换项；用户仍可保存任意配置城市。
const PRESET_CITIES = ["北京", "上海", "深圳", "广州", "杭州", "成都"]

type Advice = { name: string; desc: string; tag: string }

// 依据真实数据推导生活建议
function buildAdvice(snap: WeatherSnapshot): Advice[] {
  const rain = snap.precipitation
  const aqi = snap.aqi
  const humidity = snap.humidity

  const commute: Advice =
    rain >= 50
      ? { name: "通勤", desc: "降水概率较高，建议携带雨具并预留时间。", tag: "带伞" }
      : rain >= 20
        ? { name: "通勤", desc: "可能有短时降水，出门前留意天气变化。", tag: "留意降水" }
        : { name: "通勤", desc: "降水概率低，适合步行或骑行。", tag: "低风险" }

  const drying: Advice =
    rain >= 30 || humidity >= 75
      ? { name: "晾晒", desc: "湿度偏高或有降水，不建议户外晾晒。", tag: "不推荐" }
      : { name: "晾晒", desc: "湿度适中，适合户外晾晒。", tag: "适宜" }

  const sport: Advice =
    aqi !== null && aqi > 150
      ? { name: "运动", desc: "空气质量较差，建议室内运动。", tag: "室内" }
      : rain >= 50
        ? { name: "运动", desc: "降水概率高，建议改为室内训练。", tag: "室内" }
        : { name: "运动", desc: "天气与空气质量良好，适合户外运动。", tag: "适宜" }

  return [commute, drying, sport]
}

export function WeatherExpand(props: WidgetViewProps) {
  const store = createWeatherStore(props)
  const [view, setView] = createSignal<WeatherView>("hourly")

  const cityOptions = () => {
    const current = store.city()
    const set = new Set<string>([current, ...PRESET_CITIES])
    return [...set].map((city) => ({ value: city, label: city }))
  }

  return (
    <div {...sx(styles.expand)} data-widget-expand="weather">
      <Show
        when={store.snapshot()}
        fallback={
          <Show
            when={!store.error()}
            fallback={
              <div {...sx(styles.stack)}>
                <InlineError>{store.error()!}</InlineError>
                <Button size="sm" variant="secondary" onClick={() => void store.load()}>
                  <RefreshCw size={12} /> 重试
                </Button>
              </div>
            }
          >
            <div {...sx(styles.stack)}>
              <Skeleton height="88px" width="100%" />
              <Skeleton height="200px" width="100%" />
            </div>
          </Show>
        }
      >
        {(snap) => (
          <div {...sx(styles.expandBody)}>
            <div {...sx(styles.main)}>
              <section {...sx(styles.nowPanel)} aria-label="当前天气">
                <div {...sx(styles.icon)}>
                  <WeatherIcon code={snap().code} size={40} />
                </div>
                <div {...sx(styles.temp)}>{snap().temp}°</div>
                <div {...sx(styles.copy)}>
                  <strong {...sx(styles.title)}>
                    {weatherCodeToText(snap().code)} · 体感 {snap().feelsLike}°
                  </strong>
                  <span {...sx(styles.muted)}>
                    {snap().city}
                    {snap().district ? ` · ${snap().district}` : ""} ·{" "}
                    {formatUpdatedAt(snap().updatedAt)}更新
                  </span>
                </div>
                <div {...sx(styles.aqi)}>
                  <b {...sx(styles.value)}>AQI {snap().aqi ?? "—"}</b>
                  <span {...sx(styles.muted)}>{aqiLabel(snap().aqi)}</span>
                </div>
              </section>

              <SegmentedControl
                size="sm"
                value={view()}
                onChange={(next) => setView(next as WeatherView)}
                options={[
                  { value: "hourly", label: "逐小时" },
                  { value: "forecast", label: "三日趋势" },
                  { value: "advice", label: "生活建议" },
                ]}
                aria-label="天气视图切换"
              />

              <Show when={view() === "hourly"}>
                <section {...sx(styles.panel)} aria-label="逐小时天气">
                  <div {...sx(styles.panelHead)}>
                    <span>未来 5 小时</span>
                    <span>温度 · 天气 · 降水</span>
                  </div>
                  <div {...sx(styles.list)}>
                    <For each={snap().hours}>
                      {(hour) => (
                        <div {...sx(styles.row)}>
                          <b>{hour.time}</b>
                          <span {...sx(styles.rowText)}>
                            <WeatherIcon code={hour.code} size={14} />{" "}
                            {weatherCodeToText(hour.code)}
                          </span>
                          <em {...sx(styles.rowMeta)}>
                            {hour.temp}° · 降水 {hour.precipitation}%
                          </em>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>

              <Show when={view() === "forecast"}>
                <section {...sx(styles.panel)} aria-label="三日趋势">
                  <div {...sx(styles.panelHead)}>
                    <span>未来三天</span>
                    <span>高低温 · 天气</span>
                  </div>
                  <div {...sx(styles.list)}>
                    <For each={snap().days}>
                      {(day) => (
                        <div {...sx(styles.row)}>
                          <b>{day.label}</b>
                          <span {...sx(styles.rowText)}>
                            <WeatherIcon code={day.code} size={14} /> {weatherCodeToText(day.code)}
                          </span>
                          <em {...sx(styles.rowMeta)}>
                            {day.high}° / {day.low}°
                          </em>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>

              <Show when={view() === "advice"}>
                <section {...sx(styles.panel)} aria-label="生活建议">
                  <div {...sx(styles.panelHead)}>
                    <span>个人提醒</span>
                    <span>通勤 · 晾晒 · 运动</span>
                  </div>
                  <div {...sx(styles.list)}>
                    <For each={buildAdvice(snap())}>
                      {(advice) => (
                        <div {...sx(styles.row, styles.advice)}>
                          <b>{advice.name}</b>
                          <span {...sx(styles.rowText)}>{advice.desc}</span>
                          <em {...sx(styles.rowMeta)}>{advice.tag}</em>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>
            </div>

            <aside {...sx(styles.side)} aria-label="天气配置">
              <section {...sx(styles.sidePanel)}>
                <div {...sx(styles.title)}>城市</div>
                <Select
                  size="sm"
                  value={store.city()}
                  onChange={(next) => void store.setCity(next)}
                  options={cityOptions()}
                  aria-label="选择城市"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void store.load()}
                  disabled={store.loading()}
                >
                  <RefreshCw size={13} /> {store.loading() ? "刷新中" : "刷新"}
                </Button>
              </section>

              <section {...sx(styles.sidePanel)}>
                <div {...sx(styles.title)}>关注指标</div>
                <div {...sx(styles.miniGrid)}>
                  <div {...sx(styles.mini)}>
                    <b {...sx(styles.value)}>{snap().humidity}%</b>
                    <span {...sx(styles.muted)}>湿度</span>
                  </div>
                  <div {...sx(styles.mini)}>
                    <b {...sx(styles.value)}>{snap().windSpeed}km/h</b>
                    <span {...sx(styles.muted)}>{windDirectionLabel(snap().windDirection)}</span>
                  </div>
                  <div {...sx(styles.mini)}>
                    <b {...sx(styles.value)}>{snap().precipitation}%</b>
                    <span {...sx(styles.muted)}>降水概率</span>
                  </div>
                  <div {...sx(styles.mini)}>
                    <b {...sx(styles.value)}>{snap().feelsLike}°</b>
                    <span {...sx(styles.muted)}>体感温度</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </Show>
    </div>
  )
}
