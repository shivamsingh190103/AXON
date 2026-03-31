import clsx from 'clsx'
import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  success?: boolean
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ error, success, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'input-base focus-ring',
        error && 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(248,113,113,0.12)]',
        success && 'border-[var(--success)]',
        className
      )}
      {...props}
    />
  )
})
