// src/lib/utils/index.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Função utilitária para combinar classes CSS de forma inteligente
 * Combina clsx + tailwind-merge para evitar conflitos de classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Se você não tem clsx e tailwind-merge instalados, use esta versão simples:
// export function cn(...classes: (string | undefined | null | false)[]) {
//   return classes.filter(Boolean).join(' ')
// }