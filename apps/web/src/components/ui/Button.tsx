import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--primary)] text-white hover:brightness-110',
  ghost: 'bg-transparent border border-white/10 hover:bg-white/5',
  danger: 'bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger)]/30',
  secondary: 'bg-white/10 text-white hover:bg-white/20'
}

export function Button({ className, variant = 'primary', fullWidth, ...props }: Props) {
  return (
    <button
      className={clsx(
        'focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  )
}
