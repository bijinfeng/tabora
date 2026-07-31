import type { JSX } from "solid-js"
import Cloud from "lucide-solid/icons/cloud"
import CloudDrizzle from "lucide-solid/icons/cloud-drizzle"
import CloudFog from "lucide-solid/icons/cloud-fog"
import CloudLightning from "lucide-solid/icons/cloud-lightning"
import CloudRain from "lucide-solid/icons/cloud-rain"
import CloudSnow from "lucide-solid/icons/cloud-snow"
import CloudSun from "lucide-solid/icons/cloud-sun"
import Sun from "lucide-solid/icons/sun"
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
