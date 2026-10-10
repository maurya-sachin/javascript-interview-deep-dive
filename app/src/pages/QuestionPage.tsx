import { Link, useParams } from 'react-router'
import { ComingSoon, NotFound, PageShell } from '@/components/PageShell'
import { QuestionTitle } from '@/components/QuestionTitle'
import { findChapter, findTopic, neighbours, questionId, questionPath, useContentIndex } from '@/content/index-data'

export function QuestionPage() {
  const params = useParams()
  const topic = findTopic(useContentIndex(), params.topic)
  const chapter = topic && findChapter(topic, params.chapter)
  const id = topic && chapter && params.question ? questionId(topic, chapter, params.question) : undefined
  const question = chapter?.questions.find((candidate) => candidate.id === id)
  if (!topic || !chapter || !question) return <NotFound what="Question" />

  const { previous, next } = neighbours(topic, question.id)
  return (
    <PageShell
      crumbs={[
        { label: 'Topics', to: '/' },
        { label: topic.title, to: `/${topic.slug}` },
        { label: chapter.title, to: `/${topic.slug}/${chapter.slug}` },
      ]}
    >
      <h1 className="text-3xl leading-tight font-bold tracking-tight">
        <QuestionTitle html={question.titleHtml} />
      </h1>
      {!question.hasPage && (
        <p className="mt-4">
          <ComingSoon />
        </p>
      )}
      {/* TODO: render the question content (next Phase 4 task). */}
      <nav aria-label="Previous and next question" className="mt-12 grid grid-cols-2 gap-3">
        {previous ? (
          <Link to={questionPath(previous)} className="rounded-xl border p-4 hover:bg-muted">
            <span className="block text-sm text-muted-foreground">← Previous · {previous.number}</span>
            <QuestionTitle html={previous.titleHtml} />
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={questionPath(next)} className="col-start-2 rounded-xl border p-4 text-right hover:bg-muted">
            <span className="block text-sm text-muted-foreground">Next · {next.number} →</span>
            <QuestionTitle html={next.titleHtml} />
          </Link>
        )}
      </nav>
    </PageShell>
  )
}
