import { useEffect } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { DepthRail } from '@/components/DepthRail'
import { ChapterNav } from '@/components/question/ChapterNav'
import { Exercises } from '@/components/question/Exercises'
import { Html } from '@/components/question/Html'
import { InlineHtml } from '@/components/question/InlineHtml'
import { MetaRow } from '@/components/question/MetaRow'
import { Section } from '@/components/question/Section'
import { Breadcrumbs, ComingSoon, NotFound } from '@/components/PageShell'
import { QuestionTitle } from '@/components/QuestionTitle'
import { findChapter, neighbours, questionId, questionPath, useTopic } from '@/content/index-data'
import type { QuestionPage as QuestionData } from '@/content/types'
import { markRead } from '@/lib/progress'
import { editUrl, suggestFixUrl } from '@/lib/repo'
import { SITE_NAME } from '@/lib/site'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function QuestionPage() {
  const params = useParams()
  // The route's loader returns the question's content, or null when it has no page yet.
  const content = useLoaderData<QuestionData | null>()
  const topic = useTopic()
  const chapter = topic && findChapter(topic, params.chapter)
  const id = topic && chapter && params.question ? questionId(topic, chapter, params.question) : undefined
  const question = chapter?.questions.find((candidate) => candidate.id === id)
  const readableId = content !== null ? question?.id : undefined
  const titleHtml = content?.titleHtml
  useEffect(() => {
    if (readableId && titleHtml) markRead(readableId, titleHtml)
  }, [readableId, titleHtml])
  if (!topic || !chapter || !question) return <NotFound what="Question" />

  const { previous, next } = neighbours(topic, question.id)
  const sections = [
    { id: 'tldr', title: '30-second answer', shown: content !== null },
    { id: 'answer', title: 'Answer', shown: content !== null },
    { id: 'example', title: 'Example', shown: content !== null },
    { id: 'pitfalls', title: 'Pitfalls', shown: content !== null },
    { id: 'follow-ups', title: 'Follow-ups', shown: !!content?.followUps.length },
    { id: 'deep-dive', title: 'Deep dive', shown: !!content?.deepDiveHtml },
    { id: 'exercises', title: 'Exercises', shown: !!content?.exercises.length },
  ].filter((section) => section.shown)

  return (
    <div className="mx-auto grid max-w-340 gap-12 px-6 py-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,45rem)_14rem] xl:justify-center">
      <aside className="hidden lg:block">
        <ChapterNav topicSlug={topic.slug} chapter={chapter} currentId={question.id} />
      </aside>

      <main className="min-w-0">
        <Breadcrumbs
          crumbs={[
            { label: 'Topics', to: '/' },
            { label: topic.title, to: `/${topic.slug}` },
            { label: chapter.title, to: `/${topic.slug}/${chapter.slug}` },
          ]}
        />
          <title>{`${question.title} · ${SITE_NAME}`}</title>
          <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-[-0.03em]">
            <QuestionTitle html={question.titleHtml} />
          </h1>

          {/* Keyed so the list closes when you pick another question. */}
          <details key={question.id} className="mt-6 rounded-lg border lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Questions in this chapter ({chapter.questions.length})
            </summary>
            <div className="px-4 pb-4">
              <ChapterNav topicSlug={topic.slug} chapter={chapter} currentId={question.id} />
            </div>
          </details>

          {content === null ? (
            <p className="mt-4">
              <ComingSoon />
            </p>
          ) : (
            <>
              <MetaRow difficulty={content.difficulty} frequency={content.frequency} verified={content.verified} />

              <section aria-labelledby="tldr" className="mt-10 scroll-mt-8 rounded-r-xl border-l-4 border-link bg-tldr py-5 pr-6 pl-6 text-tldr-foreground">
                <h2 id="tldr" className="text-sm font-medium">
                  30-second answer
                </h2>
                <p className="mt-2 font-serif text-[1.375rem] leading-snug text-foreground">
                  <InlineHtml html={content.tldrHtml} className={CODE_STYLE} />
                </p>
              </section>

              <Section id="answer" title="Answer">
                <Html html={content.answerHtml} />
              </Section>
              <Section id="example" title="Example">
                <Html html={content.exampleHtml} />
              </Section>
              <Section id="pitfalls" title="Pitfalls">
                <Html html={content.pitfallsHtml} />
              </Section>
              {content.followUps.length > 0 && (
                <Section id="follow-ups" title="Follow-ups">
                  <dl className="flex flex-col gap-3">
                    {content.followUps.map((followUp) => (
                      <div key={followUp.questionHtml} className="rounded-xl border px-5 py-4">
                        <dt className="font-semibold">
                          <InlineHtml html={followUp.questionHtml} className={CODE_STYLE} />
                        </dt>
                        <dd className="mt-2 text-muted-foreground">
                          <InlineHtml html={followUp.answerHtml} className={CODE_STYLE} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Section>
              )}
              {content.deepDiveHtml && (
                <div className="mt-14 border-t pt-2">
                  <Section id="deep-dive" title="Deep dive">
                    <Html html={content.deepDiveHtml} />
                  </Section>
                </div>
              )}
              {content.exercises.length > 0 && (
                <div className="mt-14 border-t pt-2">
                  <Section id="exercises" title="Exercises">
                    {/* Keyed so revealed answers reset when navigating to another question. */}
                    <Exercises key={content.id} exercises={content.exercises} />
                  </Section>
                </div>
              )}

              <footer className="mt-14 flex flex-col gap-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <span>Sources:</span>
                  {content.sources.map((source) => (
                    <a key={source} href={source} className="text-link hover:text-link-hover">
                      {new URL(source).hostname}
                    </a>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <a
                    href={suggestFixUrl(content.id, content.title, window.location.origin + window.location.pathname)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link hover:text-link-hover"
                  >
                    Suggest a fix
                  </a>
                  <a href={editUrl(content.sourcePath)} target="_blank" rel="noreferrer" className="text-link hover:text-link-hover">
                    Edit on GitHub
                  </a>
                </div>
              </footer>
            </>
          )}

          <nav aria-label="Previous and next question" className="mt-12 grid grid-cols-2 gap-3">
            {previous ? (
              <Link to={questionPath(previous)} className="rounded-xl border p-4 hover:bg-muted">
                <span className="block text-sm text-muted-foreground">← Previous · {previous.number}</span>
                <QuestionTitle html={previous.titleHtml} />
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={questionPath(next)} className="col-start-2 rounded-xl border p-4 text-right hover:bg-muted">
                <span className="block text-sm text-muted-foreground">Next · {next.number} →</span>
                <QuestionTitle html={next.titleHtml} />
              </Link>
            )}
          </nav>
      </main>

      {sections.length > 0 && (
        <aside className="hidden xl:block">
          <DepthRail stops={sections} />
        </aside>
      )}
    </div>
  )
}
