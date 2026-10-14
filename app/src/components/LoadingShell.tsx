/** Shown while the first data loads on pages served from the app shell (no prerendered markup to hydrate). */
export function LoadingShell() {
  return <div aria-busy="true" className="min-h-screen" />
}
