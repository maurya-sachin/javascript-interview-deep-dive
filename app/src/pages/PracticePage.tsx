import { useState, type Ref } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { Html } from '@/components/question/Html'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/Kbd'
import { SegmentBar, SessionCard, SessionHeader } from '@/components/SessionLayout'
import { SessionProgress } from '@/components/SessionProgress'
import { SITE_NAME } from '@/lib/site'
import { useSessionFocus } from '@/lib/useSessionFocus'
import { useShortcuts } from '@/lib/useShortcuts'
import { findChapter, type loadPractice } from '@/content/index-data'
import type { QuestionPage as QuestionData } from '@/content/types'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

interface SessionProps {
  questions: QuestionData[]
  /** Where to go after the last question, when a later chapter has questions to practise. */
  next: { title: string; to: string } | undefined
}

function Summary({ questions, missed, next, headingRef, onRestart }: SessionProps & { missed: QuestionData[]; headingRef: Ref<HTMLHeadingElement>; onRestart: () => void }) {
  const knew = questions.length - missed.length
  return (
    <>
      <SessionHeader title="Questions" />
      <SessionProgress done={questions.length} total={questions.length} label="Questions answered" />
      <SessionCard>
        <h1 ref={headingRef} tabIndex={-1} className="font-serif text-2xl leading-snug outline-none sm:text-3xl">
          You knew {knew} of {questions.length}
        </h1>
        <div className="mt-5">
          <SegmentBar
            label={`${knew} knew, ${missed.length} missed`}
            segments={[
              { count: knew, className: 'bg-depth-4' },
              { count: missed.length, className: 'bg-depth-1' },
            ]}
          />
        </div>
        {missed.length > 0 && (
          <>
            <h2 className="mt-8 mb-2 text-sm font-semibold">Review these</h2>
            <ul className="divide-y rounded-lg border">
              {missed.map((question) => (
                <li key={question.id}>
                  <Link to={`/${question.id}`} className="block px-4 py-3 text-sm hover:bg-muted">
                    <InlineHtml html={question.titleHtml} className={CODE_STYLE} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <Button onClick={onRestart}>Practice again</Button>
          {next && (
            <Button asChild variant="outline">
              <Link to={next.to}>Next chapter: {next.title}</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/practice">Back to practice</Link>
          </Button>
        </div>
      </SessionCard>
    </>
  )
}

function Session({ questions, next }: SessionProps) {
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

  if (finished) return <Summary questions={questions} missed={missed} next={next} headingRef={doneRef} onRestart={restart} />

  const question = questions[position]
  return (
    <>
      <SessionHeader title="Questions" status={`${position + 1} of ${questions.length}`} />
      <SessionProgress done={position} total={questions.length} label="Questions answered" />
      <SessionCard>
        <h1 ref={promptRef} tabIndex={-1} className="font-serif text-2xl leading-snug outline-none sm:text-3xl">
          <InlineHtml html={question.titleHtml} className={CODE_STYLE} />
        </h1>
        {revealed ? (
          <>
            <hr className="my-6" />
            <section ref={answerRef} tabIndex={-1} aria-label="Answer" className="outline-none">
              <section aria-label="30-second answer">
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">30-second answer</h2>
                <div className="rounded-xl bg-tldr px-4 py-4 text-base leading-relaxed sm:px-6 sm:py-5 sm:text-lg">
                  <InlineHtml html={question.tldrHtml} className={CODE_STYLE} />
                </div>
              </section>
              <div className="mt-6">
                <Html html={question.answerHtml} />
              </div>
            </section>
            <Link to={`/${question.id}`} className="mt-4 self-start text-sm text-link hover:text-link-hover">
              Read the full question
            </Link>
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">Say your answer out loud, then reveal it.</p>
        )}
      </SessionCard>
      {revealed ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Button variant="outline" aria-keyshortcuts="1" onClick={() => record(false)}>
            Missed it
            <Kbd>1</Kbd>
          </Button>
          <Button aria-keyshortcuts="2" onClick={() => record(true)}>
            Got it
            <Kbd>2</Kbd>
          </Button>
        </div>
      ) : (
        <Button className="mt-4 w-full sm:w-auto" aria-keyshortcuts="Space" onClick={() => setRevealed(true)}>
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
  const nextChapter = topic.chapters.slice(topic.chapters.indexOf(chapter) + 1).find((later) => later.questions.some((question) => question.hasPage))

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
        <div className="mx-auto max-w-2xl">
          <Session key={chapter.slug} questions={questions} next={nextChapter && { title: nextChapter.title, to: `/practice/${topic.slug}/${nextChapter.slug}` }} />
        </div>
      )}
    </PageShell>
  )
}
