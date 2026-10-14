import { LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useManifest } from '@/content/index-data'
import { groupByTrack } from '@/lib/tracks'

/** A header menu to jump to any topic, grouped by track; planned topics are listed and marked. */
export function TopicSwitcher() {
  const navigate = useNavigate()
  const { topics } = useManifest()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} aria-label="Topics" className="px-2.5">
        <LayoutGrid />
        <span className="hidden sm:inline">Topics</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Topics" description="Jump to a topic.">
        <Command>
          <CommandInput placeholder="Find a topic…" />
          <CommandList>
            <CommandEmpty>No topic matches.</CommandEmpty>
            {groupByTrack(topics).map((group) => (
              <CommandGroup key={group.name} heading={group.name}>
                {group.topics.map((topic) => (
                  <CommandItem
                    key={topic.slug}
                    value={`${topic.title} ${topic.slug}`}
                    onSelect={() => {
                      setOpen(false)
                      void navigate(`/${topic.slug}`)
                    }}
                  >
                    {topic.title}
                    {topic.chapterCount === 0 && <span className="ml-auto text-xs text-muted-foreground">Planned</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
