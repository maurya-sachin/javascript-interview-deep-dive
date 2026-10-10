import { Link } from 'react-router'
import { PageShell } from '@/components/PageShell'
import { questionCount, useContentIndex } from '@/content/index-data'

export function HomePage() {
  const { topics } = useContentIndex()
  return (
    <PageShell crumbs={[]}>
      <h1 className="text-3xl font-bold tracking-tight">Topics</h1>
      <ul className="mt-6 divide-y rounded-xl border">
        {topics.map((topic) => {
          const { published, total } = questionCount(topic.chapters)
          return (
            <li key={topic.slug}>
              <Link to={`/${topic.slug}`} className="flex items-baseline justify-between gap-4 px-5 py-4 hover:bg-muted">
                <span className="font-medium">{topic.title}</span>
                <span className="text-sm text-muted-foreground">
                  {topic.chapters.length === 0 ? 'Planned' : `${published}/${total} published`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </PageShell>
  )
}
