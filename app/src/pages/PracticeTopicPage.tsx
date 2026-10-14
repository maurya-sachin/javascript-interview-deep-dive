import { Link, useLoaderData } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import type { loadTopic } from '@/content/index-data'
import { chapterStats } from '@/content/stats'
import { SITE_NAME } from '@/lib/site'

/** Pick a chapter of one topic to practise. */
export function PracticeTopicPage() {
  const topic = useLoaderData<Awaited<ReturnType<typeof loadTopic>>>()
  if (!topic) return <NotFound what="Topic" />
  const chapters = topic.chapters.map((chapter) => ({ chapter, readable: chapterStats([chapter]).readable })).filter(({ readable }) => readable > 0)

  return (
    <PageShell crumbs={[{ label: 'Practice', to: '/practice' }]} wide>
      <title>{`Practice: ${topic.title} · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">{topic.title}</h1>
      <p className="mt-2 text-muted-foreground">Pick a chapter. Each question shows its title; say your answer, then reveal it.</p>
      {chapters.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Nothing in this topic is published yet.</p>
      ) : (
        <ol className="mt-8 border-t">
          {chapters.map(({ chapter, readable }) => (
            <li key={chapter.slug} className="border-b">
              <Link to={`/practice/${topic.slug}/${chapter.slug}`} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-4 hover:text-link">
                <span className="font-mono text-sm text-muted-foreground">{chapter.number}</span>
                <span className="text-lg font-semibold">{chapter.title}</span>
                <span className="text-sm text-muted-foreground">{readable} questions</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  )
}
