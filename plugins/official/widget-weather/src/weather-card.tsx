import { For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, InlineError, Skeleton } from "@tabora/ui"
import { RefreshCw } from "lucide-solid"
import { createWeatherStore } from "./weather-store"
import { aqiLabel, formatUpdatedAt, weatherCodeToText, windDirectionLabel } from "./weather-data"
import { styles, sx } from "./styles"

export function WeatherCard(props: WidgetViewProps) {
  const store = createWeatherStore(props)

  return (
    <div {...sx(styles.root)} data-weather-card>
      <Show
        when={store.snapshot()}
        fallback={
          <Show
            when={!store.error()}
            fallback={
              <div {...sx(styles.stack)} data-weather-error>
                <InlineError>{store.error()!}</InlineError>
                <Button size="sm" variant="secondary" onClick={() => void store.load()}>
                  <RefreshCw size={12} /> 重试
                </Button>
              </div>
            }
          >
            <div {...sx(styles.stack)}>
              <Skeleton height="52px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          </Show>
        }
      >
        {(snap) => (
          <div {...sx(styles.body)}>
            <div {...sx(styles.now)} data-weather-now>
              <div {...sx(styles.temp)}>{snap().temp}°</div>
              <div {...sx(styles.copy)}>
                <strong {...sx(styles.title)}>
                  {weatherCodeToText(snap().code)} · 体感 {snap().feelsLike}°
                </strong>
                <span {...sx(styles.muted)}>
                  {snap().city}
                  {snap().district ? ` · ${snap().district}` : ""} ·{" "}
                  {formatUpdatedAt(snap().updatedAt)}
                </span>
              </div>
            </div>

            <div {...sx(styles.metrics)} data-weather-metrics aria-label="天气指标">
              <div {...sx(styles.metric)}>
                <b {...sx(styles.value)}>{snap().humidity}%</b>
                <span {...sx(styles.muted)}>湿度</span>
              </div>
              <div {...sx(styles.metric)}>
                <b {...sx(styles.value)}>{snap().windSpeed}km/h</b>
                <span {...sx(styles.muted)}>{windDirectionLabel(snap().windDirection)}</span>
              </div>
              <div {...sx(styles.metric)}>
                <b {...sx(styles.value)}>{snap().aqi ?? "—"}</b>
                <span {...sx(styles.muted)}>{aqiLabel(snap().aqi)}</span>
              </div>
            </div>

            <div {...sx(styles.hours)} data-weather-hours aria-label="小时天气">
              <For each={snap().hours}>
                {(hour) => (
                  <div {...sx(styles.hour)}>
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
