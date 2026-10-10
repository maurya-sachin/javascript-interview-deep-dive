import { Link, Outlet, ScrollRestoration } from 'react-router'
import { SearchDialog } from '@/components/SearchDialog'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Layout() {
  return (
    <>
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2.5 font-bold">
          <span className="grid size-7 place-items-center rounded-md bg-foreground font-mono text-sm text-background">{'{ }'}</span>
          Deep Dive
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
