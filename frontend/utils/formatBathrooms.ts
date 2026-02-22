/**
 * Format bathrooms count for display:
 * - Natural numbers (1.0, 2.0, 3.0) → "1", "2", "3"
 * - One decimal (4.50, 3.5, 0.50) → "4.5", "3.5", "0.5"
 * - Two decimals (3.25, 4.75, 0.25) → "3.25", "4.75", "0.25"
 */
export const formatBathrooms = (value: number | null | undefined, fallback: string = '-'): string => {
  if (value == null) return fallback
  return String(parseFloat(Number(value).toFixed(2)))
}
