import { Link, useParams } from 'react-router'
import { ComingSoon, NotFound, PageShell } from '@/components/PageShell'
import { findChapter, findTopic, questionPath, useContentIndex } from '@/content/index-data'
import { QuestionTitle } from '@/components/QuestionTitle'

export function ChapterPage() {
  const params = useParams()
  const topic = findTopic(useContentIndex(), params.topic)
  const chapter = topic && findChapter(topic, params.chapter)
  if (!topic || !chapter) return <NotFound what="Chapter" />

  return (
    <PageShell
      crumbs={[
        { label: 'Topics', to: '/' },
        { label: topic.title, to: `/${topic.slug}` },
      ]}
    >
      <h1 className="text-3xl font-bold tracking-tight">{chapter.title}</h1>
      <ol className="mt-6 divide-y rounded-xl border">
        {chapter.questions.map((question) => (
          <li key={question.id} className="flex items-baseline gap-4 px-5 py-4">
            <span className="font-mono text-xs text-muted-foreground">{question.number}</span>
            {question.hasPage ? (
              <Link to={questionPath(question)} className="flex-1 hover:text-link">
                <QuestionTitle html={question.titleHtml} />
              </Link>
            ) : (
              <span className="flex flex-1 flex-wrap items-baseline gap-2 text-muted-foreground">
                <QuestionTitle html={question.titleHtml} />
                <ComingSoon />
              </span>
            )}
          </li>
        ))}
      </ol>
    </PageShell>
  )
}
