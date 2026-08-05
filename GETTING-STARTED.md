# Getting Started with Frontend Interview Prep

Welcome! This guide will help you navigate this massive repository and create an effective study plan for your frontend interview preparation — whether your interview is tomorrow or three months away.

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Interview Tomorrow? The 2-Hour Crash Review](#-interview-tomorrow-the-2-hour-crash-review)
3. [Understanding the Structure](#-understanding-the-structure)
4. [Choose Your Path](#-choose-your-path)
5. [Study by Experience Level](#-study-by-experience-level)
6. [Study by Company Type](#-study-by-company-type)
7. [How to Study Effectively](#-how-to-study-effectively)
8. [Progress Tracking](#-progress-tracking)
9. [Tips for Success](#-tips-for-success)
10. [Common Mistakes to Avoid](#-common-mistakes-to-avoid)
11. [Interview Day](#-interview-day)
12. [Tools and Resources](#-tools-and-resources)
13. [Self-Assessment](#-self-assessment)

---

## 🚀 Quick Start

### If you have...

#### **1 Day Before Interview**
1. Review [Pre-Interview 30 Flashcards](./19-flashcards/curated-decks/pre-interview-30.md) (15 min)
2. Skim [Essential 50 Flashcards](./19-flashcards/curated-decks/essential-50.md) (25 min)
3. Do the [2-Hour Crash Review](#-interview-tomorrow-the-2-hour-crash-review) below
4. Review company's tech stack topics (1 hour)

**Total:** ~4 hours of focused review

#### **1 Week Before Interview**
1. Complete [Daily 20 flashcards](./19-flashcards/curated-decks/daily-20.md) every day (10 min/day)
2. Solve 2-3 [coding problems](./18-coding-challenges/README.md) daily (1 hour/day)
3. Deep dive into 2-3 weak areas (2 hours/day)
4. Mock interview practice (2 hours over weekend)

**Total:** ~3 hours/day for 7 days

#### **2 Weeks Before Interview**
Follow the **[Two-Week Intensive](#path-2-two-week-intensive-)** day-by-day plan below.

**Total:** ~4 hours/day for 14 days

#### **1 Month Before Interview**
Follow **[Path 1: Quick Sprint (4 Weeks)](#path-1-quick-sprint-4-weeks-)**
- Week 1: JavaScript + TypeScript
- Week 2: React + Performance
- Week 3: Next.js + Testing
- Week 4: Coding problems + Flashcards

**Total:** ~47 hours over 4 weeks

#### **3+ Months Before Interview**
Follow **[Path 3: Deep Mastery (12 Weeks)](#path-3-deep-mastery-12-weeks-)**
- Complete mastery of all 411 Q&A
- Solve all 61 coding problems
- Review all flashcard decks
- Build projects using learned concepts

**Total:** ~130 hours over 12 weeks

> 📇 Looking for a specific topic or file? [INDEX.md](./INDEX.md) is the auto-generated inventory of everything in this repo.

---

## ⚡ Interview Tomorrow? The 2-Hour Crash Review

If you have an interview tomorrow, focus on these.

### Top 30 Must-Know Questions (60 minutes)

**JavaScript (10 questions - 20 min)**
1. [Closures](./01-javascript/scope-01b-closure.md)
2. [Event loop & async fundamentals](./01-javascript/async-01-fundamentals.md)
3. [Promises vs async/await](./01-javascript/async-03-async-await.md)
4. [this keyword](./01-javascript/functions-02a-this-binding.md)
5. [Prototypal inheritance](./01-javascript/objects-02a-prototypes.md)
6. [var/let/const differences](./01-javascript/variables-01-declarations.md)
7. [Arrow functions vs regular functions](./01-javascript/functions-01a-basics.md)
8. [Array methods (map, filter, reduce)](./01-javascript/arrays-01-methods.md)
9. [Hoisting & scope](./01-javascript/scope-01a-lexical-scope.md)
10. [Spread, rest & destructuring](./01-javascript/operators-03-destructuring.md)

**React (10 questions - 20 min)**
1. [useState](./03-react/hooks-01a-useState.md)
2. [useEffect](./03-react/hooks-02-useEffect.md)
3. [Keys in lists](./03-react/fragments-keys-01.md)
4. [Controlled vs uncontrolled components](./03-react/forms-01-controlled.md)
5. [React.memo vs useMemo](./03-react/performance-02-memoization.md)
6. [Custom hooks](./03-react/hooks-07-custom-hooks.md)
7. [Context API](./03-react/context-01-api.md)
8. [Virtual DOM](./03-react/rendering-01-virtual-dom.md)
9. [Lifecycle methods vs hooks](./03-react/lifecycle-01-methods.md)
10. [Error boundaries](./03-react/patterns-04-error-boundaries.md)

**TypeScript (5 questions - 10 min)**
1. [Type vs Interface](./02-typescript/fundamentals-01a-basics.md)
2. [Generics basics](./02-typescript/generics-01a-basics.md)
3. [Utility types (Partial, Pick, Omit)](./02-typescript/types-01a-utility.md)
4. [Type narrowing](./02-typescript/narrowing-01-guards.md)
5. [Union vs Intersection](./02-typescript/fundamentals-02-advanced.md)

**Performance & Security (5 questions - 10 min)**
1. [Core Web Vitals (LCP, FID, CLS)](./07-performance/core-vitals-01.md)
2. [Code splitting & lazy loading](./07-performance/lazy-loading-01-code-splitting.md)
3. [XSS prevention](./09-security/xss-01-prevention.md)
4. [CSRF protection](./09-security/csrf-01-protection.md)
5. [Bundle optimization](./07-performance/optimization-01-techniques.md)

### Top 5 Coding Problems (60 minutes)

Practice these in order of importance:

1. **[Debounce](./18-coding-challenges/01-javascript-fundamentals/debounce.md)** (15 min)
   - The single most frequently asked frontend coding question
   - Tests async understanding
   - Multiple difficulty levels

2. **[Deep Clone](./18-coding-challenges/01-javascript-fundamentals/deep-clone.md)** (10 min)
   - Common in Google, Meta interviews
   - Tests recursion and edge cases

3. **[Promise.all](./18-coding-challenges/01-javascript-fundamentals/promise-all.md)** (15 min)
   - Tests async/await knowledge
   - Common in senior roles

4. **[useLocalStorage Hook](./18-coding-challenges/03-react-problems/use-local-storage.md)** (15 min)
   - Most common React custom hook question
   - Tests hooks + browser APIs

5. **[Autocomplete Component](./18-coding-challenges/02-dom-manipulation/autocomplete.md)** (20 min)
   - Real-world problem
   - Tests debouncing, keyboard nav, accessibility

---

## 📂 Understanding the Structure

### Core Topics (Q&A)

Each topic directory contains **questions with comprehensive answers**, organized by concept:

```
01-javascript/
├── README.md                    # Topic overview + navigation
├── scope-01b-closure.md         # Closures, lexical scope
├── async-01-fundamentals.md     # Event loop, callbacks
├── async-02a-promises.md        # Promises deep dive
├── functions-02a-this-binding.md
├── objects-02a-prototypes.md
├── primitives-02a-coercion.md
└── ...                          # 50+ concept files
```

**Every question includes:**
- Detailed answer (3-5 key points)
- Code examples with comments
- Common mistakes (❌ vs ✅)
- Follow-up questions
- Resource links (MDN, articles)
- Difficulty (🟢 🟡 🔴)
- Interview frequency (⭐⭐⭐⭐⭐)
- Company tags

### Coding Problems

```
18-coding-challenges/
├── 01-javascript-fundamentals/   # debounce, throttle, memoize, polyfills...
├── 02-dom-manipulation/          # autocomplete, infinite scroll, drag & drop...
├── 03-react-problems/            # custom hooks (useLocalStorage, useFetch...)
├── 04-algorithms/                # LRU cache
├── 05-ui-components/             # modal, star rating
└── 06-performance/               # web workers, lazy images, code splitting
```

**Every problem includes:**
- Problem statement
- Requirements checklist
- Example usage
- Test cases (Jest)
- Multiple solutions (basic → optimized → production)
- Time/Space complexity
- Edge cases

### Flashcards

```
19-flashcards/
├── curated-decks/         # Pre-made decks
│   ├── essential-50.md
│   ├── pre-interview-30.md
│   └── daily-20.md
└── by-topic/              # Topic-specific decks
    ├── javascript.md
    ├── react.md
    ├── typescript.md
    └── ...

📱 Interactive app at root: index.html + src/
```

**Use flashcards for:**
- Spaced repetition learning
- Quick review before interviews
- Daily practice (morning routine)
- Long-term retention

---

## 🎯 Choose Your Path

### Path 1: Quick Sprint (4 Weeks) ⚡

**Best for:** Interview in 1 month, need focused preparation

**📘 [Full 4-Week Study Plan](./resources/study-plan-4-weeks.md)** - Complete day-by-day breakdown

| Week | Focus | Daily Time | Key Outcomes |
|------|-------|------------|--------------|
| 1 | JavaScript + TypeScript | 1.5h | Master async, closures, types |
| 2 | React + Hooks | 2h | Component patterns, optimization |
| 3 | Next.js + Testing | 1.5h | SSR, ISR, Jest, RTL |
| 4 | Coding + Flashcards | 2h | Solve 30 problems |

**Daily Schedule:**
- Morning (30 min): 20 flashcards
- Evening (1-2 hours): Topic reading + 1 coding problem
- Weekend (3-4 hours): Deep dive + mock interviews

### Path 2: Two-Week Intensive 🔥

**Best for:** Interview in 2 weeks, can commit ~4 hours/day

#### Week 1: Core Fundamentals

**Days 1-2: JavaScript Deep Dive**
- [ ] [Scope & closures](./01-javascript/scope-01a-lexical-scope.md) (3 hours)
- [ ] [Async JavaScript](./01-javascript/async-01-fundamentals.md) (3 hours)
- [ ] Practice: Debounce, Throttle, Deep Clone (2 hours)
- [ ] [Essential 50 Flashcards](./19-flashcards/curated-decks/essential-50.md) - First third

**Days 3-4: React Fundamentals**
- [ ] [React Hooks](./03-react/hooks-01a-useState.md) (4 hours)
- [ ] [Component Patterns](./03-react/README.md) (2 hours)
- [ ] Practice: useLocalStorage, useDebounce (2 hours)
- [ ] Essential 50 Flashcards - Second third

**Days 5-6: TypeScript & Next.js**
- [ ] [TypeScript Fundamentals](./02-typescript/README.md) (3 hours)
- [ ] [Advanced Types](./02-typescript/fundamentals-02-advanced.md) (2 hours)
- [ ] [Next.js App Router](./04-nextjs/router-01a-basics.md) (2 hours)
- [ ] Essential 50 Flashcards - Final third

**Day 7: Review & Practice**
- [ ] Review all flashcards (1 hour)
- [ ] Practice 3 coding problems (2 hours)
- [ ] Mock interview with friend (1 hour)

#### Week 2: Advanced Topics & Practice

**Days 8-9: Performance & Security**
- [ ] [Performance Optimization](./07-performance/optimization-01-techniques.md) (3 hours)
- [ ] [Accessibility](./08-accessibility/wcag-01-fundamentals.md) (2 hours)
- [ ] [Security (XSS, CSRF)](./09-security/xss-01-prevention.md) (2 hours)
- [ ] Practice: Infinite Scroll, Autocomplete (2 hours)

**Days 10-11: Testing & System Design**
- [ ] [Jest Fundamentals](./06-testing/jest-01-fundamentals.md) (3 hours)
- [ ] [System Design Basics](./10-system-design/) (2 hours)
- [ ] Practice: Write tests for previous problems (2 hours)

**Days 12-13: Coding Problem Marathon**
- [ ] Complete all JavaScript fundamentals problems (4 hours)
- [ ] Complete all React problems (3 hours)
- [ ] Complete 2 DOM manipulation problems (2 hours)

**Day 14: Final Review & Mock Interview**
- [ ] Review all flashcards (1 hour)
- [ ] Weak areas deep dive (2 hours)
- [ ] Full mock interview (1 hour)
- [ ] Rest well!

### Path 3: Deep Mastery (12 Weeks) 🎓

**Best for:** 3+ months until interview, want complete understanding

| Weeks | Focus | Weekly Time | Outcomes |
|-------|-------|-------------|----------|
| 1-4 | JS + TS Complete | 8h | Expert-level JS knowledge |
| 5-8 | React + Next.js + Testing | 9h | Production-ready skills |
| 9-10 | All Coding Problems | 10h | Problem-solving mastery |
| 11-12 | Architecture + Review | 6h | System design + polish |

**Daily Schedule:**
- Morning (15 min): Daily 20 flashcards
- Lunch (30 min): Read 5-10 Q&A
- Evening (1-2 hours): Solve 2 coding problems
- Weekend (4-6 hours): Deep topic study + projects

### Path 4: Daily Practice (Long-term) 🌱

**Best for:** Consistent improvement over 6 months

**Daily Routine:**
- Morning (15 min): 20 new flashcards
- Evening (30-45 min): 1 coding problem + review flashcards
- Weekend (2-3 hours):
  - Saturday: Deep dive 1 topic
  - Sunday: Build small project

**Results:** Master frontend in 6 months with consistency

---

## 🧑‍💻 Study by Experience Level

### Junior Developer (0-2 years)

**Study order:**
1. **JavaScript** ([01-javascript/](./01-javascript/README.md)) - Start here! Core concepts first, then async; skip advanced topics initially
2. **HTML & CSS** ([05-html-css/](./05-html-css/README.md)) - Semantics, Flexbox/Grid, responsive design
3. **React** ([03-react/](./03-react/README.md)) - Fundamentals and hooks; skip Fiber/internals until later
4. **Coding Problems** ([18-coding-challenges/](./18-coding-challenges/README.md)) - JS fundamentals, DOM, UI components
5. **Flashcards** - [Daily 20](./19-flashcards/curated-decks/daily-20.md) every day

**Skip for now:** Advanced TypeScript (generics, utility types), system design, deep performance optimization, microservices architecture

**Recommended problems:** Debounce/throttle (basic version), deep clone, array flatten, star rating, simple React components

### Mid-Level Developer (2-4 years)

**Study order:**
1. **JavaScript** ([01-javascript/](./01-javascript/README.md)) - Review advanced topics
2. **TypeScript** ([02-typescript/](./02-typescript/README.md)) - Interfaces, generics, utility types
3. **React** ([03-react/](./03-react/README.md)) - Advanced patterns, custom hooks, performance
4. **Next.js** ([04-nextjs/](./04-nextjs/README.md)) - SSR, ISR, App Router
5. **Testing** ([06-testing/](./06-testing/README.md)) - Jest, RTL, E2E
6. **Performance** ([07-performance/](./07-performance/README.md)) - Optimization, Core Web Vitals
7. **Coding Problems** - All categories
8. **Flashcards** - [Essential 50](./19-flashcards/curated-decks/essential-50.md) + topic-specific decks

**Don't skip:** Core Web Vitals, accessibility (WCAG, ARIA), build tools concepts, security basics (XSS, CSRF), state management (Context, Redux concepts)

**Recommended problems:** All JavaScript fundamentals, custom React hooks (useLocalStorage, useDebounce), autocomplete with debouncing, infinite scroll, Promise implementations

### Senior Developer (4+ years)

**Study order:**
1. **System Design** ([10-system-design/](./10-system-design/)) - Component/system design (16-architecture/ coming soon)
2. **Performance** ([07-performance/](./07-performance/README.md)) - Deep optimization
3. **Security** ([09-security/](./09-security/)) - Comprehensive coverage
4. **Testing** ([06-testing/](./06-testing/README.md)) - Advanced patterns and strategies
5. **Tooling** ([14-tooling/](./14-tooling/)) - Webpack, Vite, Babel internals
6. **Coding Problems** - Know multiple solutions for every problem
7. **Flashcards** - All decks for retention

**Must know:** All fundamentals (be able to teach them), architectural patterns, trade-offs and decision-making, scale considerations, team collaboration strategies

**Recommended challenges:** Design autocomplete for 1M users, optimize a bundle for slow connections, design a component library architecture, plus leadership/mentoring questions

---

## 🏢 Study by Company Type

### FAANG (Google, Meta, Amazon)

**Focus areas:** Algorithms and data structures, system design (required for senior+), deep JavaScript fundamentals, React internals, performance optimization

**Common questions:**
- Implement debounce/throttle
- Deep clone with edge cases
- Custom hooks with complex logic
- Autocomplete with optimization
- Infinite scroll with virtual scrolling

**Resources:** All [advanced coding problems](./18-coding-challenges/README.md) and the [system design section](./10-system-design/)

### Startups

**Focus areas:** Ship fast and iterate, full-stack knowledge, React + TypeScript, real-world problem solving, product thinking

**Common questions:**
- Build a feature end-to-end
- "How would you implement X?"
- Trade-offs discussion
- Take-home style projects
- Architecture decisions

**Resources:** Practical coding problems, [React](./03-react/README.md) + [Next.js](./04-nextjs/README.md) sections, performance basics

### Agencies / Consultancies

**Focus areas:** Client communication, multiple tech stacks, best practices, accessibility, cross-browser compatibility

**Common questions:**
- How do you handle X browser issue?
- Accessibility implementation
- Responsive design
- SEO optimization
- Performance on slow connections

**Resources:** [HTML/CSS](./05-html-css/README.md), [Accessibility](./08-accessibility/README.md), [SEO](./17-seo/) sections

---

## 📚 How to Study Effectively

### 1. Active Recall (Not Passive Reading)

❌ **Don't:** Just read questions and answers
✅ **Do:** Cover answer, try to answer, then check

**Technique:**
1. Read question
2. Cover answer with hand/paper
3. Speak your answer out loud
4. Check if you're correct
5. If wrong, understand why

### 2. Spaced Repetition

| Day | Review |
|-----|--------|
| 0 | Learn new concept |
| 1 | Review (after 1 day) |
| 3 | Review (after 3 days) |
| 7 | Review (after 1 week) |
| 14 | Review (after 2 weeks) |
| 30 | Review (after 1 month) |

**Tool:** Use the [Interactive Flashcard App](https://maurya-sachin.github.io/Frontend-Master-Prep-Series/) to track automatically

### 3. Code Everything

❌ **Don't:** Just read code examples
✅ **Do:** Type them out, modify them, break them

**Practice:**
1. Copy code example
2. Run it in browser console / Node
3. Change values and observe
4. Break it intentionally
5. Fix it yourself

### 4. Teach to Learn

Best way to solidify knowledge:
- Explain concepts to a friend (out loud, not just in your head)
- Write blog posts
- Create video tutorials
- Answer questions on Stack Overflow
- Teach junior developers

### 5. Build Projects

Apply concepts immediately:
- After JavaScript section → Build utility library
- After React section → Build component library
- After Next.js section → Build full app
- After Testing section → Add tests to previous projects

---

## 📈 Progress Tracking

### Daily Checklist

- [ ] 20 flashcards reviewed
- [ ] 1 coding problem solved
- [ ] 1 concept explained out loud
- [ ] 30 minutes of reading

### Weekly Goals

- [ ] All flashcards reviewed once
- [ ] 5+ coding problems completed
- [ ] 1 full topic mastered
- [ ] 1 mock interview completed

### Ready for Interview When:

- [ ] Can explain the Essential 50 flashcards confidently
- [ ] Solved 20+ coding problems
- [ ] Can code common problems from memory
- [ ] Comfortable with mock interviews
- [ ] Know your weak areas and worked on them
- [ ] Sleep well the night before!

### Weekly Goals Template

Copy this template for tracking:

```markdown
## Week [N] Goals

**Topic:** [JavaScript / React / etc.]

### Objectives
- [ ] Read 50 Q&A
- [ ] Solve 10 coding problems
- [ ] Review 100 flashcards
- [ ] Build mini project

### Daily Breakdown
- Monday: [specific tasks]
- Tuesday: [specific tasks]
- Wednesday: [specific tasks]
- Thursday: [specific tasks]
- Friday: [specific tasks]
- Weekend: [review + project]

### Reflections
[What went well? What to improve?]
```

---

## 💡 Tips for Success

### 1. Consistency > Intensity

Better: 1 hour daily for 30 days
Worse: 10 hours once a week

### 2. Track Your Progress

Use the checklists above, or your own system (Notion, Trello, a spreadsheet).

### 3. Focus on Weak Areas

After initial assessment, spend 60% time on weak topics:
- Weak areas: 60%
- Strong areas: 20%
- New learning: 20%

### 4. Mock Interviews

Practice with:
- Friends
- Pramp.com
- Interviewing.io
- LeetCode mock interviews

### 5. Don't Get Overwhelmed

This repo has 411 Q&A. You don't need ALL of them!

**Minimum viable prep (4 weeks):**
- Essential 50 flashcards ✅
- 30 coding problems ✅
- 150 core Q&A (focus on ⭐⭐⭐⭐⭐ questions) ✅

### 6. Quality Over Quantity

Better to deeply understand 10 concepts than superficially know 100.

---

## ⚠️ Common Mistakes to Avoid

### 1. Tutorial Hell

❌ Spending weeks reading without practicing
✅ 70% practice, 30% reading

### 2. Skipping Fundamentals

❌ Jumping straight to React without solid JavaScript
✅ Master JavaScript first, then frameworks

### 3. Not Writing Code

❌ Just reading answers
✅ Type every code example, modify, experiment

### 4. Memorizing Without Understanding

❌ Memorizing interview answers word-for-word
✅ Understand concepts, explain in your own words

### 5. Ignoring Company-Specific Prep

❌ Generic preparation for all companies
✅ Review company's tech stack and culture

### 6. Last-Minute Cramming

❌ Starting 2 days before interview
✅ Start 4-12 weeks before interview

### 7. Not Taking Breaks

❌ Studying for 6 hours straight
✅ Pomodoro technique: 25 min study, 5 min break

---

## 🎤 Interview Day

### Last-Minute Prep (2 Hours Before)

**Don't:**
- ❌ Learn new topics
- ❌ Cram complex algorithms
- ❌ Panic code everything
- ❌ Stay up all night

**Do:**
- ✅ Review [Pre-Interview 30 Flashcards](./19-flashcards/curated-decks/pre-interview-30.md) (20 min)
- ✅ Practice 1 easy problem (10 min)
- ✅ Review your previous projects (20 min)
- ✅ Prepare questions to ask interviewer (10 min)
- ✅ Test your setup (camera, mic, internet) (10 min)
- ✅ Review company info (10 min)
- ✅ Relax and breathe (30 min)
- ✅ Get water and snacks ready (10 min)

### During the Interview: Problem-Solving Process

1. **Listen Carefully** (2 min)
   - Don't interrupt
   - Take notes
   - Wait for complete question

2. **Clarify Requirements** (3 min)
   - Ask about edge cases
   - Confirm input/output format
   - Check constraints

3. **Explain Approach** (5 min)
   - Think out loud
   - Discuss trade-offs
   - Get interviewer buy-in

4. **Code Solution** (25 min)
   - Start simple, optimize later
   - Talk while coding
   - Use clear variable names

5. **Test Your Code** (10 min)
   - Walk through examples
   - Check edge cases
   - Fix bugs

6. **Optimize** (5 min)
   - Discuss time/space complexity
   - Suggest improvements
   - Alternative approaches

### Communication Tips

- **"I'm thinking about..."** (shows thought process)
- **"Let me clarify..."** (asks good questions)
- **"One approach could be..."** (discusses options)
- **"The trade-off here is..."** (shows decision-making)
- **"I would test this by..."** (shows thoroughness)

And remember:
- **Don't panic** - Everyone gets nervous
- **Be yourself** - Authenticity wins
- **Ask questions** - Shows engagement
- **Learn from each interview** - Feedback is gold

---

## 🛠 Tools and Resources

### Coding Practice Platforms

- [LeetCode](https://leetcode.com/) - Algorithms
- [Frontend Mentor](https://www.frontendmentor.io/) - UI challenges
- [CodeSandbox](https://codesandbox.io/) - Quick prototyping
- [StackBlitz](https://stackblitz.com/) - Online IDE

### Flashcard Tools

- **[Interactive Web App](https://maurya-sachin.github.io/Frontend-Master-Prep-Series/)** (deployed at root)
  - Track your progress with SM-2 algorithm
  - Spaced repetition built-in
  - Modern UI with Tailwind CSS
  - Works offline
- **Markdown Files** - Read directly in GitHub or any text editor

### Browser Extensions

- React Developer Tools
- Redux DevTools
- Lighthouse
- axe DevTools (accessibility)

### Study Tracking

- [Notion](https://www.notion.so/) - Study planner
- [Trello](https://trello.com/) - Progress boards
- Google Sheets - Simple checklist

### Mock Interview Platforms

- [Pramp](https://www.pramp.com/) - Free peer interviews
- [Interviewing.io](https://interviewing.io/) - Anonymous interviews
- [LeetCode Mock](https://leetcode.com/interview/) - Timed practice

### In This Repo

- [Interview Checklist](./resources/interview-checklist.md)
- [4-Week Study Plan](./resources/study-plan-4-weeks.md)
- [Full Content Index](./INDEX.md)

---

## 📊 Self-Assessment

Before starting, assess your current level:

### JavaScript (1-10)
- [ ] 1-3: Beginner (start with basics)
- [ ] 4-6: Intermediate (focus on async, closures)
- [ ] 7-10: Advanced (deep dive into engine, optimization)

### React (1-10)
- [ ] 1-3: Beginner (start with components, props, state)
- [ ] 4-6: Intermediate (hooks, context, optimization)
- [ ] 7-10: Advanced (Fiber, concurrent features, patterns)

### System Design (1-10)
- [ ] 1-3: Beginner (learn basics first)
- [ ] 4-6: Intermediate (component architecture)
- [ ] 7-10: Advanced (full system design)

**Based on your scores, adjust your study path accordingly.**

---

## 🚀 Ready to Start?

1. **Choose your path** (Quick Sprint / Two-Week Intensive / Deep Mastery / Daily Practice)
2. **Set up tools** (flashcard app, code editor, tracking system)
3. **Block time** on calendar (non-negotiable study time)
4. **Start small** (Day 1: Just 30 minutes)
5. **Build momentum** (consistency compounds)

**Your first task:** Go to [01-javascript/README.md](./01-javascript/README.md) and read the first 5 questions!

---

## 💬 Need Help?

- Open an issue on GitHub
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for community guidelines
- Share your progress and get feedback

---

**Good luck with your interview preparation! 🎉**

_Remember: Every expert was once a beginner. You've got this!_

---

[← Back to Main README](./README.md) | [Contributing Guide →](./CONTRIBUTING.md)
