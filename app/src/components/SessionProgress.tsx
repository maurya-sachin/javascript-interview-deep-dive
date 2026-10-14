/** How far through a session the reader is, filled down the depth scale. */
export function SessionProgress({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-linear-to-r from-depth-1 to-depth-4 transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%` }} />
    </div>
  )
}
