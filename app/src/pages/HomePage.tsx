import { Link } from 'react-router'
import { DepthLadder } from '@/components/DepthLadder'
import { DifficultyMix } from '@/components/DifficultyMix'
import { PageShell } from '@/components/PageShell'
import { InlineHtml } from '@/components/question/InlineHtml'
import { QuestionTitle } from '@/components/QuestionTitle'
import { useManifest } from '@/content/index-data'
import type { TopicOverview } from '@/content/types'
import { useProgress } from '@/lib/progress'
import { groupByTrack } from '@/lib/tracks'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { topics } = useManifest()
  const { read, last, lastTitleHtml } = useProgress()
  const available = topics.filter((topic) => topic.chapterCount > 0)
  const questionTotal = available.reduce((sum, topic) => sum + topic.stats.total, 0)
  const cards = available.reduce((sum, topic) => sum + topic.flashcardCount, 0)
  const lastQuestion = last && lastTitleHtml ? { id: last, titleHtml: lastTitleHtml } : null

  return (
    <PageShell crumbs={[]} wide>
      <section className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:items-center lg:gap-20">
        <div>
          <h1 className="max-w-xl text-[2.75rem] leading-[1.08] font-bold tracking-[-0.03em] sm:text-5xl">
            Know the answer, and why it is true.
          </h1>
          <p className="mt-5 max-w-lg font-serif text-xl leading-relaxed text-muted-foreground">
            Interview questions phrased the way they are asked. Each one starts with the 30-second answer and goes down to the spec
            and the engine.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
            <Stat value={available.length} label={available.length === 1 ? 'topic' : 'topics'} />
            <Stat value={questionTotal} label="questions" />
            <Stat value={cards} label="flashcards" />
            {read.length > 0 && <Stat value={read.length} label="read by you" />}
          </dl>
          {lastQuestion && (
            <Link to={`/${lastQuestion.id}`} className="group mt-8 flex max-w-lg items-baseline gap-3 border-l-2 border-link pl-4">
              <span>
                <span className="block text-sm text-muted-foreground">Continue where you left off</span>
                <span className="block font-medium group-hover:text-link">
                  <QuestionTitle html={lastQuestion.titleHtml} />
                </span>
              </span>
            </Link>
          )}
        </div>
        <DepthLadder />
      </section>

      <div className="mt-20 flex flex-col gap-14">
        {groupByTrack(topics).map((group) => (
          <section key={group.name} aria-labelledby={`track-${group.name}`}>
            <h2 id={`track-${group.name}`} className="text-2xl font-semibold tracking-tight">
              {group.name}
            </h2>
            <ul className="mt-4 border-t">
              {group.topics.map((topic) => (
                <TopicRow key={topic.slug} topic={topic} readCount={countRead(topic, read)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  )
}

/** Question ids are `<topic>/<chapter>/<question>`, so a topic's reads share its slug as a prefix. */
function countRead(topic: TopicOverview, read: readonly string[]) {
  return read.filter((id) => id.startsWith(`${topic.slug}/`)).length
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dd className="order-first text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dt className="text-muted-foreground">{label}</dt>
    </div>
  )
}

function TopicRow({ topic, readCount }: { topic: TopicOverview; readCount: number }) {
  const stats = topic.stats
  const planned = topic.chapterCount === 0
  return (
    <li className="border-b">
      <Link to={`/${topic.slug}`} className="group grid gap-x-8 gap-y-2 py-5 sm:grid-cols-[1fr_14rem]">
        <span>
          <span className={cn('text-lg font-semibold group-hover:text-link', planned && 'text-muted-foreground')}>{topic.title}</span>
          <InlineHtml
            html={topic.summaryHtml}
            className="mt-1 line-clamp-2 block max-w-2xl text-sm leading-relaxed text-muted-foreground [&_code]:font-mono"
          />
        </span>
        {planned ? (
          <span className="text-sm text-muted-foreground sm:text-right">Planned</span>
        ) : (
          <span className="flex flex-col gap-2 text-sm text-muted-foreground sm:text-right">
            <DifficultyMix counts={stats.byDifficulty} />
            <span>
              {topic.chapterCount} chapters, {stats.total} questions
              {topic.flashcardCount > 0 && `, ${topic.flashcardCount} cards`}
            </span>
            {readCount > 0 && <span className="text-link">{readCount} read</span>}
          </span>
        )}
      </Link>
    </li>
  )
}
