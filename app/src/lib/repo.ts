// Links into the content repository, for "Edit on GitHub" and "Suggest a fix".

export const REPO_URL = 'https://github.com/maurya-sachin/javascript-interview-deep-dive'
const DEFAULT_BRANCH = 'main'

/** The writing guide, where a contributor starts. */
export const CONTRIBUTE_URL = `${REPO_URL}/blob/${DEFAULT_BRANCH}/templates/README.md`

/** GitHub's editor for a content file; `sourcePath` is repo-relative (e.g. `content/javascript/…/010-x.md`). */
export function editUrl(sourcePath: string): string {
  return `${REPO_URL}/edit/${DEFAULT_BRANCH}/${sourcePath}`
}

/** The correction issue form, pre-filled with the question and its address (query params are the form's field ids). */
export function suggestFixUrl(questionId: string, title: string, pageUrl: string): string {
  const params = new URLSearchParams({
    template: 'correction.yml',
    title: `Fix: ${title}`,
    question: questionId,
    page: pageUrl,
  })
  return `${REPO_URL}/issues/new?${params.toString()}`
}
