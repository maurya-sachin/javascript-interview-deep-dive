import { useEffect } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { ChapterNav } from '@/components/question/ChapterNav'
import { Exercises } from '@/components/question/Exercises'
import { Html } from '@/components/question/Html'
import { InlineHtml } from '@/components/question/InlineHtml'
import { MetaRow } from '@/components/question/MetaRow'
import { Section } from '@/components/question/Section'
import { Breadcrumbs, ComingSoon, NotFound } from '@/components/PageShell'
import { QuestionTitle } from '@/components/QuestionTitle'
import { findChapter, findTopic, neighbours, questionId, questionPath, useContentIndex } from '@/content/index-data'
import type { QuestionPage as QuestionData } from '@/content/types'
import { markRead } from '@/lib/progress'
import { editUrl, suggestFixUrl } from '@/lib/repo'

const CODE_STYLE = '[&_code]:font-mono [&_code]:text-[0.9em]'

export function QuestionPage() {
  const params = useParams()
  // The route's loader returns the question's content, or null when it has no page yet.
  const content = useLoaderData<QuestionData | null>()
  const topic = findTopic(useContentIndex(), params.topic)
  const chapter = topic && findChapter(topic, params.chapter)
  const id = topic && chapter && params.question ? questionId(topic, chapter, params.question) : undefined
  const question = chapter?.questions.find((candidate) => candidate.id === id)
  const readableId = content !== null ? question?.id : undefined
  useEffect(() => {
    if (readableId) markRead(readableId)
  }, [readableId])
  if (!topic || !chapter || !question) return <NotFound what="Question" />

  const { previous, next } = neighbours(topic, question.id)
  const sections = [
    { id: 'tldr', title: 'TL;DR', shown: content !== null },
    { id: 'answer', title: 'Answer', shown: content !== null },
    { id: 'example', title: 'Example', shown: content !== null },
    { id: 'pitfalls', title: 'Pitfalls', shown: content !== null },
    { id: 'follow-ups', title: 'Follow-ups', shown: !!content?.followUps.length },
    { id: 'deep-dive', title: 'Deep dive', shown: !!content?.deepDiveHtml },
    { id: 'exercises', title: 'Exercises', shown: !!content?.exercises.length },
  ].filter((section) => section.shown)

  return (
    <div className="mx-auto flex max-w-340 flex-wrap gap-12 px-6 py-8">
      <aside className="max-w-72 min-w-56 flex-1 basis-60">
        <ChapterNav topicSlug={topic.slug} chapter={chapter} currentId={question.id} />
      </aside>

      <main className="min-w-0 max-w-180 flex-999 basis-140">
        <Breadcrumbs
          crumbs={[
            { label: 'Topics', to: '/' },
            { label: topic.title, to: `/${topic.slug}` },
            { label: chapter.title, to: `/${topic.slug}/${chapter.slug}` },
          ]}
        />
          <title>{`${question.title} · Deep Dive`}</title>
          <h1 className="text-[2.125rem] leading-tight font-bold tracking-tight">
            <QuestionTitle html={question.titleHtml} />
          </h1>

          {content === null ? (
            <p className="mt-4">
              <ComingSoon />
            </p>
          ) : (
            <>
              <MetaRow difficulty={content.difficulty} frequency={content.frequency} verified={content.verified} />

              <section aria-labelledby="tldr" className="mt-8 rounded-xl bg-tldr px-6 py-5 text-tldr-foreground">
                <h2 id="tldr" className="font-mono text-xs font-medium tracking-widest">
                  TL;DR — THE 30-SECOND ANSWER
                </h2>
                <p className="mt-2.5 text-lg leading-relaxed text-foreground">
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
        <nav aria-label="On this page" className="max-w-52 min-w-36 flex-1 basis-40 text-sm">
          <div className="sticky top-6 flex flex-col gap-2.5">
            <span className="font-mono text-[0.6875rem] tracking-widest text-muted-foreground">ON THIS PAGE</span>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="text-muted-foreground hover:text-foreground">
                {section.title}
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
