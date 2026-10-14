import { createBrowserRouter, Outlet, type LoaderFunctionArgs } from 'react-router'
import { Layout } from '@/components/Layout'
import { NotFound } from '@/components/PageShell'
import { RouteError } from '@/components/RouteError'
import { loadFlashcards, loadManifest, loadPractice, loadQuestion, loadTopic, MANIFEST_ROUTE_ID, TOPIC_ROUTE_ID } from '@/content/index-data'
import { ChapterPage } from '@/pages/ChapterPage'
import { FlashcardsPage } from '@/pages/FlashcardsPage'
import { HomePage } from '@/pages/HomePage'
import { PathPage } from '@/pages/PathPage'
import { PathsPage } from '@/pages/PathsPage'
import { PracticeHubPage } from '@/pages/PracticeHubPage'
import { PracticePage } from '@/pages/PracticePage'
import { PracticeTopicPage } from '@/pages/PracticeTopicPage'
import { QuestionPage } from '@/pages/QuestionPage'
import { RoadmapPage } from '@/pages/RoadmapPage'
import { TopicPage } from '@/pages/TopicPage'

// Pages under `:topic` read the topic with `useTopic()`. Practice and Flashcards sit under their own
// paths, so their loaders return the topic alongside their data.
export const router = createBrowserRouter(
  [
    {
      id: MANIFEST_ROUTE_ID,
      path: '/',
      element: <Layout />,
      errorElement: <RouteError />,
      loader: loadManifest,
      children: [
        // Pages sit under a pathless route so a failed load renders inside the layout, keeping the header.
        {
          errorElement: <RouteError />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'paths', element: <PathsPage /> },
            { path: 'paths/:slug', element: <PathPage /> },
            { path: 'roadmap', element: <RoadmapPage /> },
            { path: 'practice', element: <PracticeHubPage /> },
            { path: 'practice/:topic', element: <PracticeTopicPage />, loader: ({ params }: LoaderFunctionArgs) => loadTopic(params.topic) },
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
            { path: '*', element: <NotFound what="Page" /> },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
