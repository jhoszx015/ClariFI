import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse valores em pt-BR (ex.: 1.234,56 ou 1234,56). */
export function parseMoneyBr(input: string): number {
  const s = input.trim().replace(/\s/g, '')
  if (!s) return NaN
  const normalized = s.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized)
}
