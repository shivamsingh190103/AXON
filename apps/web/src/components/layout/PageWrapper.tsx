import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function PageWrapper({ children }: Props) {
  return <main className="min-h-[calc(100vh-56px)] p-4 md:p-6 lg:p-10">{children}</main>
}
