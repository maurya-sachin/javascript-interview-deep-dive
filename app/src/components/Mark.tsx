/** The isobath mark: nested contour lines, shallow to deep. Draft artwork; a designer redraws the final. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 17c0-8 6-13 13.5-13S29 9 29 16s-5 12-13 12S3 24 3 17Z" opacity=".3" />
      <path d="M6.5 17c0-6 4.5-10 10-10s9 4 9 9-4 9.5-9.5 9.5S6.5 22 6.5 17Z" opacity=".45" />
      <path d="M10 16.5C10 12.5 13 10 16.5 10S23 12.5 23 16s-2.8 6.5-6.5 6.5S10 20.5 10 16.5Z" opacity=".65" />
      <path d="M13.5 16.5c0-2 1.5-3.2 3.2-3.2s3 1.3 3 3-1.3 3.3-3 3.3-3.2-1.2-3.2-3.1Z" opacity=".85" />
      <path d="M15.6 16.6c0-.7.6-1.3 1.2-1.3s1.2.6 1.2 1.3-.5 1.3-1.2 1.3-1.2-.6-1.2-1.3Z" fill="currentColor" />
    </svg>
  )
}
