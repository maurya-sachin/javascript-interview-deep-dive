import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/Kbd'
import { SegmentBar, SessionCard, SessionHeader } from '@/components/SessionLayout'
import { SessionProgress } from '@/components/SessionProgress'
import { SITE_NAME } from '@/lib/site'
import { formatInterval, formatUntil } from '@/lib/time'
import { useSessionFocus } from '@/lib/useSessionFocus'
import { useShortcuts } from '@/lib/useShortcuts'
import type { loadFlashcards } from '@/content/index-data'
import { deckStatus, dueQueue, NEW_CARDS_PER_SESSION, nextDue, previewIntervals } from '@/content/review'
import { loadReviews, recordRating } from '@/content/reviewStore'
import type { Flashcard } from '@/content/types'
import { Rating, type Grade } from 'ts-fsrs'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

type Counts = Record<'again' | 'hard' | 'good' | 'easy', number>
const RATINGS: { label: string; key: string; grade: Grade; count: keyof Counts; bar: string }[] = [
  { label: 'Again', key: '1', grade: Rating.Again, count: 'again', bar: 'bg-depth-1' },
  { label: 'Hard', key: '2', grade: Rating.Hard, count: 'hard', bar: 'bg-depth-2' },
  { label: 'Good', key: '3', grade: Rating.Good, count: 'good', bar: 'bg-depth-3' },
  { label: 'Easy', key: '4', grade: Rating.Easy, count: 'easy', bar: 'bg-depth-4' },
]

function Session({ topic, cards, isLaterRound, onNextRound }: { topic: string; cards: Flashcard[]; isLaterRound: boolean; onNextRound: () => void }) {
  const [reviews, setReviews] = useState(loadReviews)
  const [queue, setQueue] = useState(() => dueQueue(cards, reviews, new Date()))
  const [revealed, setRevealed] = useState(false)
  const [counts, setCounts] = useState<Counts>({ again: 0, hard: 0, good: 0, easy: 0 })
  const rated = counts.again + counts.hard + counts.good + counts.easy
  const card = queue[0]
  const { promptRef, answerRef, doneRef } = useSessionFocus<HTMLHeadingElement, HTMLElement>(rated, revealed, !card, isLaterRound)

  function rate(grade: Grade, count: keyof Counts) {
    setReviews(recordRating(reviews, card.id, grade, new Date()))
    // A card you missed comes round again in this sitting.
    setQueue(grade === Rating.Again ? [...queue.slice(1), card] : queue.slice(1))
    setCounts({ ...counts, [count]: counts[count] + 1 })
    setRevealed(false)
  }

  useShortcuts(
    !card ? {} : revealed ? Object.fromEntries(RATINGS.map(({ key, grade, count }) => [key, () => rate(grade, count)])) : { ' ': () => setRevealed(true), Enter: () => setRevealed(true) },
  )

  if (!card) {
    const now = new Date()
    const next = nextDue(topic, reviews, now)
    const { unseen } = deckStatus(topic, cards.length, reviews, now)
    return (
      <>
        <SessionHeader title="Flashcards" />
        <SessionProgress done={rated} total={rated} label="Cards reviewed" />
        <SessionCard>
          <h1 ref={doneRef} tabIndex={-1} className="font-serif text-2xl leading-snug outline-none sm:text-3xl">
            {rated === 0 ? 'Nothing is due' : 'Session done'}
          </h1>
          {rated > 0 && (
            <>
              <p className="mt-3 text-muted-foreground">
                You did {rated} {rated === 1 ? 'review' : 'reviews'}.
              </p>
              <div className="mt-5">
                <SegmentBar
                  label={`${counts.again} again, ${counts.hard} hard, ${counts.good} good, ${counts.easy} easy`}
                  segments={RATINGS.map(({ count, bar }) => ({
                    count: counts[count],
                    className: bar,
                  }))}
                />
                <p className="mt-2 text-sm text-muted-foreground" aria-hidden="true">
                  {counts.again} again · {counts.hard} hard · {counts.good} good · {counts.easy} easy
                </p>
              </div>
            </>
          )}
          <p className="mt-5 text-muted-foreground">{next ? `The next card is due ${formatUntil(next, now)}.` : 'No cards are scheduled.'}</p>
          {unseen > 0 && (
            <p className="mt-1 text-muted-foreground">
              {unseen} new {unseen === 1 ? 'card' : 'cards'} left.
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            {unseen > 0 && <Button onClick={onNextRound}>Study {Math.min(unseen, NEW_CARDS_PER_SESSION)} more</Button>}
            <Button asChild variant="outline">
              <Link to="/practice">Back to practice</Link>
            </Button>
          </div>
        </SessionCard>
      </>
    )
  }

  const now = new Date()
  const intervals = revealed ? previewIntervals(reviews, card.id, now) : null
  return (
    <>
      <SessionHeader title="Flashcards" status={`${rated + 1} of ${rated + queue.length}`} />
      <SessionProgress done={rated} total={rated + queue.length} label="Cards reviewed" />
      <SessionCard>
        <h1 ref={promptRef} tabIndex={-1} className="font-serif text-2xl leading-snug outline-none sm:text-3xl">
          <InlineHtml html={card.frontHtml} className={CODE_STYLE} />
        </h1>
        {revealed && (
          <>
            <hr className="my-6" />
            <section ref={answerRef} tabIndex={-1} aria-label="Answer" className="font-serif text-lg leading-relaxed outline-none">
              <InlineHtml html={card.backHtml} className={CODE_STYLE} />
            </section>
            <Link to={`/${card.question}`} className="mt-4 self-start text-sm text-link hover:text-link-hover">
              Read the full question
            </Link>
          </>
        )}
      </SessionCard>
      {intervals ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RATINGS.map(({ label, key, grade, count }) => (
            <Button key={label} variant="outline" className="h-auto flex-col gap-0.5 py-2.5" aria-keyshortcuts={key} onClick={() => rate(grade, count)}>
              <span>
                {label}
                <Kbd>{key}</Kbd>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                <span className="sr-only">, next in </span>
                {formatInterval(intervals[grade], now)}
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <Button className="mt-4 w-full sm:w-auto" aria-keyshortcuts="Space" onClick={() => setRevealed(true)}>
          Show answer
          <Kbd>Space</Kbd>
        </Button>
      )}
      <p className="mt-4 hidden text-xs text-muted-foreground sm:block">Space shows the answer · 1–4 rate it</p>
    </>
  )
}

export function FlashcardsPage() {
  const { topic, cards } = useLoaderData<Awaited<ReturnType<typeof loadFlashcards>>>()
  const [round, setRound] = useState(0)
  if (!topic) return <NotFound what="Topic" />

  return (
    <PageShell
      crumbs={[
        { label: 'Practice', to: '/practice' },
        { label: topic.title, to: `/${topic.slug}` },
      ]}
    >
      <title>{`Flashcards: ${topic.title} · ${SITE_NAME}`}</title>
      {cards.length === 0 ? (
        <p className="text-muted-foreground">This topic has no flashcards yet.</p>
      ) : (
        // Keyed so moving between topics, or starting the next round, begins a fresh session.
        <div className="mx-auto max-w-2xl">
          <Session key={`${topic.slug}-${round}`} topic={topic.slug} cards={cards} isLaterRound={round > 0} onNextRound={() => setRound(round + 1)} />
        </div>
      )}
    </PageShell>
  )
}
