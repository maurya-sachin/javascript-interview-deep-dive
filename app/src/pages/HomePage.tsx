import { Link } from 'react-router'
import { DifficultyMix } from '@/components/DifficultyMix'
import { PageShell } from '@/components/PageShell'
import { InlineHtml } from '@/components/question/InlineHtml'
import { QuestionTitle } from '@/components/QuestionTitle'
import { Roadmap } from '@/components/Roadmap'
import { RoleList } from '@/components/RoleList'
import { StrataFigure } from '@/components/StrataFigure'
import { TopicCover } from '@/components/TopicCover'
import { Button } from '@/components/ui/button'
import { questionPath, useManifest } from '@/content/index-data'
import type { TopicOverview } from '@/content/types'
import { useProgress } from '@/lib/progress'
import { SITE_NAME, TAGLINE } from '@/lib/site'

const INLINE_CODE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function HomePage() {
  const { topics, paths } = useManifest()
  const { last, lastTitleHtml } = useProgress()
  const available = topics.filter((topic) => topic.chapterCount > 0)
  const start = paths.find((path) => path.start)?.start ?? null
  const lastQuestion = last && lastTitleHtml ? { id: last, titleHtml: lastTitleHtml } : null

  return (
    <PageShell crumbs={[]} wide>
      <title>{`${SITE_NAME}: ${TAGLINE}`}</title>
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h1 className="font-serif text-[2.75rem] leading-[1.05] font-medium tracking-[-0.025em] sm:text-6xl">Engineering interviews, in depth.</h1>
          <p className="mt-5 max-w-lg font-serif text-xl leading-relaxed text-muted-foreground">
            Every question opens with the answer you would give in the room, then goes down to the mechanism, the edge cases, and the spec or engine underneath.
          </p>
          <h2 className="mt-9 mb-1 text-sm font-semibold">What are you preparing as?</h2>
          <RoleList paths={paths} />
          {lastQuestion && (
            <Link to={questionPath(lastQuestion)} className="group mt-8 flex max-w-lg items-baseline gap-3 border-l-2 border-link pl-4">
              <span>
                <span className="block text-sm text-muted-foreground">Continue where you left off</span>
                <span className="block font-medium group-hover:text-link">
                  <QuestionTitle html={lastQuestion.titleHtml} />
                </span>
              </span>
            </Link>
          )}
        </div>
        <StrataFigure className="max-lg:order-first" />
      </section>

      {start && (
        <section className="mt-20 grid gap-10 border-t pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16" aria-labelledby="start-here">
          <div>
            <h2 id="start-here" className="font-serif text-3xl font-medium tracking-tight">
              Start here
            </h2>
            <p className="mt-2 text-muted-foreground">If you read one question first, read this one. It sets up the vocabulary the rest of the language uses.</p>
            <p className="mt-6 font-serif text-3xl leading-tight font-medium tracking-tight">
              <QuestionTitle html={start.titleHtml} />
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to={questionPath(start)}>Read the question</Link>
            </Button>
          </div>
          <div className="rounded-r-xl border-l-4 border-link bg-tldr py-5 pr-6 pl-6 text-tldr-foreground">
            <p className="text-sm font-medium">30-second answer</p>
            <InlineHtml html={start.tldrHtml} className={`mt-2 block font-serif text-xl leading-snug text-foreground ${INLINE_CODE}`} />
          </div>
        </section>
      )}

      <section className="mt-20 border-t pt-12" aria-labelledby="available">
        <h2 id="available" className="font-serif text-3xl font-medium tracking-tight">
          Available now
        </h2>
        <p className="mt-2 text-muted-foreground">Written and researched against primary sources.</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {available.map((topic) => (
            <AvailableTopic key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>

      <section className="mt-20 border-t pt-12" aria-labelledby="roadmap">
        <h2 id="roadmap" className="font-serif text-3xl font-medium tracking-tight">
          Roadmap
        </h2>
        <div className="mt-2">
          <Roadmap topics={topics} />
        </div>
      </section>
    </PageShell>
  )
}

function AvailableTopic({ topic }: { topic: TopicOverview }) {
  const { stats } = topic
  return (
    <Link to={`/${topic.slug}`} className="group grid grid-cols-[7.5rem_1fr] gap-5">
      <TopicCover slug={topic.slug} chapterCount={topic.chapterCount} hardShare={stats.total === 0 ? 0 : stats.byDifficulty.hard / stats.total} className="size-30 rounded-md bg-muted" />
      <span>
        <span className="block font-serif text-2xl leading-tight font-medium group-hover:text-link">{topic.title}</span>
        <InlineHtml html={topic.summaryHtml} className={`mt-1 mb-3 line-clamp-2 block text-sm text-muted-foreground ${INLINE_CODE}`} />
        <DifficultyMix counts={stats.byDifficulty} className="max-w-64" />
        <span className="mt-2 block text-xs text-muted-foreground">
          {stats.total} questions{topic.flashcardCount > 0 && ` · ${topic.flashcardCount} flashcards`}
        </span>
      </span>
    </Link>
  )
}
