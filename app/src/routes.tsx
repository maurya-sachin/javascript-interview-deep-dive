import { createBrowserRouter } from 'react-router'
import { Layout } from '@/components/Layout'
import { INDEX_ROUTE_ID, loadIndex } from '@/content/index-data'
import { ChapterPage } from '@/pages/ChapterPage'
import { HomePage } from '@/pages/HomePage'
import { QuestionPage } from '@/pages/QuestionPage'
import { TopicPage } from '@/pages/TopicPage'

export const router = createBrowserRouter(
  [
    {
      id: INDEX_ROUTE_ID,
      path: '/',
      element: <Layout />,
      loader: loadIndex,
      children: [
        { index: true, element: <HomePage /> },
        { path: ':topic', element: <TopicPage /> },
        { path: ':topic/:chapter', element: <ChapterPage /> },
        { path: ':topic/:chapter/:question', element: <QuestionPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
