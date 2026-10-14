// The four-stop depth scale (`--depth-1..4` in index.css): 1 is the 30-second answer, 4 the spec and engine.

// Literal class names so Tailwind generates them.
const DEPTH_STROKE = ['stroke-depth-1', 'stroke-depth-2', 'stroke-depth-3', 'stroke-depth-4'] as const

/** The stroke class for contour `level` (0-based) of `levels`: the first level is the shallowest stop, the last the deepest. */
export function depthStrokeClass(level: number, levels: number): (typeof DEPTH_STROKE)[number] {
  const deepest = DEPTH_STROKE.length - 1
  return DEPTH_STROKE[levels <= 1 ? deepest : Math.round((level * deepest) / (levels - 1))]
}
