import { Link, Outlet, ScrollRestoration } from 'react-router'
import { SearchDialog } from '@/components/SearchDialog'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Layout() {
  return (
    <>
      <header className="flex items-center gap-4 border-b bg-background/85 px-6 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span aria-hidden="true" className="size-7 rounded-md bg-linear-to-b from-depth-from to-depth-to" />
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
