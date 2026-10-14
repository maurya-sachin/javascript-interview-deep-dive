import { Link } from 'react-router'
import { PageShell } from '@/components/PageShell'
import { ProgressBackup } from '@/components/ProgressBackup'
import { TopicCover } from '@/components/TopicCover'
import { Button } from '@/components/ui/button'
import { useManifest } from '@/content/index-data'
import { deckStatus, NEW_CARDS_PER_SESSION, nextDue, type Reviews } from '@/content/review'
import { useReviews } from '@/content/reviewStore'
import type { TopicOverview } from '@/content/types'
import { SITE_NAME } from '@/lib/site'
import { formatUntil } from '@/lib/time'

interface Deck {
  topic: TopicOverview
  due: number
  unseen: number
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

/** What to study next across every deck: cards due first, then cards never seen, else when the next one comes due. */
function NextUp({ decks, reviews, now }: { decks: Deck[]; reviews: Reviews; now: Date }) {
  const totalDue = decks.reduce((sum, { due }) => sum + due, 0)
  const totalNew = decks.reduce((sum, { unseen }) => sum + unseen, 0)
  const mostDue = decks.reduce((best, deck) => (deck.due > best.due ? deck : best), decks[0])
  const mostNew = decks.reduce((best, deck) => (deck.unseen > best.unseen ? deck : best), decks[0])
  // The server renders with no review history, so only look for a next due time once there is some.
  const soonest =
    Object.keys(reviews).length === 0
      ? null
      : decks.flatMap(({ topic }) => nextDue(topic.slug, reviews, now) ?? []).sort((a, b) => a.getTime() - b.getTime())[0]

  return (
    <section aria-labelledby="next-up" className="mt-8 rounded-xl border bg-card p-6">
      {totalDue > 0 ? (
        <>
          <h2 id="next-up" className="font-serif text-2xl leading-snug">
            {plural(totalDue, 'flashcard')} due
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {decks
              .filter(({ due }) => due > 0)
              .map(({ topic, due }) => `${topic.title}: ${due} due`)
              .join(' · ')}
          </p>
          <Button asChild className="mt-5">
            <Link to={`/flashcards/${mostDue.topic.slug}`}>Review now</Link>
          </Button>
        </>
      ) : totalNew > 0 ? (
        <>
          <h2 id="next-up" className="font-serif text-2xl leading-snug">
            {totalNew} new {totalNew === 1 ? 'flashcard' : 'flashcards'} to start
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Each session introduces up to {NEW_CARDS_PER_SESSION} new cards.</p>
          <Button asChild className="mt-5">
            <Link to={`/flashcards/${mostNew.topic.slug}`}>Start with {NEW_CARDS_PER_SESSION}</Link>
          </Button>
        </>
      ) : (
        <>
          <h2 id="next-up" className="font-serif text-2xl leading-snug">
            Nothing is due
          </h2>
          {soonest && <p className="mt-2 text-sm text-muted-foreground">The next card is due {formatUntil(soonest, now)}.</p>}
        </>
      )}
    </section>
  )
}

export function PracticeHubPage() {
  const { topics } = useManifest()
  const reviews = useReviews()
  const practisable = topics.filter((topic) => topic.stats.readable > 0)
  const now = new Date()
  const decks: Deck[] = topics
    .filter((topic) => topic.flashcardCount > 0)
    .map((topic) => ({ topic, ...deckStatus(topic.slug, topic.flashcardCount, reviews, now) }))

  return (
    <PageShell crumbs={[]} wide>
      <title>{`Practice · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Practice</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Answer questions out loud before you reveal the answer, or review flashcards when they are due.</p>

      {decks.length > 0 && <NextUp decks={decks} reviews={reviews} now={now} />}

      <section aria-labelledby="practice-questions" className="mt-12">
        <h2 id="practice-questions" className="font-serif text-2xl font-medium tracking-tight">
          Questions
        </h2>
        {practisable.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            Nothing is published to practise yet. <Link to="/roadmap" className="text-link hover:text-link-hover">See the roadmap</Link>
          </p>
        ) : (
          <ul className="mt-4 border-t">
            {practisable.map(({ slug, title, chapterCount, stats }) => (
              <li key={slug} className="border-b">
                <Link to={`/practice/${slug}`} className="flex items-center gap-4 py-4 hover:text-link">
                  <TopicCover slug={slug} chapterCount={chapterCount} hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total} className="size-12 shrink-0 rounded-md bg-muted" />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {plural(stats.readable, 'question')} in {plural(chapterCount, 'chapter')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="flashcards" aria-labelledby="practice-flashcards" className="mt-12">
        <h2 id="practice-flashcards" className="font-serif text-2xl font-medium tracking-tight">
          Flashcard decks
        </h2>
        {decks.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No flashcard decks yet.</p>
        ) : (
          <ul className="mt-4 border-t">
            {decks.map(({ topic, due, unseen }) => (
              <li key={topic.slug} className="border-b">
                <Link to={`/flashcards/${topic.slug}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-link">
                  <span className="font-semibold">{topic.title}</span>
                  <span className="text-sm text-muted-foreground">{[due > 0 && `${due} due`, unseen > 0 && `${unseen} new`].filter(Boolean).join(', ') || 'Nothing due'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProgressBackup />
    </PageShell>
  )
}
