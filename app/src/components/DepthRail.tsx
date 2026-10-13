import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface DepthStop {
  id: string
  title: string
}

/**
 * A vertical gauge of how far down a question the reader is: surface (the 30-second answer) to the deep end.
 * The line fills as the page scrolls and the current section's node lights up.
 */
export function DepthRail({ stops }: { stops: DepthStop[] }) {
  const [activeId, setActiveId] = useState(stops[0]?.id)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const anchor = window.innerHeight * 0.3
      const passed = stops.filter((stop) => (document.getElementById(stop.id)?.getBoundingClientRect().top ?? Infinity) <= anchor)
      setActiveId(passed.at(-1)?.id ?? stops[0]?.id)
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [stops])

  return (
    <nav aria-label="Depth of this answer" className="h-full text-sm">
      <div className="sticky top-8 flex gap-3">
        <div className="relative w-1.5 shrink-0 rounded-full bg-border" aria-hidden="true">
          <div
            className="absolute inset-x-0 top-0 rounded-full bg-linear-to-b from-depth-from to-depth-to"
            style={{ height: `${progress * 100}%` }}
          />
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs text-muted-foreground">Surface</span>
          <ol className="flex flex-col gap-2.5">
            {stops.map((stop) => (
              <li key={stop.id}>
                <a
                  href={`#${stop.id}`}
                  aria-current={stop.id === activeId ? 'location' : undefined}
                  className={cn(
                    'flex items-center gap-2 transition-colors hover:text-foreground',
                    stop.id === activeId ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-2 rounded-full border', stop.id === activeId ? 'border-link bg-link' : 'border-muted-foreground/50')}
                  />
                  {stop.title}
                </a>
              </li>
            ))}
          </ol>
          <span className="text-xs text-muted-foreground">Deep end</span>
        </div>
      </div>
    </nav>
  )
}
