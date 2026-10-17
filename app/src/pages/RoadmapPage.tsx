import { PageShell } from '@/components/PageShell'
import { Roadmap } from '@/components/Roadmap'
import { useManifest } from '@/content/index-data'
import { SITE_NAME } from '@/lib/site'

export function RoadmapPage() {
  const { topics, paths } = useManifest()
  return (
    <PageShell crumbs={[]} wide>
      <title>{`Roadmap · ${SITE_NAME}`}</title>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Roadmap</h1>
      <div className="mt-2">
        <Roadmap topics={topics} paths={paths} />
      </div>
    </PageShell>
  )
}
