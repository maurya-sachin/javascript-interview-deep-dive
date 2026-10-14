import { createBrowserRouter, Outlet, type LoaderFunctionArgs } from 'react-router'
import { Layout } from '@/components/Layout'
import { loadFlashcards, loadManifest, loadPractice, loadQuestion, loadTopic, MANIFEST_ROUTE_ID, TOPIC_ROUTE_ID } from '@/content/index-data'
import { ChapterPage } from '@/pages/ChapterPage'
import { FlashcardsPage } from '@/pages/FlashcardsPage'
import { HomePage } from '@/pages/HomePage'
import { PracticePage } from '@/pages/PracticePage'
import { QuestionPage } from '@/pages/QuestionPage'
import { TopicPage } from '@/pages/TopicPage'

// Pages under `:topic` read the topic with `useTopic()`. Practice and Flashcards sit under their own
// paths, so their loaders return the topic alongside their data.
export const router = createBrowserRouter(
  [
    {
      id: MANIFEST_ROUTE_ID,
      path: '/',
      element: <Layout />,
      loader: loadManifest,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'practice/:topic/:chapter',
          element: <PracticePage />,
          loader: ({ params }: LoaderFunctionArgs) => loadPractice(params.topic, params.chapter),
        },
        { path: 'flashcards/:topic', element: <FlashcardsPage />, loader: ({ params }: LoaderFunctionArgs) => loadFlashcards(params.topic) },
        {
          id: TOPIC_ROUTE_ID,
          path: ':topic',
          element: <Outlet />,
          loader: ({ params }: LoaderFunctionArgs) => loadTopic(params.topic),
          children: [
            { index: true, element: <TopicPage /> },
            { path: ':chapter', element: <ChapterPage /> },
            {
              path: ':chapter/:question',
              element: <QuestionPage />,
              loader: ({ params }: LoaderFunctionArgs) => loadQuestion(`${params.topic}/${params.chapter}/${params.question}`),
            },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
