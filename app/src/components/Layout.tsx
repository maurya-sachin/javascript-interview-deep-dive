import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import { Mark } from '@/components/Mark'
import { SearchDialog } from '@/components/SearchDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TopicSwitcher } from '@/components/TopicSwitcher'
import { REPO_URL } from '@/lib/repo'
import { AUTHOR, AUTHOR_URL, SITE_NAME } from '@/lib/site'
import { cn } from '@/lib/utils'

const MAIN_LINKS = [
  { to: '/paths', label: 'Paths' },
  { to: '/practice', label: 'Practice' },
  { to: '/roadmap', label: 'Roadmap' },
]

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
        <div className="flex items-center gap-1">
          <TopicSwitcher />
          <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
            {MAIN_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('rounded-md px-2.5 py-1.5 hover:text-foreground', isActive ? 'font-medium text-foreground' : 'text-muted-foreground')}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
      <footer className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-6 py-6 text-sm text-muted-foreground">
        <span>
          {SITE_NAME}, by{' '}
          <a href={AUTHOR_URL} className="text-link hover:text-link-hover">
            {AUTHOR}
          </a>
        </span>
        <Link to="/changelog" className="text-link hover:text-link-hover">
          Changelog
        </Link>
        <a href={REPO_URL} className="text-link hover:text-link-hover">
          GitHub
        </a>
      </footer>
      <ScrollRestoration />
    </>
  )
}
