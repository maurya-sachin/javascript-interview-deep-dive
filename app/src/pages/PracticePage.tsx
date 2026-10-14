import { useState, type Ref } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { Html } from '@/components/question/Html'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/Kbd'
import { SessionProgress } from '@/components/SessionProgress'
import { SITE_NAME } from '@/lib/site'
import { useSessionFocus } from '@/lib/useSessionFocus'
import { useShortcuts } from '@/lib/useShortcuts'
import { findChapter, type loadPractice } from '@/content/index-data'
import type { QuestionPage as QuestionData } from '@/content/types'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

function Summary({ questions, missed, headingRef, onRestart }: { questions: QuestionData[]; missed: QuestionData[]; headingRef: Ref<HTMLHeadingElement>; onRestart: () => void }) {
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
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

  const finished = position >= questions.length
  const { promptRef, answerRef, doneRef } = useSessionFocus<HTMLHeadingElement, HTMLElement>(position, revealed, finished)
  useShortcuts(finished ? {} : revealed ? { '1': () => record(false), '2': () => record(true) } : { ' ': () => setRevealed(true), Enter: () => setRevealed(true) })

  if (finished) return <Summary questions={questions} missed={missed} headingRef={doneRef} onRestart={restart} />

  const question = questions[position]
  return (
    <>
      <SessionProgress done={position} total={questions.length} label="Questions answered" />
      <p className="mt-2 font-mono text-sm text-muted-foreground" aria-live="polite">
        {position + 1} / {questions.length}
      </p>
      <h1 ref={promptRef} tabIndex={-1} className="mt-3 text-3xl leading-tight font-bold tracking-tight outline-none">
        <InlineHtml html={question.titleHtml} className={CODE_STYLE} />
      </h1>

      {revealed ? (
        <>
          <section ref={answerRef} tabIndex={-1} aria-label="Answer" className="outline-none">
            <section aria-label="TL;DR" className="mt-8 rounded-xl bg-tldr px-6 py-5 text-lg leading-relaxed">
              <InlineHtml html={question.tldrHtml} className={CODE_STYLE} />
            </section>
            <div className="mt-6">
              <Html html={question.answerHtml} />
            </div>
          </section>
          <Link to={`/${question.id}`} className="mt-4 inline-block text-link hover:text-link-hover">
            Read the full question
          </Link>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" aria-keyshortcuts="1" onClick={() => record(false)}>
              Missed it
              <Kbd>1</Kbd>
            </Button>
            <Button aria-keyshortcuts="2" onClick={() => record(true)}>
              Got it
              <Kbd>2</Kbd>
            </Button>
          </div>
        </>
      ) : (
        <Button className="mt-8" aria-keyshortcuts="Space" onClick={() => setRevealed(true)}>
          Reveal answer
          <Kbd>Space</Kbd>
        </Button>
      )}
    </>
  )
}

export function PracticePage() {
  const params = useParams()
  const { topic, questions } = useLoaderData<Awaited<ReturnType<typeof loadPractice>>>()
  const chapter = topic && findChapter(topic, params.chapter)
  if (!topic || !chapter) return <NotFound what="Chapter" />

  return (
    <PageShell
      crumbs={[
        { label: 'Practice', to: '/practice' },
        { label: topic.title, to: `/practice/${topic.slug}` },
        { label: chapter.title, to: `/${topic.slug}/${chapter.slug}` },
      ]}
    >
      <title>{`Practice: ${chapter.title} · ${SITE_NAME}`}</title>
      {questions.length === 0 ? (
        <p className="text-muted-foreground">No published questions in this chapter yet.</p>
      ) : (
        // Keyed so moving between chapters starts a fresh session.
        <Session key={chapter.slug} questions={questions} />
      )}
    </PageShell>
  )
}
