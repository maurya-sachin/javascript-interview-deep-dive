import { Link, Outlet, ScrollRestoration } from 'react-router'
import { Mark } from '@/components/Mark'
import { SearchDialog } from '@/components/SearchDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TopicSwitcher } from '@/components/TopicSwitcher'
import { REPO_URL } from '@/lib/repo'
import { AUTHOR, AUTHOR_URL, SITE_NAME } from '@/lib/site'

export function Layout() {
  return (
    <>
      <header className="flex items-center gap-4 border-b bg-background/85 px-6 py-3 backdrop-blur">
        <div className="flex items-baseline gap-2.5">
          <Link to="/" className="flex items-baseline gap-2 text-link">
            <Mark className="size-7 self-center" />
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">{SITE_NAME}</span>
          </Link>
          <a href={AUTHOR_URL} className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline">
            by {AUTHOR}
          </a>
        </div>
        <TopicSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
      <footer className="mt-16 border-t px-6 py-6 text-sm text-muted-foreground">
        {SITE_NAME}, by {AUTHOR}. Questions are CC BY-NC-SA 4.0; code is MIT.{' '}
        <a href={REPO_URL} className="text-link hover:text-link-hover">
          GitHub
        </a>
      </footer>
      <ScrollRestoration />
    </>
  )
}
