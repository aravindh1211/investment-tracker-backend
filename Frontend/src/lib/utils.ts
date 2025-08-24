import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}

export function getSectorColor(sector: string): string {
  const colors = {
    'Technology': '#3B82F6',
    'Healthcare': '#10B981',
    'Finance': '#F59E0B',
    'Consumer': '#EF4444',
    'Energy': '#8B5CF6',
    'Materials': '#06B6D4',
    'Utilities': '#84CC16',
    'Real Estate': '#F97316',
    'Industrials': '#6366F1',
    'Communications': '#EC4899',
  }
  
  return colors[sector as keyof typeof colors] || '#64748B'
}

export function calculateGainLossColor(value: number): string {
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-muted-foreground'
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}