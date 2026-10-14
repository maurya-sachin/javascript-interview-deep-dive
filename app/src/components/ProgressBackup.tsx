import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { loadReviews, saveReviews, type Reviews } from '@/content/review'
import { createBackup, mergeBackup, parseBackup } from '@/lib/backup'
import { replaceProgress, useProgress } from '@/lib/progress'

/** Download and restore the learner's progress; this browser is the only place it is kept. */
export function ProgressBackup({ onImported }: { onImported: (reviews: Reviews) => void }) {
  const progress = useProgress()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  function download() {
    const now = new Date()
    const blob = new Blob([JSON.stringify(createBackup(progress, loadReviews(), now), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `isobath-progress-${now.toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Progress downloaded.')
  }

  async function restore(file: File) {
    try {
      const merged = mergeBackup({ progress, reviews: loadReviews() }, parseBackup(await file.text()))
      replaceProgress(merged.progress)
      saveReviews(merged.reviews)
      onImported(merged.reviews)
      const read = merged.progress.read.length
      const reviewed = Object.keys(merged.reviews).length
      setMessage(`Progress imported: ${read} ${read === 1 ? 'question' : 'questions'} read, ${reviewed} ${reviewed === 1 ? 'card' : 'cards'} reviewed.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The file could not be read.')
    }
  }

  return (
    <section aria-labelledby="your-progress" className="mt-16 border-t pt-10">
      <h2 id="your-progress" className="font-serif text-2xl font-medium tracking-tight">
        Your progress
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">Reading progress and flashcard history live only in this browser. Download a copy to keep it, or to move it to another device; importing adds to what is here.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" onClick={download}>
          Download progress
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          Import progress
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = '' // so choosing the same file again still fires
            if (file) void restore(file)
          }}
        />
      </div>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {message}
      </p>
    </section>
  )
}
