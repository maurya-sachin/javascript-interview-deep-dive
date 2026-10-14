import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { DifficultyMix } from '@/components/DifficultyMix'
import { ComingSoon, NotFound, PageShell } from '@/components/PageShell'
import { InlineHtml } from '@/components/question/InlineHtml'
import { DifficultyBadge, FrequencyDots } from '@/components/question/MetaRow'
import { QuestionTitle } from '@/components/QuestionTitle'
import { Button } from '@/components/ui/button'
import { findChapter, questionPath, useTopic } from '@/content/index-data'
import { chapterStats } from '@/content/stats'
import type { Difficulty } from '@/content/types'
import { useProgress } from '@/lib/progress'
import { cn } from '@/lib/utils'

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard']

export function ChapterPage() {
  const params = useParams()
  const topic = useTopic()
  const chapter = topic && findChapter(topic, params.chapter)
  const { read } = useProgress()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [coreOnly, setCoreOnly] = useState(false)
  if (!topic || !chapter) return <NotFound what="Chapter" />

  const stats = chapterStats([chapter])
  const shown = chapter.questions.filter((question) => (!difficulty || question.difficulty === difficulty) && (!coreOnly || question.core))
  const filtering = difficulty !== null || coreOnly

  return (
    <PageShell
      wide
      crumbs={[
        { label: 'Topics', to: '/' },
        { label: topic.title, to: `/${topic.slug}` },
      ]}
    >
      <p className="text-sm text-muted-foreground">Chapter {chapter.number}</p>
      <h1 className="mt-1 text-4xl font-bold tracking-[-0.03em]">{chapter.title}</h1>
      <InlineHtml html={chapter.summaryHtml} className="mt-3 block max-w-2xl font-serif text-xl leading-relaxed text-muted-foreground [&_code]:font-mono [&_code]:text-[0.9em]" />

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span>{stats.total} questions</span>
        <DifficultyMix counts={stats.byDifficulty} className="w-32" />
        {stats.readable > 0 && (
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link to={`/practice/${topic.slug}/${chapter.slug}`}>Practice this chapter</Link>
          </Button>
        )}
      </div>

      <div role="group" aria-label="Filter questions" className="mt-6 flex flex-wrap gap-2 text-sm">
        {LEVELS.map((level) => (
          <FilterChip key={level} pressed={difficulty === level} onClick={() => setDifficulty(difficulty === level ? null : level)}>
            <span className="capitalize">{level}</span> · {stats.byDifficulty[level]}
          </FilterChip>
        ))}
        <FilterChip pressed={coreOnly} onClick={() => setCoreOnly(!coreOnly)}>
          Core · {stats.core}
        </FilterChip>
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setDifficulty(null)
              setCoreOnly(false)
            }}
            className="px-2 text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-5 text-muted-foreground">No questions match these filters.</p>
      ) : (
        <ol className="mt-4 border-t">
          {shown.map((question) => (
            <li key={question.id} className="grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-2 border-b py-4 sm:grid-cols-[2.5rem_1fr_auto]">
              <span className="font-mono text-xs text-muted-foreground sm:pt-1">{question.number}</span>
              {question.hasPage ? (
                <Link to={questionPath(question)} className="font-medium hover:text-link">
                  <QuestionTitle html={question.titleHtml} />
                  {read.includes(question.id) && <span className="ml-2 text-xs font-normal text-link">Read</span>}
                </Link>
              ) : (
                <span className="flex flex-wrap items-baseline gap-2 text-muted-foreground">
                  <QuestionTitle html={question.titleHtml} />
                  <ComingSoon />
                </span>
              )}
              <span className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:col-start-3">
                {question.core && <span className="rounded-full border px-2 py-0.5 text-xs">Core</span>}
                <FrequencyDots frequency={question.frequency} />
                <DifficultyBadge difficulty={question.difficulty} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  )
}

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 transition-colors hover:bg-muted',
        pressed && 'border-link bg-tldr text-tldr-foreground hover:bg-tldr',
      )}
    >
      {children}
    </button>
  )
}
