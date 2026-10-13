import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/content/types'
import { Html } from './Html'

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border">
      <h3 className="border-b px-5 py-3.5 font-semibold">{exercise.title}</h3>
      <div className="px-5 py-4">
        <Html html={exercise.promptHtml} />
      </div>
      <div className="border-t px-5 py-4">
        {revealed ? (
          <>
            <Html html={exercise.answerHtml} />
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setRevealed(false)}>
              Hide answer
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setRevealed(true)}>
            Reveal answer
          </Button>
        )}
      </div>
    </div>
  )
}

export function Exercises({ exercises }: { exercises: Exercise[] }) {
  return (
    <div className="flex flex-col gap-4">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.title} exercise={exercise} />
      ))}
    </div>
  )
}
