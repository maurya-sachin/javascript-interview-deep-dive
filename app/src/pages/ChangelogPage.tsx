import { Link, useLoaderData } from 'react-router'
import { PageShell } from '@/components/PageShell'
import { formatMonth } from '@/content/freshness'
import { useManifest, type loadChangelog } from '@/content/index-data'
import type { ChangelogEntry } from '@/content/types'
import { REPO_URL } from '@/lib/repo'
import { SITE_NAME } from '@/lib/site'

/** Entries are newest first, so each month's entries are already adjacent. */
function groupByMonth(entries: ChangelogEntry[]): { month: string; entries: ChangelogEntry[] }[] {
  const groups: { month: string; entries: ChangelogEntry[] }[] = []
  for (const entry of entries) {
    const month = entry.date.slice(0, 7)
    const last = groups.at(-1)
    if (last?.month === month) last.entries.push(entry)
    else groups.push({ month, entries: [entry] })
  }
  return groups
}

export function ChangelogPage() {
  const { complete, entries } = useLoaderData<Awaited<ReturnType<typeof loadChangelog>>>()
  const { topics } = useManifest()
  const titles = new Map(topics.map((topic) => [topic.slug, topic.title]))

  return (
    <PageShell crumbs={[]}>
      <title>{`Changelog · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Changelog</h1>
      <p className="mt-2 mb-8 text-muted-foreground">What changed in the questions, and when.</p>

      {entries.length === 0 && <p className="text-muted-foreground">No changes are listed in this build.</p>}
      {groupByMonth(entries).map(({ month, entries: monthEntries }) => (
        <section key={month} aria-labelledby={`month-${month}`} className="mt-8 first:mt-0">
          <h2 id={`month-${month}`} className="border-b pb-2 text-lg font-semibold">
            {formatMonth(month)}
          </h2>
          <ul>
            {monthEntries.map((entry) => (
              <li key={entry.hash} className="grid grid-cols-[6.5rem_1fr] gap-x-4 border-b border-dashed py-3 last:border-b-0">
                <time dateTime={entry.date} className="font-mono text-sm text-muted-foreground">
                  {entry.date}
                </time>
                <div>
                  <p>{entry.subject}</p>
                  {entry.topics.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-x-3 text-sm">
                      {entry.topics.map((slug) =>
                        titles.has(slug) ? (
                          <Link key={slug} to={`/${slug}`} className="text-link hover:text-link-hover">
                            {titles.get(slug)}
                          </Link>
                        ) : (
                          <span key={slug} className="text-muted-foreground">
                            {slug}
                          </span>
                        ),
                      )}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!complete && (
        <p className="mt-8 text-sm text-muted-foreground">
          Older changes are in the{' '}
          <a href={`${REPO_URL}/commits/main/content`} className="text-link hover:text-link-hover">
            repository history
          </a>
          .
        </p>
      )}
    </PageShell>
  )
}
