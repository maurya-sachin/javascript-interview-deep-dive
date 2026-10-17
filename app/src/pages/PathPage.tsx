import { Link, useParams } from 'react-router'
import { NotFound, PageShell } from '@/components/PageShell'
import { DiagramLegend, RouteDiagram, type DiagramNode } from '@/components/RouteDiagram'
import { Button } from '@/components/ui/button'
import { useManifest } from '@/content/index-data'
import { topicBranches } from '@/lib/diagram'
import { readingHours } from '@/lib/effort'
import { describePath, readyQuestionCount, stepKey, stepLabel, stepPath, stepProgress } from '@/lib/paths'
import { useProgress } from '@/lib/progress'
import { SITE_NAME } from '@/lib/site'

export function PathPage() {
  const { slug } = useParams()
  const { paths, topics } = useManifest()
  const { read } = useProgress()
  const path = paths.find((candidate) => candidate.slug === slug)
  if (!path) return <NotFound what="Path" />

  const ready = path.steps.filter((step) => step.ready)
  const total = readyQuestionCount(path)
  const done = ready.reduce((sum, step) => sum + stepProgress(step, read).read, 0)
  const next = ready.find((step) => stepProgress(step, read).read < step.questionCount)
  const hours = readingHours(total)
  const nodes = path.steps.map((step, index): DiagramNode => {
    const progress = stepProgress(step, read)
    const topic = topics.find((candidate) => candidate.slug === step.topic)
    return {
      key: stepKey(step),
      index: String(index + 1).padStart(2, '0'),
      title: stepLabel(step),
      to: stepPath(step),
      meta: !step.ready ? (step.started ? 'In progress' : 'Planned') : progress.read > 0 ? `${progress.read} of ${progress.total} read` : `${progress.total} questions`,
      note: step.why,
      planned: !step.ready,
      current: step === next,
      // A step that names one chapter is that chapter; a topic step branches into the topic's chapters.
      branches: step.chapter || !topic ? [] : topicBranches(topic, read),
    }
  })

  return (
    <PageShell crumbs={[{ label: 'Paths', to: '/paths' }]} wide>
      <title>{`${path.title} · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">{path.title}</h1>
      <p className="mt-3 max-w-2xl font-serif text-xl leading-relaxed text-muted-foreground">{path.summary}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        {ready.length === 0
          ? `${describePath(path)}.`
          : `${ready.length} of ${path.steps.length} steps ready · ${total} questions · about ${hours} ${hours === 1 ? 'hour' : 'hours'} of reading${done > 0 ? ` · ${done} read by you` : ''}`}
      </p>
      {next && (
        <Button asChild size="lg" className="mt-5">
          <Link to={stepPath(next)}>{done > 0 ? 'Continue the path' : 'Start the path'}</Link>
        </Button>
      )}

      <DiagramLegend className="mt-6" />
      <div className="mt-6">
        <RouteDiagram nodes={nodes} label={`${path.title} path`} />
      </div>
    </PageShell>
  )
}
