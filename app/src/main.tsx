import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { routes } from './routes.tsx'

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
const root = document.getElementById('root')!
// Prerendered pages arrive with markup to hydrate; the dev server and the app shell arrive with only a placeholder comment.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
