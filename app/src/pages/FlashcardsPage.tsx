import { useState } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { InlineHtml } from '@/components/question/InlineHtml'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { findTopic, useContentIndex } from '@/content/index-data'
import { dueQueue, loadReviews, rateCard } from '@/content/review'
import type { Flashcard } from '@/content/types'
import { Rating, type Grade } from 'ts-fsrs'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

const RATINGS: { label: string; grade: Grade }[] = [
  { label: 'Again', grade: Rating.Again },
  { label: 'Hard', grade: Rating.Hard },
  { label: 'Good', grade: Rating.Good },
  { label: 'Easy', grade: Rating.Easy },
]

function Session({ cards }: { cards: Flashcard[] }) {
  const [reviews, setReviews] = useState(loadReviews)
  const [queue, setQueue] = useState(() => dueQueue(cards, reviews, new Date()))
  const [revealed, setRevealed] = useState(false)

  if (queue.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight">All caught up</h1>
        <p className="mt-3 text-muted-foreground">No cards are due. Come back later.</p>
      </>
    )
  }

  const [card, ...rest] = queue

  function rate(grade: Grade) {
    setReviews(rateCard(reviews, card.id, grade, new Date()))
    // A card you missed comes round again in this sitting.
    setQueue(grade === Rating.Again ? [...rest, card] : rest)
    setRevealed(false)
  }

  return (
    <>
      <p className="font-mono text-sm text-muted-foreground" aria-live="polite">
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
              Read the full question →
            </Link>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {RATINGS.map(({ label, grade }) => (
              <Button key={label} variant="outline" onClick={() => rate(grade)}>
                {label}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button className="mt-8" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}
    </>
  )
}

export function FlashcardsPage() {
  const params = useParams()
  const cards = useLoaderData<Flashcard[]>()
  const topic = findTopic(useContentIndex(), params.topic)
  if (!topic) return <NotFound what="Topic" />

  return (
    <PageShell
      crumbs={[
        { label: 'Topics', to: '/' },
        { label: topic.title, to: `/${topic.slug}` },
      ]}
    >
      <title>{`Flashcards: ${topic.title} · Deep Dive`}</title>
      {cards.length === 0 ? (
        <p className="text-muted-foreground">This topic has no flashcards yet.</p>
      ) : (
        // Keyed so moving between topics starts a fresh session.
        <Session key={topic.slug} cards={cards} />
      )}
    </PageShell>
  )
}
