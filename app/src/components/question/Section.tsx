import type { ReactNode } from 'react'

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10 scroll-mt-6">
      <h2 id={id} className="mb-3 text-[1.375rem] font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}
