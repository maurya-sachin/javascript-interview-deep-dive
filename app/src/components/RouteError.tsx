import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'

/** Shown in place of a page whose data failed to load, for instance when a topic's file can't be fetched. */
export function RouteError() {
  return (
    <PageShell crumbs={[]}>
      <h1 className="text-2xl font-bold">Couldn't load this page</h1>
      <p className="mt-2 text-muted-foreground">Check your connection, then reload.</p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </PageShell>
  )
}
