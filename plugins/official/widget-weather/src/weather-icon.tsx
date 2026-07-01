import type { JSX } from "solid-js"
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-solid"
import { weatherCodeToIcon } from "./weather-data"

const ICON_COMPONENTS: Record<string, (props: { size?: number }) => JSX.Element> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  "cloud-lightning": CloudLightning,
}

export function WeatherIcon(props: { code: number; size?: number }): JSX.Element {
  const name = weatherCodeToIcon(props.code)
  const Component = ICON_COMPONENTS[name] ?? Cloud
  return <Component size={props.size ?? 16} />
}
