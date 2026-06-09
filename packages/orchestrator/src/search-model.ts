import { uniq } from "es-toolkit/array"
import type { SearchProviderContribution } from "@tabora/plugin-api"

export type SearchRoute<TProvider extends SearchProviderContribution = SearchProviderContribution> =
    | { type: "provider-pending"; token: string; provider: TProvider | undefined }
    | { type: "provider"; token: string; provider: TProvider; query: string }
    | { type: "web"; provider: TProvider; query: string }

export function buildSearchUrl(provider: SearchProviderContribution, query: string): string {
  return provider.urlTemplate.replaceAll("{query}", encodeURIComponent(query.trim()))
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "").replaceAll(/\s+/g, "")
}

function providerTokens(provider: SearchProviderContribution): string[] {
  const suffix = provider.id.split(".").at(-1) ?? provider.id
  return uniq([provider.id, provider.title, suffix, provider.shortcut ?? ""])
    .map(normalizeToken)
    .filter(Boolean)
}

export function findProviderByToken<TProvider extends SearchProviderContribution>(
  providers: TProvider[],
  token: string,
): TProvider | undefined {
  const normalized = normalizeToken(token)
  return providers.find((provider) => providerTokens(provider).includes(normalized))
}

export function matchProvidersByToken<TProvider extends SearchProviderContribution>(
  providers: TProvider[],
  token: string,
): TProvider[] {
  const normalized = normalizeToken(token)
  if (!normalized) return providers
  return providers.filter((provider) =>
    providerTokens(provider).some((candidate) => candidate.includes(normalized)),
  )
}

export function resolveDefaultProvider<TProvider extends SearchProviderContribution>(
  providers: TProvider[],
  defaultProviderId: string,
): TProvider | undefined {
  return providers.find((provider) => provider.id === defaultProviderId)
}

export function routeSearchQuery<TProvider extends SearchProviderContribution>(
  query: string,
  providers: TProvider[],
  defaultProviderId: string,
): SearchRoute<TProvider> | null {
  const trimmed = query.trim()
  if (!trimmed) return null

  const providerOnlyMatch = trimmed.match(/^@(\S+)$/)
  if (providerOnlyMatch) {
    return {
      type: "provider-pending",
      token: providerOnlyMatch[1]!,
      provider: findProviderByToken(providers, providerOnlyMatch[1]!),
    }
  }

  const providerQueryMatch = trimmed.match(/^@(\S+)\s+(.*)$/)
  if (providerQueryMatch) {
    const provider = findProviderByToken(providers, providerQueryMatch[1]!)
    if (provider) {
      return {
        type: "provider",
        token: providerQueryMatch[1]!,
        provider,
        query: providerQueryMatch[2]!.trim(),
      }
    }
  }

  const defaultProvider = resolveDefaultProvider(providers, defaultProviderId)
  if (!defaultProvider) return null
  return {
    type: "web",
    provider: defaultProvider,
    query: trimmed,
  }
}
