import { For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { InlineError, Skeleton } from "@tabora/ui"
import { RefreshCw } from "lucide-solid"
import { createWeatherStore } from "./weather-store"
import { aqiLabel, formatUpdatedAt, weatherCodeToText, windDirectionLabel } from "./weather-data"

export function WeatherCard(props: WidgetViewProps) {
  const store = createWeatherStore(props)

  return (
    <div class="weather-widget">
      <Show
        when={store.snapshot()}
        fallback={
          <Show
            when={!store.error()}
            fallback={
              <div class="weather-error">
                <InlineError>{store.error()!}</InlineError>
                <button class="weather-retry" type="button" onClick={() => void store.load()}>
                  <RefreshCw size={12} /> 重试
                </button>
              </div>
            }
          >
            <div class="weather-skeleton">
              <Skeleton height="52px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          </Show>
        }
      >
        {(snap) => (
          <div class="weather-body">
            <div class="weather-now">
              <div class="weather-temp">{snap().temp}°</div>
              <div class="weather-state">
                <strong>
                  {weatherCodeToText(snap().code)} · 体感 {snap().feelsLike}°
                </strong>
                <span>
                  {snap().city}
                  {snap().district ? ` · ${snap().district}` : ""} ·{" "}
                  {formatUpdatedAt(snap().updatedAt)}
                </span>
              </div>
            </div>

            <div class="weather-metrics" aria-label="天气指标">
              <div class="metric">
                <b>{snap().humidity}%</b>
                <span>湿度</span>
              </div>
              <div class="metric">
                <b>{snap().windSpeed}km/h</b>
                <span>{windDirectionLabel(snap().windDirection)}</span>
              </div>
              <div class="metric">
                <b>{snap().aqi ?? "—"}</b>
                <span>{aqiLabel(snap().aqi)}</span>
              </div>
            </div>

            <div class="hour-strip" aria-label="小时天气">
              <For each={snap().hours}>
                {(hour) => (
                  <div class="hour-pill">
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
