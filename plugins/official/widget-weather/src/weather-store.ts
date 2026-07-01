import { createSignal, type Accessor } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { DEFAULT_CITY, fetchWeather, type WeatherSnapshot } from "./weather-data"

const CACHE_KEY = "weather-snapshot"

export type WeatherStore = {
  snapshot: Accessor<WeatherSnapshot | null>
  loading: Accessor<boolean>
  error: Accessor<string | null>
  city: Accessor<string>
  load: (city?: string) => Promise<void>
  setCity: (city: string) => Promise<void>
}

export function resolveConfiguredCity(config: Record<string, unknown>): string {
  return typeof config.city === "string" && config.city.trim() ? config.city.trim() : DEFAULT_CITY
}

// 卡片与展开弹窗各自建立 store：先读实例缓存即时渲染，再请求刷新。
export function createWeatherStore(props: WidgetViewProps): WeatherStore {
  const [snapshot, setSnapshot] = createSignal<WeatherSnapshot | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [city, setCityValue] = createSignal(resolveConfiguredCity(props.config))

  let requestToken = 0

  async function load(nextCity?: string) {
    const target = nextCity ?? city()
    const token = ++requestToken
    setLoading(true)
    setError(null)
    try {
      const result = await fetchWeather(target)
      if (token !== requestToken) return
      setSnapshot(result)
      await props.data.save(CACHE_KEY, result)
    } catch (err) {
      if (token !== requestToken) return
      // 网络失败时回退到缓存，无缓存才展示错误
      const cached = await props.data.get<WeatherSnapshot>(CACHE_KEY)
      if (cached) {
        setSnapshot(cached)
      } else {
        setError(err instanceof Error ? err.message : "天气加载失败")
      }
    } finally {
      if (token === requestToken) setLoading(false)
    }
  }

  async function setCity(nextCity: string) {
    setCityValue(nextCity)
    await props.host.updateConfig({ ...props.config, city: nextCity })
    await load(nextCity)
  }

  // 初始化：先用缓存占位，再拉最新
  void (async () => {
    const cached = await props.data.get<WeatherSnapshot>(CACHE_KEY)
    if (cached && !snapshot()) setSnapshot(cached)
    await load()
  })()

  return { snapshot, loading, error, city, load, setCity }
}
