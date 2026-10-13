import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ComingSoon } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { loadSearchEngine, type SearchEngine } from '@/content/search'

export function SearchDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState<SearchEngine>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    function toggleOnShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen((isOpen) => !isOpen)
      }
    }
    document.addEventListener('keydown', toggleOnShortcut)
    return () => document.removeEventListener('keydown', toggleOnShortcut)
  }, [])

  useEffect(() => {
    if (!open) return
    loadSearchEngine().then(setEngine, () => setFailed(true))
  }, [open])

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) setQuery('')
  }

  const trimmed = query.trim()
  const results = engine && trimmed ? engine.search(trimmed) : []

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} aria-label="Search questions" className="w-9 px-0 sm:w-64 sm:justify-start sm:px-2.5">
        <Search />
        <span className="hidden flex-1 text-left text-muted-foreground sm:inline">Search questions</span>
        <kbd className="hidden rounded border px-1.5 font-mono text-xs sm:inline">⌘K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange} title="Search questions" description="Find a question by title, tag, or summary.">
        {/* MiniSearch ranks the results, so cmdk's own filtering is off. */}
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search questions…" />
          <CommandList>
            {failed && <p className="py-6 text-center text-sm">Search is unavailable. Run npm run content:build.</p>}
            {!failed && !trimmed && <p className="py-6 text-center text-sm text-muted-foreground">Type to search titles, tags, and summaries.</p>}
            {!failed && trimmed && engine && <CommandEmpty>No questions match “{trimmed}”.</CommandEmpty>}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((doc) => (
                  <CommandItem
                    key={doc.id}
                    value={doc.id}
                    onSelect={() => {
                      handleOpenChange(false)
                      void navigate(`/${doc.id}`)
                    }}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{doc.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.topic} · {doc.chapter}
                      </span>
                    </div>
                    {!doc.hasPage && (
                      <span className="ml-auto">
                        <ComingSoon />
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
