import { Link } from 'react-router'
import { ComingSoon } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { QuestionTitle } from '@/components/QuestionTitle'
import type { ChapterSummary } from '@/content/types'
import { questionPath } from '@/content/index-data'
import { cn } from '@/lib/utils'

export function ChapterNav({ topicSlug, chapter, currentId }: { topicSlug: string; chapter: ChapterSummary; currentId: string }) {
  const hasPublished = chapter.questions.some((question) => question.hasPage)
  return (
    <nav aria-label="Questions in this chapter" className="text-sm">
      <p className="font-mono text-xs tracking-wide text-muted-foreground">CHAPTER {chapter.number}</p>
      <p className="mt-1 text-lg font-semibold">{chapter.title}</p>
      <ol className="mt-4 flex flex-col gap-0.5">
        {chapter.questions.map((question) => {
          const label = (
            <>
              <span className="pt-0.5 font-mono text-xs text-muted-foreground">{question.number}</span>
              <span className="leading-snug">
                <QuestionTitle html={question.titleHtml} />
                {!question.hasPage && (
                  <>
                    {' '}
                    <ComingSoon />
                  </>
                )}
              </span>
            </>
          )
          return (
            <li key={question.id}>
              {question.hasPage ? (
                <Link
                  to={questionPath(question)}
                  aria-current={question.id === currentId ? 'page' : undefined}
                  className={cn(
                    'flex gap-2.5 rounded-md px-2.5 py-2 hover:bg-muted',
                    question.id === currentId && 'bg-tldr font-medium text-tldr-foreground hover:bg-tldr',
                  )}
                >
                  {label}
                </Link>
              ) : (
                <div className="flex gap-2.5 px-2.5 py-2 text-muted-foreground">{label}</div>
              )}
            </li>
          )
        })}
      </ol>
      {hasPublished && (
        <Button asChild size="lg" className="mt-6 w-full">
          <Link to={`/practice/${topicSlug}/${chapter.slug}`}>Practice this chapter</Link>
        </Button>
      )}
    </nav>
  )
}
