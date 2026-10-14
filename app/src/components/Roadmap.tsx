import { Link } from 'react-router'
import type { TopicOverview } from '@/content/types'
import { CONTRIBUTE_URL } from '@/lib/repo'
import { groupByTrack } from '@/lib/tracks'

/** Every topic by track, with what is written and what is planned. */
export function Roadmap({ topics }: { topics: TopicOverview[] }) {
  const planned = topics.filter((topic) => topic.chapterCount === 0).length
  return (
    <>
      <p className="max-w-2xl text-muted-foreground">
        {planned} topics are planned and not written yet. Each has a README with its scope.{' '}
        <a href={CONTRIBUTE_URL} className="text-link hover:text-link-hover">
          Contribute a question
        </a>
      </p>
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {groupByTrack(topics).map((group) => (
          <section key={group.name}>
            <h3 className="text-sm font-semibold">{group.name}</h3>
            <ul className="mt-2">
              {group.topics.map((topic) => (
                <li key={topic.slug} className="border-t">
                  <Link to={`/${topic.slug}`} className="flex justify-between gap-3 py-1.5 text-sm hover:text-link">
                    <span className={topic.chapterCount === 0 ? 'text-muted-foreground' : undefined}>{topic.title}</span>
                    {topic.chapterCount === 0 && <span className="text-muted-foreground">Planned</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
