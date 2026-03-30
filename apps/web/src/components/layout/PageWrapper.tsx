import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function PageWrapper({ children }: Props) {
  return <main className="min-h-[calc(100vh-56px)] p-4 pb-24 md:p-6 md:pb-6 lg:p-10 lg:pb-10">{children}</main>
}
