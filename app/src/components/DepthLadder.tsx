const LAYERS = [
  { time: '30 seconds', name: 'The answer you say out loud', detail: 'A short, correct reply with no hedging.' },
  { time: '5 minutes', name: 'The full answer', detail: 'Mechanism, one runnable example, and the mistakes interviewers probe.' },
  { time: 'Follow-ups', name: 'What they ask next', detail: 'The likely second and third questions, answered.' },
  { time: 'Deep dive', name: 'Spec and engine', detail: 'Edge cases and how it works underneath, for the questions that matter most.' },
]

/** The anatomy of every question, drawn as a descent. */
export function DepthLadder() {
  return (
    <figure aria-label="How each question is layered" className="flex gap-4">
      <div aria-hidden="true" className="w-1.5 shrink-0 rounded-full bg-linear-to-b from-depth-from to-depth-to" />
      <ol className="flex flex-col gap-6">
        {LAYERS.map((layer) => (
          <li key={layer.time}>
            <p className="text-sm text-muted-foreground">{layer.time}</p>
            <p className="mt-0.5 font-semibold">{layer.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{layer.detail}</p>
          </li>
        ))}
      </ol>
    </figure>
  )
}
