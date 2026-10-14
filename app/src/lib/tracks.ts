import type { TopicOverview } from '@/content/types'

/** Home-page order of tracks; a track not listed sorts last. */
const TRACK_ORDER = ['Frontend', 'Backend', 'Infrastructure and delivery', 'Engineering practice']

export interface TrackGroup {
  name: string
  topics: TopicOverview[]
}

/** Groups topics by track, with topics that already have chapters ahead of planned ones. */
export function groupByTrack(topics: TopicOverview[]): TrackGroup[] {
  const names = [...new Set(topics.map((topic) => topic.track))].sort((a, b) => rank(a) - rank(b))
  return names.map((name) => ({
    name,
    topics: topics.filter((topic) => topic.track === name).sort((a, b) => Number(b.chapterCount > 0) - Number(a.chapterCount > 0)),
  }))
}

function rank(track: string): number {
  const position = TRACK_ORDER.indexOf(track)
  return position === -1 ? TRACK_ORDER.length : position
}
