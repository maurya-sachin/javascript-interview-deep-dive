import { useState } from 'react'
import { Link } from 'react-router'
import { PageShell } from '@/components/PageShell'
import { ProgressBackup } from '@/components/ProgressBackup'
import { useManifest } from '@/content/index-data'
import { deckStatus, loadReviews } from '@/content/review'
import { SITE_NAME } from '@/lib/site'

export function PracticeHubPage() {
  const { topics } = useManifest()
  const [reviews, setReviews] = useState(loadReviews)
  const practisable = topics.filter((topic) => topic.stats.readable > 0)
  const decks = topics.filter((topic) => topic.flashcardCount > 0)
  const now = new Date()

  return (
    <PageShell crumbs={[]} wide>
      <title>{`Practice · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Practice</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Answer questions out loud before you reveal the answer, or review flashcards when they are due.</p>

      <section aria-labelledby="practice-questions" className="mt-10">
        <h2 id="practice-questions" className="font-serif text-2xl font-medium tracking-tight">
          Questions
        </h2>
        {practisable.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            Nothing is published to practise yet. <Link to="/roadmap" className="text-link hover:text-link-hover">See the roadmap</Link>
          </p>
        ) : (
          <ul className="mt-4 border-t">
            {practisable.map((topic) => (
              <li key={topic.slug} className="border-b">
                <Link to={`/practice/${topic.slug}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-link">
                  <span className="text-lg font-semibold">{topic.title}</span>
                  <span className="text-sm text-muted-foreground">{topic.stats.readable} questions</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="flashcards" aria-labelledby="practice-flashcards" className="mt-12">
        <h2 id="practice-flashcards" className="font-serif text-2xl font-medium tracking-tight">
          Flashcards
        </h2>
        {decks.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No flashcard decks yet.</p>
        ) : (
          <ul className="mt-4 border-t">
            {decks.map((topic) => {
              const { due, unseen } = deckStatus(topic.slug, topic.flashcardCount, reviews, now)
              return (
                <li key={topic.slug} className="border-b">
                  <Link to={`/flashcards/${topic.slug}`} className="flex items-baseline justify-between gap-4 py-4 hover:text-link">
                    <span className="text-lg font-semibold">{topic.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {due > 0 ? `${due} due` : 'Nothing due'}
                      {unseen > 0 && `, ${unseen} new`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ProgressBackup onImported={setReviews} />
    </PageShell>
  )
}
