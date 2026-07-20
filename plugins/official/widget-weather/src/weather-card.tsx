import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, InlineError, Skeleton } from "@tabora/ui"
import { RefreshCw } from "lucide-solid"
import { createWeatherStore } from "./weather-store"
import { aqiLabel, formatUpdatedAt, weatherCodeToText, windDirectionLabel } from "./weather-data"
import { styles } from "./styles"

export function WeatherCard(props: WidgetViewProps) {
  const store = createWeatherStore(props)

  return (
    <div {...stylex.attrs(styles.root)} data-weather-card>
      <Show
        when={store.snapshot()}
        fallback={
          <Show
            when={!store.error()}
            fallback={
              <div {...stylex.attrs(styles.stack)} data-weather-error>
                <InlineError>{store.error()!}</InlineError>
                <Button size="sm" variant="secondary" onClick={() => void store.load()}>
                  <RefreshCw size={12} /> 重试
                </Button>
              </div>
            }
          >
            <div {...stylex.attrs(styles.stack)}>
              <Skeleton height="52px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          </Show>
        }
      >
        {(snap) => (
          <div {...stylex.attrs(styles.body)}>
            <div {...stylex.attrs(styles.now)} data-weather-now>
              <div {...stylex.attrs(styles.temp)}>{snap().temp}°</div>
              <div {...stylex.attrs(styles.copy)}>
                <strong {...stylex.attrs(styles.title)}>
                  {weatherCodeToText(snap().code)} · 体感 {snap().feelsLike}°
                </strong>
                <span {...stylex.attrs(styles.muted)}>
                  {snap().city}
                  {snap().district ? ` · ${snap().district}` : ""} ·{" "}
                  {formatUpdatedAt(snap().updatedAt)}
                </span>
              </div>
            </div>

            <div {...stylex.attrs(styles.metrics)} data-weather-metrics aria-label="天气指标">
              <div {...stylex.attrs(styles.metric)}>
                <b {...stylex.attrs(styles.value)}>{snap().humidity}%</b>
                <span {...stylex.attrs(styles.muted)}>湿度</span>
              </div>
              <div {...stylex.attrs(styles.metric)}>
                <b {...stylex.attrs(styles.value)}>{snap().windSpeed}km/h</b>
                <span {...stylex.attrs(styles.muted)}>
                  {windDirectionLabel(snap().windDirection)}
                </span>
              </div>
              <div {...stylex.attrs(styles.metric)}>
                <b {...stylex.attrs(styles.value)}>{snap().aqi ?? "—"}</b>
                <span {...stylex.attrs(styles.muted)}>{aqiLabel(snap().aqi)}</span>
              </div>
            </div>

            <div {...stylex.attrs(styles.hours)} data-weather-hours aria-label="小时天气">
              <For each={snap().hours}>
                {(hour) => (
                  <div {...stylex.attrs(styles.hour)}>
                    <b>{hour.time}</b>
                    <span>{hour.temp}°</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
