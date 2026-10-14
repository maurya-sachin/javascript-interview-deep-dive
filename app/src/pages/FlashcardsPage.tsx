import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/Kbd'
import { SessionProgress } from '@/components/SessionProgress'
import { SITE_NAME } from '@/lib/site'
import { formatUntil } from '@/lib/time'
import { useShortcuts } from '@/lib/useShortcuts'
import type { loadFlashcards } from '@/content/index-data'
import { dueQueue, loadReviews, nextDue, rateCard } from '@/content/review'
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

function Session({ topic, cards }: { topic: string; cards: Flashcard[] }) {
  const [reviews, setReviews] = useState(loadReviews)
  const [queue, setQueue] = useState(() => dueQueue(cards, reviews, new Date()))
  const [revealed, setRevealed] = useState(false)
  const [counts, setCounts] = useState<Counts>({ again: 0, hard: 0, good: 0, easy: 0 })
  const rated = counts.again + counts.hard + counts.good + counts.easy
  const card = queue[0]

  function rate(grade: Grade, count: keyof Counts) {
    if (!card || !revealed) return // a second key press before re-render
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
    const next = nextDue(topic, reviews, new Date())
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight">{rated === 0 ? 'Nothing is due' : 'Session done'}</h1>
        {rated > 0 && (
          <p className="mt-3 text-muted-foreground">
            You reviewed {rated} {rated === 1 ? 'card' : 'cards'}: {counts.again} again, {counts.hard} hard, {counts.good} good, {counts.easy} easy.
          </p>
        )}
        <p className="mt-3 text-muted-foreground">{next ? `The next card is due ${formatUntil(next, new Date())}.` : 'No cards are scheduled.'}</p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/practice">Back to practice</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <SessionProgress done={rated} total={rated + queue.length} label="Cards reviewed" />
      <p className="mt-2 font-mono text-sm text-muted-foreground" aria-live="polite">
        {queue.length} left
      </p>
      <p className="mt-4 text-2xl leading-snug font-semibold">
        <InlineHtml html={card.frontHtml} className={CODE_STYLE} />
      </p>
      {revealed ? (
        <>
          <p className="mt-6 rounded-xl bg-tldr px-6 py-5 text-lg leading-relaxed">
            <InlineHtml html={card.backHtml} className={CODE_STYLE} />
          </p>
          {card.question && (
            <Link to={`/${card.question}`} className="mt-4 inline-block text-link hover:text-link-hover">
              Read the full question
            </Link>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {RATINGS.map(({ label, key, grade, count }) => (
              <Button key={label} variant="outline" onClick={() => rate(grade, count)}>
                {label}
                <Kbd>{key}</Kbd>
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button className="mt-8" onClick={() => setRevealed(true)}>
          Show answer
          <Kbd>Space</Kbd>
        </Button>
      )}
    </>
  )
}

export function FlashcardsPage() {
  const { topic, cards } = useLoaderData<Awaited<ReturnType<typeof loadFlashcards>>>()
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
        // Keyed so moving between topics starts a fresh session.
        <Session key={topic.slug} topic={topic.slug} cards={cards} />
      )}
    </PageShell>
  )
}
