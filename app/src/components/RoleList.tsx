import { Link } from 'react-router'
import type { RolePath } from '@/content/types'
import { describePath } from '@/lib/paths'

/** The role chooser: one row per path. */
export function RoleList({ paths }: { paths: RolePath[] }) {
  return (
    <ul className="border-b">
      {paths.map((path) => (
        <li key={path.slug} className="border-t">
          <Link to={`/paths/${path.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 hover:bg-linear-to-r hover:from-muted hover:to-transparent">
            <span>
              <span className="block font-serif text-[1.375rem] leading-tight font-medium">{path.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{describePath(path)}</span>
            </span>
            <span className="text-sm text-link opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">Open path</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
