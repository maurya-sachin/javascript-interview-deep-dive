import { PageShell } from '@/components/PageShell'
import { Roadmap, RoadmapSummary } from '@/components/Roadmap'
import { DiagramLegend } from '@/components/RouteDiagram'
import { useManifest } from '@/content/index-data'
import { SITE_NAME } from '@/lib/site'

export function RoadmapPage() {
  const { topics, paths } = useManifest()
  return (
    <PageShell crumbs={[]} wide>
      <title>{`Roadmap · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Roadmap</h1>
      <div className="mt-2">
        <RoadmapSummary topics={topics} />
      </div>
      <DiagramLegend className="mt-5" />
      <div className="mt-10">
        <Roadmap topics={topics} paths={paths} />
      </div>
    </PageShell>
  )
}
