import { Link, useParams } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { findTopic, questionCount, useContentIndex } from '@/content/index-data'

export function TopicPage() {
  const topic = findTopic(useContentIndex(), useParams().topic)
  if (!topic) return <NotFound what="Topic" />

  return (
    <PageShell crumbs={[{ label: 'Topics', to: '/' }]}>
      <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
      {topic.flashcardCount > 0 && (
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/flashcards/${topic.slug}`}>Flashcards · {topic.flashcardCount} cards</Link>
        </Button>
      )}
      {topic.chapters.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Chapters for this topic are planned.</p>
      ) : (
        <ol className="mt-6 divide-y rounded-xl border">
          {topic.chapters.map((chapter) => {
            const { published, total } = questionCount([chapter])
            return (
              <li key={chapter.slug}>
                <Link
                  to={`/${topic.slug}/${chapter.slug}`}
                  className="flex items-baseline gap-4 px-5 py-4 hover:bg-muted"
                >
                  <span className="font-mono text-xs text-muted-foreground">{chapter.number}</span>
                  <span className="flex-1 font-medium">{chapter.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {published}/{total}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </PageShell>
  )
}
