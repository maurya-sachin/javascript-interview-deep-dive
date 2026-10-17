import { Link, useLoaderData } from 'react-router'
import { PageShell } from '@/components/PageShell'
import { formatMonth } from '@/content/freshness'
import { questionPath, type loadChangelog } from '@/content/index-data'
import type { ChangelogDay } from '@/content/types'
import { REPO_URL } from '@/lib/repo'
import { SITE_NAME } from '@/lib/site'

const VISIBLE_QUESTIONS = 5

/** Days are newest first; the Map keeps each month's days together without relying on adjacency. */
function groupByMonth(days: ChangelogDay[]): Map<string, ChangelogDay[]> {
  const months = new Map<string, ChangelogDay[]>()
  for (const day of days) {
    const month = day.date.slice(0, 7)
    months.set(month, [...(months.get(month) ?? []), day])
  }
  return months
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function ChangelogPage() {
  const { complete, days } = useLoaderData<Awaited<ReturnType<typeof loadChangelog>>>()

  return (
    <PageShell crumbs={[]}>
      <title>{`Changelog · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Changelog</h1>
      <p className="mt-2 mb-8 text-muted-foreground">Which questions were added or changed, and when.</p>

      {days.length === 0 && (
        <p className="text-muted-foreground">
          No published questions have changed yet.{!complete && ' Changes are in the repository history.'}
        </p>
      )}
      {[...groupByMonth(days)].map(([month, monthDays]) => (
        <section key={month} aria-labelledby={`month-${month}`} className="mt-8 first:mt-0">
          <h2 id={`month-${month}`} className="border-b pb-2 text-lg font-semibold">
            {formatMonth(month)}
          </h2>
          <ul>
            {monthDays.flatMap((day) =>
              day.topics.map((topic) => (
                <li key={`${day.date}/${topic.slug}`} className="grid grid-cols-[4.5rem_1fr] gap-x-4 border-b border-dashed py-3 last:border-b-0">
                  <time dateTime={day.date} className="font-mono text-sm text-muted-foreground">
                    {formatDay(day.date)}
                  </time>
                  <div>
                    <Link to={`/${topic.slug}`} className="font-medium text-link hover:text-link-hover">
                      {topic.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-sm">
                      {topic.questions.slice(0, VISIBLE_QUESTIONS).map((question) => (
                        <Link key={question.id} to={questionPath(question)} className="hover:text-link">
                          {question.title}
                        </Link>
                      ))}
                      {topic.questions.length > VISIBLE_QUESTIONS && (
                        <span className="text-muted-foreground">+{topic.questions.length - VISIBLE_QUESTIONS} more</span>
                      )}
                    </p>
                  </div>
                </li>
              )),
            )}
          </ul>
        </section>
      ))}

      {!complete && days.length > 0 && (
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
