import { Link, useParams } from 'react-router'
import { DifficultyMix } from '@/components/DifficultyMix'
import { NotFound, PageShell } from '@/components/PageShell'
import { InlineHtml } from '@/components/question/InlineHtml'
import { Button } from '@/components/ui/button'
import { chapterStats, findTopic, questionPath, useContentIndex } from '@/content/index-data'
import { useProgress } from '@/lib/progress'

const INLINE_CODE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function TopicPage() {
  const topic = findTopic(useContentIndex(), useParams().topic)
  const { read } = useProgress()
  if (!topic) return <NotFound what="Topic" />

  const stats = chapterStats(topic.chapters)
  const questions = topic.chapters.flatMap((chapter) => chapter.questions)
  // Continue at the first readable question not read yet; fall back to the first readable one.
  const start = questions.find((question) => question.hasPage && !read.includes(question.id)) ?? questions.find((question) => question.hasPage)
  const readCount = questions.filter((question) => read.includes(question.id)).length

  return (
    <PageShell crumbs={[{ label: 'Topics', to: '/' }]} wide>
      <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
      <InlineHtml html={topic.summaryHtml} className={`mt-3 block max-w-2xl text-lg leading-relaxed text-muted-foreground ${INLINE_CODE}`} />

      {topic.chapters.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed p-5 text-muted-foreground">Chapters for this topic are planned.</p>
      ) : (
        <>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <Stat value={topic.chapters.length} label="chapters" />
            <Stat value={stats.total} label="questions" />
            <Stat value={stats.core} label="core" />
            {topic.flashcardCount > 0 && <Stat value={topic.flashcardCount} label="flashcards" />}
            {readCount > 0 && <Stat value={readCount} label="read by you" />}
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
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

          <h2 className="mt-12 text-xl font-semibold">Chapters</h2>
          <ol className="mt-4 grid gap-3">
            {topic.chapters.map((chapter) => {
              const chapterQuestions = chapterStats([chapter])
              const chapterRead = chapter.questions.filter((question) => read.includes(question.id)).length
              return (
                <li key={chapter.slug}>
                  <Link
                    to={`/${topic.slug}/${chapter.slug}`}
                    className="grid gap-x-5 gap-y-2 rounded-xl border p-5 transition-colors hover:bg-muted sm:grid-cols-[2.5rem_1fr_11rem]"
                  >
                    <span className="font-mono text-sm text-muted-foreground sm:pt-1">{chapter.number}</span>
                    <span>
                      <span className="block text-lg font-semibold">{chapter.title}</span>
                      <InlineHtml html={chapter.summaryHtml} className={`mt-1 block text-sm leading-relaxed text-muted-foreground ${INLINE_CODE}`} />
                    </span>
                    <span className="flex flex-col gap-2 text-sm text-muted-foreground sm:pt-1.5 sm:text-right">
                      <DifficultyMix counts={chapterQuestions.byDifficulty} />
                      <span>
                        {chapterQuestions.total} questions
                        {chapterQuestions.core > 0 && ` · ${chapterQuestions.core} core`}
                      </span>
                      {chapterRead > 0 && (
                        <span className="text-link">
                          {chapterRead} of {chapterQuestions.total} read
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
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
