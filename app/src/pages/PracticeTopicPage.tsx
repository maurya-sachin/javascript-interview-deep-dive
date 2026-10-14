import { Link, useLoaderData } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import type { loadTopic } from '@/content/index-data'
import { TopicCover } from '@/components/TopicCover'
import { chapterStats } from '@/content/stats'
import { SITE_NAME } from '@/lib/site'

/** Pick a chapter of one topic to practice. */
export function PracticeTopicPage() {
  const topic = useLoaderData<Awaited<ReturnType<typeof loadTopic>>>()
  if (!topic) return <NotFound what="Topic" />
  const stats = chapterStats(topic.chapters)
  const chapters = topic.chapters.map((chapter) => ({ chapter, readable: chapterStats([chapter]).readable })).filter(({ readable }) => readable > 0)

  return (
    <PageShell crumbs={[{ label: 'Practice', to: '/practice' }]} wide>
      <title>{`Practice: ${topic.title} · ${SITE_NAME}`}</title>
      <header className="flex items-center gap-5">
        <TopicCover slug={topic.slug} chapterCount={topic.chapters.length} hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total} className="hidden size-20 shrink-0 rounded-md bg-muted sm:block" />
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight">{topic.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {stats.readable} {stats.readable === 1 ? 'question' : 'questions'} in {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}. Say your answer, then reveal it.
          </p>
        </div>
      </header>
      {chapters.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Nothing in this topic is published yet.</p>
      ) : (
        <ol className="mt-8 border-t">
          {chapters.map(({ chapter, readable }) => (
            <li key={chapter.slug} className="border-b">
              <Link to={`/practice/${topic.slug}/${chapter.slug}`} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-4 hover:text-link">
                <span className="font-mono text-sm text-muted-foreground">{chapter.number}</span>
                <span className="text-lg font-semibold">{chapter.title}</span>
                <span className="text-sm text-muted-foreground">
                  {readable} {readable === 1 ? 'question' : 'questions'}
                  <span className="ml-3">Practice</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  )
}
