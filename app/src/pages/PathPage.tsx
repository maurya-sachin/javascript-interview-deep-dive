import { Link, useParams } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import { RouteLine } from '@/components/RouteLine'
import { Button } from '@/components/ui/button'
import { useManifest } from '@/content/index-data'
import { readingHours } from '@/lib/effort'
import { stepPath, stepProgress, stepState } from '@/lib/paths'
import { useProgress } from '@/lib/progress'
import { SITE_NAME } from '@/lib/site'

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
  const stations = path.steps.map((step) => {
    const progress = stepProgress(step, read)
    const status = !step.ready ? 'Planned' : progress.read > 0 ? `${progress.read} of ${progress.total} read` : `${progress.total} questions`
    return {
      key: `${step.topic}/${step.chapter ?? ''}`,
      label: step.chapterTitle ? `${step.topicTitle}: ${step.chapterTitle}` : step.topicTitle,
      to: stepPath(step),
      state: stepState(step, read),
      current: step === next,
      detail: `${step.why} · ${status}`,
    }
  })

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

      <div className="mt-10 max-w-2xl">
        <RouteLine orientation="vertical" stations={stations} />
      </div>
    </PageShell>
  )
}
