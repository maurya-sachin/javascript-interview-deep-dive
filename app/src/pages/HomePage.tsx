import { Link } from 'react-router'
import { DifficultyMix } from '@/components/DifficultyMix'
import { PageShell } from '@/components/PageShell'
import { InlineHtml } from '@/components/question/InlineHtml'
import { QuestionTitle } from '@/components/QuestionTitle'
import { chapterStats, questionPath, useContentIndex } from '@/content/index-data'
import type { TopicSummary } from '@/content/types'
import { useProgress } from '@/lib/progress'

export function HomePage() {
  const { topics } = useContentIndex()
  const { read, last } = useProgress()
  const available = topics.filter((topic) => topic.chapters.length > 0)
  const planned = topics.filter((topic) => topic.chapters.length === 0)
  const totals = chapterStats(available.flatMap((topic) => topic.chapters))
  const cards = available.reduce((sum, topic) => sum + topic.flashcardCount, 0)

  const lastQuestion = available
    .flatMap((topic) => topic.chapters.flatMap((chapter) => chapter.questions))
    .find((question) => question.id === last && question.hasPage)

  return (
    <PageShell crumbs={[]} wide>
      <section className="max-w-2xl">
        <h1 className="text-4xl leading-tight font-bold tracking-tight">Know the answer, and why it is true.</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Interview questions phrased the way they are asked. Each starts with a 30-second answer, then goes down to the spec and the engine.
        </p>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <Stat value={available.length} label={available.length === 1 ? 'topic with content' : 'topics with content'} />
          <Stat value={totals.total} label="questions" />
          <Stat value={cards} label="flashcards" />
          {read.length > 0 && <Stat value={read.length} label="read by you" />}
        </dl>
      </section>

      {lastQuestion && (
        <Link
          to={questionPath(lastQuestion)}
          className="mt-8 flex max-w-2xl items-baseline justify-between gap-4 rounded-xl bg-tldr px-5 py-4 text-tldr-foreground hover:opacity-90"
        >
          <span>
            <span className="block text-sm">Continue where you left off</span>
            <span className="block font-medium text-foreground">
              <QuestionTitle html={lastQuestion.titleHtml} />
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      <h2 className="mt-12 text-xl font-semibold">Topics</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {available.map((topic) => (
          <li key={topic.slug}>
            <TopicCard topic={topic} readCount={topic.chapters.flatMap((c) => c.questions).filter((q) => read.includes(q.id)).length} />
          </li>
        ))}
      </ul>

      {planned.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-semibold">Planned</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {planned.map((topic) => (
              <li key={topic.slug} className="text-sm">
                <Link to={`/${topic.slug}`} className="font-medium hover:text-link">
                  {topic.title}
                </Link>
                <InlineHtml html={topic.summaryHtml} className="mt-0.5 block text-muted-foreground [&_code]:font-mono" />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="order-first text-xl font-semibold text-foreground tabular-nums">{value}</dd>
      <dt>{label}</dt>
    </div>
  )
}

function TopicCard({ topic, readCount }: { topic: TopicSummary; readCount: number }) {
  const stats = chapterStats(topic.chapters)
  return (
    <Link to={`/${topic.slug}`} className="flex h-full flex-col rounded-xl border p-5 transition-colors hover:bg-muted">
      <span className="text-lg font-semibold">{topic.title}</span>
      <InlineHtml html={topic.summaryHtml} className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground [&_code]:font-mono" />
      <DifficultyMix counts={stats.byDifficulty} className="mt-5" />
      <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{topic.chapters.length} chapters</span>
        <span>{stats.total} questions</span>
        {topic.flashcardCount > 0 && <span>{topic.flashcardCount} cards</span>}
        {readCount > 0 && <span className="text-link">{readCount} read</span>}
      </span>
    </Link>
  )
}
