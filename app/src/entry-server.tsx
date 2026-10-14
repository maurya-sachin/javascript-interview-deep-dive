// Renders one URL to HTML for the prerender step (scripts/prerender.ts). Not used by the browser bundle.

import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { routes } from './routes.tsx'
import { SITE_URL } from './lib/site.ts'

export interface Rendered {
  html: string
  status: number
}

export async function render(path: string): Promise<Rendered> {
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(new URL(path, SITE_URL)))
  if (context instanceof Response) throw new Error(`${path}: loaders returned a redirect (${context.status}); prerender expects pages`)
  const router = createStaticRouter(handler.dataRoutes, context)
  const html = renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
  )
  return { html, status: context.statusCode }
}
