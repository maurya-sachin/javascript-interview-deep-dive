import assert from 'node:assert/strict'
import { test } from 'node:test'
import { coversProblem } from './covers.ts'

const readme = (...lines: string[]) => ['# 1 — Topic', '', ...lines, '> **Status:** 🔴 planned'].join('\n')

test('a README without a Covers line is valid', () => {
  assert.equal(coversProblem(readme('> **Track:** Frontend')), null)
})

test('accepts Covers directly above Track', () => {
  assert.equal(coversProblem(readme('> **Covers:** ES2026; V8.', '> **Track:** Frontend')), null)
})

test('rejects a Covers line below Track', () => {
  assert.match(coversProblem(readme('> **Track:** Frontend', '> **Covers:** ES2026.')) ?? '', /directly above/)
})

test('rejects a Covers line separated from Track', () => {
  assert.match(coversProblem(readme('> **Covers:** ES2026.', '', '> **Track:** Frontend')) ?? '', /directly above/)
})

test('rejects an empty Covers line', () => {
  assert.match(coversProblem(readme('> **Covers:**  ', '> **Track:** Frontend')) ?? '', /empty/)
})

test('allows 15 words and rejects 16', () => {
  const words = (count: number) => Array.from({ length: count }, (_, index) => `w${index}`).join(' ')
  assert.equal(coversProblem(readme(`> **Covers:** ${words(15)}`, '> **Track:** Frontend')), null)
  assert.match(coversProblem(readme(`> **Covers:** ${words(16)}`, '> **Track:** Frontend')) ?? '', /16 words/)
})
