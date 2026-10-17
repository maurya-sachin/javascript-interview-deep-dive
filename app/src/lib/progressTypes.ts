// The reading-progress shape, apart from progress.ts so the Node tests can compile the backup code without browser APIs.

/** The last question opened, so the home page can offer to continue. */
export interface Progress {
  read: readonly string[]
  last: string | null
  /** Title of `last`, kept so the home page can show it without loading the topic. `null` for progress saved before it existed. */
  lastTitleHtml: string | null
}
