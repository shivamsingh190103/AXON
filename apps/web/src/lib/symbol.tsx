import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface SymbolProps {
  icon: LucideIcon
  size?: number
  className?: string
  strokeWidth?: number
}

export function Symbol({ icon: Icon, size = 18, className, strokeWidth = 1.9 }: SymbolProps) {
  return <Icon size={size} strokeWidth={strokeWidth} absoluteStrokeWidth className={clsx('shrink-0', className)} aria-hidden="true" />
}
