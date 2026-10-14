import { Link } from 'react-router'
import { useState } from 'react'
import { DifficultyMix } from '@/components/DifficultyMix'
import { NotFound, PageShell } from '@/components/PageShell'
import { TopicCover } from '@/components/TopicCover'
import { InlineHtml } from '@/components/question/InlineHtml'
import { QuestionTitle } from '@/components/QuestionTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { questionPath, useTopic } from '@/content/index-data'
import { filterOutline } from '@/content/outline'
import { chapterStats } from '@/content/stats'
import type { TopicSummary } from '@/content/types'
import { useProgress } from '@/lib/progress'
import { cn } from '@/lib/utils'

const INLINE_CODE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function TopicPage() {
  const topic = useTopic()
  if (!topic) return <NotFound what="Topic" />
  // Keyed so the filter starts empty when moving between topics.
  return <Topic key={topic.slug} topic={topic} />
}

function Topic({ topic }: { topic: TopicSummary }) {
  const { read } = useProgress()
  const [query, setQuery] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const stats = chapterStats(topic.chapters)
  const questions = topic.chapters.flatMap((chapter) => chapter.questions)
  // Continue at the first readable question not read yet; fall back to the first readable one.
  const start = questions.find((question) => question.hasPage && !read.includes(question.id)) ?? questions.find((question) => question.hasPage)
  const readCount = questions.filter((question) => read.includes(question.id)).length
  const filtering = query.trim() !== '' || unreadOnly
  const shown = filterOutline(topic.chapters, read, { query, unreadOnly })

  return (
    <PageShell crumbs={[{ label: 'Topics', to: '/' }]} wide>
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
        <header className="lg:sticky lg:top-8 lg:self-start">
          <TopicCover
            slug={topic.slug}
            chapterCount={topic.chapters.length}
            hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total}
            className="mb-6 hidden aspect-16/10 w-full rounded-lg bg-muted lg:block"
          />
          <h1 className="text-4xl font-bold tracking-[-0.03em]">{topic.title}</h1>
          <InlineHtml html={topic.summaryHtml} className={`mt-3 block font-serif text-xl leading-relaxed text-muted-foreground ${INLINE_CODE}`} />

          {topic.chapters.length > 0 && (
            <>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 lg:grid lg:grid-cols-2">
                <Stat value={topic.chapters.length} label="chapters" />
                <Stat value={stats.total} label="questions" />
                <Stat value={stats.core} label="core" />
                {topic.flashcardCount > 0 && <Stat value={topic.flashcardCount} label="flashcards" />}
                {readCount > 0 && <Stat value={readCount} label="read by you" />}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3 lg:flex-col">
                {start && (
                  <Button asChild size="lg">
                    <Link to={questionPath(start)}>{readCount > 0 ? 'Continue reading' : 'Start reading'}</Link>
                  </Button>
                )}
                {topic.flashcardCount > 0 && (
                  <Button asChild variant="outline" size="lg">
                    <Link to={`/flashcards/${topic.slug}`}>Study {topic.flashcardCount} flashcards</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </header>

        <section aria-label="Contents">
          {topic.chapters.length === 0 ? (
            <p className="rounded-xl border border-dashed p-5 text-muted-foreground">Chapters for this topic are planned.</p>
          ) : (
            <>
              <div className="flex gap-3">
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter chapters and questions"
                  aria-label="Filter chapters and questions"
                  className="h-9 flex-1"
                />
                <Button variant="outline" size="lg" aria-pressed={unreadOnly} onClick={() => setUnreadOnly((value) => !value)} className={cn(unreadOnly && 'bg-tldr text-tldr-foreground')}>
                  Unread only
                </Button>
              </div>

              {shown.length === 0 ? (
                <p className="mt-6 text-muted-foreground">
                  Nothing matches.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setUnreadOnly(false)
                    }}
                    className="text-link hover:text-link-hover"
                  >
                    Clear the filter
                  </button>
                </p>
              ) : (
                <ol className="mt-4 border-t">
                  {shown.map((chapter) => {
                    const counts = chapterStats([chapter])
                    const chapterRead = chapter.questions.filter((question) => read.includes(question.id)).length
                    return (
                      <li key={chapter.slug} className="border-b">
                        <details open={filtering} className="group">
                          <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[2.5rem_1fr_11rem] [&::-webkit-details-marker]:hidden">
                            <span className="font-mono text-sm text-muted-foreground">{chapter.number}</span>
                            <span className="text-lg font-semibold group-hover:text-link">{chapter.title}</span>
                            <span className="col-start-2 flex flex-col gap-1.5 text-sm text-muted-foreground sm:col-start-3 sm:text-right">
                              <DifficultyMix counts={counts.byDifficulty} />
                              <span>
                                {counts.total} questions{chapterRead > 0 && `, ${chapterRead} read`}
                              </span>
                            </span>
                          </summary>
                          <div className="pb-4 pl-14">
                            <InlineHtml html={chapter.summaryHtml} className={`block text-sm leading-relaxed text-muted-foreground ${INLINE_CODE}`} />
                            <ul className="mt-3 flex flex-col">
                              {chapter.questions.map((question) => (
                                <li key={question.id} className="border-t border-dashed first:border-t-0">
                                  <Link to={questionPath(question)} className="flex items-baseline justify-between gap-4 py-2 hover:text-link">
                                    <QuestionTitle html={question.titleHtml} />
                                    {read.includes(question.id) && <span className="shrink-0 text-xs text-muted-foreground">read</span>}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <Link to={`/${topic.slug}/${chapter.slug}`} className="mt-2 inline-block text-sm text-link hover:text-link-hover">
                              Open chapter page
                            </Link>
                          </div>
                        </details>
                      </li>
                    )
                  })}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </PageShell>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="order-first text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dt className="text-muted-foreground">{label}</dt>
    </div>
  )
}
