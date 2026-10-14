import { Link, Outlet, ScrollRestoration } from 'react-router'
import { Mark } from '@/components/Mark'
import { SearchDialog } from '@/components/SearchDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AUTHOR, AUTHOR_URL, SITE_NAME } from '@/lib/site'

export function Layout() {
  return (
    <>
      <header className="flex items-center gap-4 border-b bg-background/85 px-6 py-3 backdrop-blur">
        <div className="flex items-baseline gap-2.5">
          <Link to="/" className="flex items-center gap-2 text-link">
            <Mark className="size-7 self-center" />
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">{SITE_NAME}</span>
          </Link>
          <a href={AUTHOR_URL} className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline">
            by {AUTHOR}
          </a>
        </div>
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
