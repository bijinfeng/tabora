import type { TaboraDatabase } from "@tabora/storage"

const suppressionDepth = new WeakMap<TaboraDatabase, number>()

export function isChangeDetectionSuppressed(database: TaboraDatabase): boolean {
  return (suppressionDepth.get(database) ?? 0) > 0
}

export async function withoutChangeDetection<T>(
  database: TaboraDatabase,
  operation: () => Promise<T>,
): Promise<T> {
  suppressionDepth.set(database, (suppressionDepth.get(database) ?? 0) + 1)
  try {
    return await operation()
  } finally {
    const nextDepth = (suppressionDepth.get(database) ?? 1) - 1
    if (nextDepth > 0) {
      suppressionDepth.set(database, nextDepth)
    } else {
      suppressionDepth.delete(database)
    }
  }
}
