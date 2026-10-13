import type { ReactNode } from 'react'

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12 scroll-mt-8">
      <h2 id={id} className="mb-4 text-2xl font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      {children}
    </section>
  )
}
