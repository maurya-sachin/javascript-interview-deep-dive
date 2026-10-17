// The planned structure of a topic, read from its README's `## Not yet mapped` list (R11, R12).

/** Each `- Area: details` or `- Area (details)` item gives its area name as inline Markdown; a bare item is taken whole. */
export function plannedAreas(readme: string): string[] {
  const section = readme.split(/^## Not yet mapped[ \t]*$/m)[1]?.split(/^## /m)[0] ?? ''
  return [...section.matchAll(/^- (.+)$/gm)].map(([, item]) => item.split(/: | \(/)[0].trim())
}
