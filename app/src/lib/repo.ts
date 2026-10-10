// Links into the content repository, for "Edit on GitHub" and "Suggest a fix".

const REPO_URL = 'https://github.com/maurya-sachin/javascript-interview-deep-dive'
const DEFAULT_BRANCH = 'main'

/** GitHub's editor for a content file; `sourcePath` is repo-relative (e.g. `content/javascript/…/010-x.md`). */
export function editUrl(sourcePath: string): string {
  return `${REPO_URL}/edit/${DEFAULT_BRANCH}/${sourcePath}`
}

/** A new-issue page pre-filled with the question and its address. Plain `title`/`body` work with or without issue forms. */
export function suggestFixUrl(questionId: string, title: string, pageUrl: string): string {
  const params = new URLSearchParams({
    title: `Fix: ${title}`,
    body: `Question: ${questionId}\nPage: ${pageUrl}\n\nWhat is wrong or missing?\n`,
  })
  return `${REPO_URL}/issues/new?${params.toString()}`
}
