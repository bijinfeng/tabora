export function formatAdminTimestamp(value: string | number): string {
  const milliseconds = typeof value === "number" ? value * 1000 : Date.parse(value)
  return Number.isNaN(milliseconds) ? String(value) : new Date(milliseconds).toLocaleString()
}
