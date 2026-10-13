import { useState } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { Html } from '@/components/question/Html'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { findChapter, findTopic, useContentIndex } from '@/content/index-data'
import type { QuestionPage as QuestionData } from '@/content/types'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

function Summary({ questions, missed, onRestart }: { questions: QuestionData[]; missed: QuestionData[]; onRestart: () => void }) {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">
        {questions.length - missed.length} of {questions.length} correct
      </h1>
      {missed.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-semibold">Review these</h2>
          <ul className="divide-y rounded-xl border">
            {missed.map((question) => (
              <li key={question.id}>
                <Link to={`/${question.id}`} className="block px-5 py-3 hover:bg-muted">
                  <InlineHtml html={question.titleHtml} className={CODE_STYLE} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Button className="mt-8" onClick={onRestart}>
        Practice again
      </Button>
    </>
  )
}

function Session({ questions }: { questions: QuestionData[] }) {
  const [position, setPosition] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [missed, setMissed] = useState<QuestionData[]>([])

  function restart() {
    setPosition(0)
    setRevealed(false)
    setMissed([])
  }

  function record(gotIt: boolean) {
    if (!gotIt) setMissed((previous) => [...previous, questions[position]])
    setPosition(position + 1)
    setRevealed(false)
  }

  if (position >= questions.length) return <Summary questions={questions} missed={missed} onRestart={restart} />

  const question = questions[position]
  return (
    <>
      <p className="font-mono text-sm text-muted-foreground" aria-live="polite">
        {position + 1} / {questions.length}
      </p>
      <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight">
        <InlineHtml html={question.titleHtml} className={CODE_STYLE} />
      </h1>

      {revealed ? (
        <>
          <section aria-label="TL;DR" className="mt-8 rounded-xl bg-tldr px-6 py-5 text-lg leading-relaxed">
            <InlineHtml html={question.tldrHtml} className={CODE_STYLE} />
          </section>
          <div className="mt-6">
            <Html html={question.answerHtml} />
          </div>
          <Link to={`/${question.id}`} className="mt-4 inline-block text-link hover:text-link-hover">
            Full question →
          </Link>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => record(false)}>
              Missed it
            </Button>
            <Button onClick={() => record(true)}>Got it</Button>
          </div>
        </>
      ) : (
        <Button className="mt-8" onClick={() => setRevealed(true)}>
          Reveal answer
        </Button>
      )}
    </>
  )
}

export function PracticePage() {
  const params = useParams()
  const questions = useLoaderData<QuestionData[]>()
  const topic = findTopic(useContentIndex(), params.topic)
  const chapter = topic && findChapter(topic, params.chapter)
  if (!topic || !chapter) return <NotFound what="Chapter" />

  return (
    <PageShell
      crumbs={[
        { label: 'Topics', to: '/' },
        { label: topic.title, to: `/${topic.slug}` },
        { label: chapter.title, to: `/${topic.slug}/${chapter.slug}` },
      ]}
    >
      <title>{`Practice: ${chapter.title} · Deep Dive`}</title>
      {questions.length === 0 ? (
        <p className="text-muted-foreground">No published questions in this chapter yet.</p>
      ) : (
        // Keyed so moving between chapters starts a fresh session.
        <Session key={chapter.slug} questions={questions} />
      )}
    </PageShell>
  )
}
