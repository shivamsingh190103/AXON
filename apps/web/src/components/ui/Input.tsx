import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  success?: boolean
}

export function Input({ error, success, className, ...props }: Props) {
  return (
    <input
      className={clsx(
        'input-base focus-ring',
        error && 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(248,113,113,0.12)]',
        success && 'border-[var(--success)]',
        className
      )}
      {...props}
    />
  )
}
