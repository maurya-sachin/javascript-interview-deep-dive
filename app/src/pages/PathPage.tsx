import { Link, useParams } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { useManifest } from '@/content/index-data'
import { readingHours } from '@/lib/effort'
import { stepPath, stepProgress } from '@/lib/paths'
import { useProgress } from '@/lib/progress'
import { SITE_NAME } from '@/lib/site'
import { cn } from '@/lib/utils'

export function PathPage() {
  const { slug } = useParams()
  const { paths } = useManifest()
  const { read } = useProgress()
  const path = paths.find((candidate) => candidate.slug === slug)
  if (!path) return <NotFound what="Path" />

  const ready = path.steps.filter((step) => step.ready)
  const total = ready.reduce((sum, step) => sum + step.questionCount, 0)
  const done = ready.reduce((sum, step) => sum + stepProgress(step, read).read, 0)
  const next = ready.find((step) => stepProgress(step, read).read < step.questionCount)
  const hours = readingHours(total)

  return (
    <PageShell crumbs={[{ label: 'Paths', to: '/paths' }]} wide>
      <title>{`${path.title} · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">{path.title}</h1>
      <p className="mt-3 max-w-2xl font-serif text-xl leading-relaxed text-muted-foreground">{path.summary}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        {ready.length === 0
          ? 'Roadmap only: nothing on this path is published yet.'
          : `${ready.length} of ${path.steps.length} steps ready · ${total} questions · about ${hours} ${hours === 1 ? 'hour' : 'hours'} of reading${done > 0 ? ` · ${done} read by you` : ''}`}
      </p>
      {next && (
        <Button asChild size="lg" className="mt-5">
          <Link to={stepPath(next)}>{done > 0 ? 'Continue the path' : 'Start the path'}</Link>
        </Button>
      )}

      <ol className="mt-10 border-t">
        {path.steps.map((step, index) => {
          const progress = stepProgress(step, read)
          const label = step.chapterTitle ? `${step.topicTitle}: ${step.chapterTitle}` : step.topicTitle
          return (
            <li key={`${step.topic}/${step.chapter ?? ''}`} className="border-b">
              <Link to={stepPath(step)} className="group grid grid-cols-[2rem_1fr] gap-x-4 gap-y-1 py-4 sm:grid-cols-[2rem_1fr_12rem]">
                <span className="font-mono text-sm text-muted-foreground">{index + 1}</span>
                <span>
                  <span className={cn('block text-lg font-semibold group-hover:text-link', !step.ready && 'text-muted-foreground')}>{label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{step.why}</span>
                </span>
                <span className="col-start-2 text-sm text-muted-foreground sm:col-start-3 sm:text-right">
                  {step.ready ? (
                    <span className={cn(progress.read > 0 && 'text-link')}>
                      {progress.read > 0 ? `${progress.read} of ${progress.total} read` : `${progress.total} questions`}
                    </span>
                  ) : (
                    'Planned'
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </PageShell>
  )
}
