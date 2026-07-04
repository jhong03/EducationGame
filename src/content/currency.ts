/**
 * The currency seam (CURRICULUM.md §6.3, locked 2026-07-04): one core currency
 * per continent. Money GENERATORS are currency-agnostic (they deal in plain
 * values); only the RENDERER and labels read the family's chosen currency, so
 * switching currency never invalidates progress or content.
 */
export interface Currency {
  id: string
  symbol: string // shown before amounts, e.g. "$3"
  name: string // grown-up facing
  flag: string // for the ParentView picker
}

export const CURRENCIES: readonly Currency[] = [
  { id: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { id: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { id: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { id: 'SGD', symbol: '$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { id: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺' },
  { id: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
] as const

export const DEFAULT_CURRENCY_ID = 'USD'

export function currencyById(id: string): Currency {
  return CURRENCIES.find((c) => c.id === id) ?? CURRENCIES[0]
}
