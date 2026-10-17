import { Link } from 'react-router'
import { RouteLine } from '@/components/RouteLine'
import type { RolePath } from '@/content/types'
import { readingHours } from '@/lib/effort'
import { describePath, stepPath, stepState } from '@/lib/paths'
import { useProgress } from '@/lib/progress'

/** The role chooser: one row per path, with its steps drawn as a route. */
export function RoleList({ paths }: { paths: RolePath[] }) {
  const { read } = useProgress()
  return (
    <ul className="border-b">
      {paths.map((path) => {
        const ready = path.steps.filter((step) => step.ready)
        const hours = readingHours(ready.reduce((sum, step) => sum + step.questionCount, 0))
        const stations = path.steps.map((step) => ({
          key: `${step.topic}/${step.chapter ?? ''}`,
          label: step.chapterTitle ? `${step.topicTitle}: ${step.chapterTitle}` : step.topicTitle,
          to: stepPath(step),
          state: stepState(step, read),
        }))
        return (
          <li key={path.slug} className="border-t">
            <Link to={`/paths/${path.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-3 py-4 hover:bg-linear-to-r hover:from-muted hover:to-transparent">
              <span>
                <span className="block font-serif text-[1.375rem] leading-tight font-medium">{path.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{describePath(path)}</span>
              </span>
              <span className="text-sm text-link opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">Open path</span>
              <span className="col-span-2 max-w-xl">
                <RouteLine stations={stations} orientation="compact" />
                <span className="mt-2 block text-sm text-muted-foreground">
                  {ready.length} of {path.steps.length} ready{hours > 0 && ` · about ${hours} ${hours === 1 ? 'hour' : 'hours'}`}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
