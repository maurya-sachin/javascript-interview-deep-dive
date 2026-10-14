import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/Kbd'
import { SessionProgress } from '@/components/SessionProgress'
import { SITE_NAME } from '@/lib/site'
import { formatUntil } from '@/lib/time'
import { useSessionFocus } from '@/lib/useSessionFocus'
import { useShortcuts } from '@/lib/useShortcuts'
import type { loadFlashcards } from '@/content/index-data'
import { deckStatus, dueQueue, loadReviews, NEW_CARDS_PER_SESSION, nextDue, rateCard } from '@/content/review'
import type { Flashcard } from '@/content/types'
import { Rating, type Grade } from 'ts-fsrs'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

type Counts = Record<'again' | 'hard' | 'good' | 'easy', number>
const RATINGS: { label: string; key: string; grade: Grade; count: keyof Counts }[] = [
  { label: 'Again', key: '1', grade: Rating.Again, count: 'again' },
  { label: 'Hard', key: '2', grade: Rating.Hard, count: 'hard' },
  { label: 'Good', key: '3', grade: Rating.Good, count: 'good' },
  { label: 'Easy', key: '4', grade: Rating.Easy, count: 'easy' },
]

function Session({ topic, cards, isLaterRound, onNextRound }: { topic: string; cards: Flashcard[]; isLaterRound: boolean; onNextRound: () => void }) {
  const [reviews, setReviews] = useState(loadReviews)
  const [queue, setQueue] = useState(() => dueQueue(cards, reviews, new Date()))
  const [revealed, setRevealed] = useState(false)
  const [counts, setCounts] = useState<Counts>({ again: 0, hard: 0, good: 0, easy: 0 })
  const rated = counts.again + counts.hard + counts.good + counts.easy
  const card = queue[0]
  const { promptRef, answerRef, doneRef } = useSessionFocus<HTMLParagraphElement, HTMLElement>(rated, revealed, !card, isLaterRound)

  function rate(grade: Grade, count: keyof Counts) {
    setReviews(rateCard(reviews, card.id, grade, new Date()))
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
        <h1 ref={doneRef} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
          {rated === 0 ? 'Nothing is due' : 'Session done'}
        </h1>
        {rated > 0 && (
          <p className="mt-3 text-muted-foreground">
            You did {rated} {rated === 1 ? 'review' : 'reviews'}: {counts.again} again, {counts.hard} hard, {counts.good} good, {counts.easy} easy.
          </p>
        )}
        <p className="mt-3 text-muted-foreground">{next ? `The next card is due ${formatUntil(next, new Date())}.` : 'No cards are scheduled.'}</p>
        {unseen > 0 && <p className="mt-3 text-muted-foreground">{unseen} new {unseen === 1 ? 'card' : 'cards'} left.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {unseen > 0 && <Button onClick={onNextRound}>Study {Math.min(unseen, NEW_CARDS_PER_SESSION)} more</Button>}
          <Button asChild variant="outline">
            <Link to="/practice">Back to practice</Link>
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <SessionProgress done={rated} total={rated + queue.length} label="Cards reviewed" />
      <p className="mt-2 font-mono text-sm text-muted-foreground" aria-live="polite">
        {queue.length} left
      </p>
      <p ref={promptRef} tabIndex={-1} className="mt-4 text-2xl leading-snug font-semibold outline-none">
        <InlineHtml html={card.frontHtml} className={CODE_STYLE} />
      </p>
      {revealed ? (
        <>
          <section ref={answerRef} tabIndex={-1} aria-label="Answer" className="mt-6 rounded-xl bg-tldr px-6 py-5 text-lg leading-relaxed outline-none">
            <InlineHtml html={card.backHtml} className={CODE_STYLE} />
          </section>
          {card.question && (
            <Link to={`/${card.question}`} className="mt-4 inline-block text-link hover:text-link-hover">
              Read the full question
            </Link>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {RATINGS.map(({ label, key, grade, count }) => (
              <Button key={label} variant="outline" aria-keyshortcuts={key} onClick={() => rate(grade, count)}>
                {label}
                <Kbd>{key}</Kbd>
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button className="mt-8" aria-keyshortcuts="Space" onClick={() => setRevealed(true)}>
          Show answer
          <Kbd>Space</Kbd>
        </Button>
      )}
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
        <Session key={`${topic.slug}-${round}`} topic={topic.slug} cards={cards} isLaterRound={round > 0} onNextRound={() => setRound(round + 1)} />
      )}
    </PageShell>
  )
}
