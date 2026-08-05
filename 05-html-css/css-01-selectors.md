# CSS Selectors and Specificity

> Master CSS selectors, specificity, cascade, and selector strategies

---

## Question 1: Explain CSS Specificity and the Cascade

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Microsoft

### Question
How does CSS specificity work? Explain the cascade and specificity calculation.

### Answer

**CSS Specificity** determines which styles apply when multiple rules target the same element. **The Cascade** is the algorithm browsers use to combine styles from multiple sources.

**Key Points:**

1. **Specificity is Calculated** - Each selector has a weight: inline styles (1000), IDs (100), classes/attributes/pseudo-classes (10), elements/pseudo-elements (1)
2. **Cascade Order Matters** - When specificity is equal, last rule wins
3. **!important Overrides** - `!important` beats everything (use sparingly)
4. **Inheritance** - Some properties inherit from parent (color, font-family) while others don't (margin, padding)
5. **Specificity Wars** - Avoid overly specific selectors; use classes over IDs for styling

### Code Example

```css
/* =========================================== */
/* 1. SPECIFICITY CALCULATION */
/* =========================================== */

/*
SPECIFICITY WEIGHT:
===================
Inline style:      1,0,0,0 (1000 points)
ID:                0,1,0,0 (100 points)
Class/Attribute:   0,0,1,0 (10 points)
Element:           0,0,0,1 (1 point)
Universal (*):     0,0,0,0 (0 points)
*/

/* Specificity: 0,0,0,1 (1 point) */
p {
  color: black;
}

/* Specificity: 0,0,1,0 (10 points) */
.text {
  color: blue; /* ✅ WINS over 'p' */
}

/* Specificity: 0,1,0,0 (100 points) */
#heading {
  color: red; /* ✅ WINS over '.text' */
}

/* Specificity: 1,0,0,0 (1000 points) */
<p style="color: green;">Text</p> /* ✅ WINS over all CSS rules */

/* !important overrides everything */
p {
  color: purple !important; /* ✅ WINS over inline styles */
}
```

**Specificity Examples:**

```css
/* =========================================== */
/* 2. CALCULATING SPECIFICITY */
/* =========================================== */

/* Specificity: 0,0,0,1 */
div { color: black; }

/* Specificity: 0,0,0,2 */
div p { color: blue; }

/* Specificity: 0,0,1,1 */
div .text { color: green; }

/* Specificity: 0,0,2,1 */
div.container .text { color: red; }

/* Specificity: 0,1,0,1 */
div#main { color: purple; }

/* Specificity: 0,1,1,2 */
div#main .content p { color: orange; }

/* Specificity: 0,2,1,1 */
#header #nav .link { color: yellow; }

/*
REMEMBER:
- ID always beats class
- Class always beats element
- More specific selector wins
- Same specificity? Last one wins
*/
```

**The Cascade:**

```css
/* =========================================== */
/* 3. CASCADE ORDER */
/* =========================================== */

/* 1. User agent styles (browser defaults) */
p {
  display: block;
  margin: 1em 0;
}

/* 2. User styles (user's browser settings) */

/* 3. Author styles (your CSS) */
p {
  color: blue; /* Overrides browser default */
}

p {
  color: red; /* ✅ WINS - same specificity, comes last */
}

/* 4. !important author styles */
p {
  color: green !important; /* ✅ WINS - !important */
}

/* 5. !important user styles */

/* 6. !important user agent styles */

/*
CASCADE PRIORITY (high to low):
1. !important user agent declarations
2. !important user declarations
3. !important author declarations
4. Normal author declarations
5. Normal user declarations
6. Normal user agent declarations
*/
```

**Inheritance:**

```css
/* =========================================== */
/* 4. INHERITANCE */
/* =========================================== */

.parent {
  /* These properties INHERIT to children */
  color: blue;
  font-family: Arial;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;

  /* These properties DON'T inherit */
  margin: 20px;
  padding: 10px;
  border: 1px solid black;
  background: yellow;
  width: 300px;
}

.child {
  /* Inherits: color, font-family, font-size, line-height, text-align */
  /* Doesn't inherit: margin, padding, border, background, width */
}

/* Force inheritance */
.child {
  border: inherit; /* Inherit parent's border */
  all: inherit; /* Inherit ALL properties from parent */
}

/* Reset inheritance */
.child {
  color: initial; /* Reset to initial value */
  all: unset; /* Remove all inherited/set values */
}
```

**Practical Example:**

```html
<div id="container" class="wrapper">
  <p class="text highlight">Hello World</p>
</div>
```

```css
/* =========================================== */
/* 5. REAL-WORLD SPECIFICITY BATTLE */
/* =========================================== */

/* Specificity: 0,0,0,1 - WON'T APPLY */
p {
  color: black;
}

/* Specificity: 0,0,1,0 - WON'T APPLY */
.text {
  color: blue;
}

/* Specificity: 0,0,2,0 - WON'T APPLY */
.text.highlight {
  color: green;
}

/* Specificity: 0,1,0,1 - WON'T APPLY */
#container p {
  color: red;
}

/* Specificity: 0,1,2,1 - ✅ WINS! */
#container .text.highlight {
  color: purple;
}

/* Override with !important (avoid in production) */
.text {
  color: orange !important; /* ✅ WINS over everything */
}
```

### Common Mistakes

❌ **Wrong**: Using IDs for styling
```css
#header { /* 0,1,0,0 - Too specific! */
  background: blue;
}

#header .nav { /* 0,1,1,0 - Even worse! */
  color: white;
}
/* Hard to override later */
```

✅ **Correct**: Use classes
```css
.header { /* 0,0,1,0 - Flexible */
  background: blue;
}

.header__nav { /* BEM naming */
  color: white;
}
```

❌ **Wrong**: Overusing !important
```css
.button {
  background: blue !important;
  color: white !important;
  padding: 10px !important; /* ❌ Specificity war! */
}
```

✅ **Correct**: Increase specificity properly
```css
.page .button {
  background: blue;
  color: white;
  padding: 10px;
}
```

### Follow-up Questions
1. "How does the universal selector affect specificity?"
2. "What happens when two selectors have the same specificity?"
3. "Can you explain the :not() pseudo-class specificity?"
4. "How do CSS custom properties (variables) inherit?"

### Resources
- [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
- [Specificity Calculator](https://specificity.keegan.st/)

---

<details>
<summary><strong>🔍 Deep Dive: CSS Specificity Algorithm Internals</strong></summary>

**How Browsers Calculate Specificity:**

The browser uses a **4-tuple notation (a, b, c, d)** where:
- **a**: Inline styles (highest priority)
- **b**: ID selectors count
- **c**: Class, attribute, and pseudo-class selectors count
- **d**: Element and pseudo-element selectors count

```javascript
// Simplified browser specificity calculation
function calculateSpecificity(selector) {
  const specificity = [0, 0, 0, 0];

  // Count inline styles (handled separately in browser)
  if (isInlineStyle) specificity[0] = 1;

  // Count IDs
  specificity[1] = selector.match(/#[\w-]+/g)?.length || 0;

  // Count classes, attributes, pseudo-classes
  specificity[2] = (
    (selector.match(/\.[\w-]+/g)?.length || 0) +  // Classes
    (selector.match(/\[[^\]]+\]/g)?.length || 0) + // Attributes
    (selector.match(/:(?!not|is|where)[\w-]+/g)?.length || 0) // Pseudo-classes
  );

  // Count elements and pseudo-elements
  specificity[3] = (
    (selector.match(/(?:^|[\s>+~])[\w-]+/g)?.length || 0) + // Elements
    (selector.match(/::[\w-]+/g)?.length || 0) // Pseudo-elements
  );

  return specificity;
}

// Examples:
calculateSpecificity('p');                    // [0, 0, 0, 1]
calculateSpecificity('.header .nav');         // [0, 0, 2, 0]
calculateSpecificity('#main div.content p');  // [0, 1, 1, 2]
calculateSpecificity('nav > ul li:hover');    // [0, 0, 1, 3]
```

**Specificity Comparison Algorithm:**

```javascript
function compareSpecificity(a, b) {
  // Compare from left to right
  for (let i = 0; i < 4; i++) {
    if (a[i] > b[i]) return 1;  // a wins
    if (a[i] < b[i]) return -1; // b wins
  }
  return 0; // Equal - source order decides
}

// Example:
// [0, 1, 0, 0] vs [0, 0, 10, 0]
// First: 0 === 0, continue
// Second: 1 > 0, ID wins!
// Result: 1 ID beats 10 classes
```

**Selector Specificity with `:is()` and `:where()`:**

```css
/* :is() and :where() have special specificity rules */

/* :is() takes highest specificity of its arguments */
:is(#header, .nav, div) {
  /* Specificity: 0,1,0,0 - from #header (highest) */
}

/* :where() always has 0 specificity */
:where(#header, .nav, div) {
  /* Specificity: 0,0,0,0 - always zero! */
}

/* Practical use: Style without specificity wars */
:where(.card) .title {
  /* Specificity: 0,0,1,0 - only .title counts */
  font-size: 1.5rem;
}

/* Easy to override */
.special-title {
  /* Specificity: 0,0,1,0 - can override! */
  font-size: 2rem;
}
```

**Cascade Layers:**

```css
/* @layer controls cascade order, independent of specificity */

@layer reset, base, components, utilities;

@layer reset {
  /* Lowest priority layer */
  * { margin: 0; padding: 0; }
}

@layer base {
  p { color: black; }
}

@layer components {
  .button { color: blue; }
}

@layer utilities {
  /* Highest priority layer */
  .text-red { color: red !important; }
}

/*
LAYER PRIORITY (low to high):
1. reset
2. base
3. components
4. utilities
5. Unlayered styles (highest)

Layers trump specificity WITHIN same origin!
*/
```

**Browser Rendering Pipeline:**

```
1. Parse HTML → DOM Tree
2. Parse CSS → CSSOM Tree
   ├─ Calculate specificity for each rule
   ├─ Sort by specificity + source order
   └─ Build Cascade Sorted Style Map
3. Combine DOM + CSSOM → Render Tree
4. Apply winning styles to elements
```

**Performance Implications:**

```css
/* ❌ SLOW: Deep nesting requires more specificity checks */
#main .sidebar .widget .header .title span {
  /* Browser must traverse 7 levels */
  color: blue;
}

/* ✅ FAST: Flat selectors */
.widget-title-span {
  /* Single class lookup - O(1) hash */
  color: blue;
}

/* Specificity calculation cost:
   - Element selector: ~0.1ms per match
   - Class selector: ~0.05ms per match (hash lookup)
   - ID selector: ~0.03ms per match (fastest)
   - Complex selector: 0.5-2ms per match
*/
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Specificity Wars in Large Codebases</strong></summary>

**Problem: Third-Party Library Override Hell**

Your team integrated a UI library (e.g., Material-UI), and now simple style overrides require `!important` everywhere.

**Production Issue:**

```css
/* Your app.css */
.button {
  background: #007bff;
  border-radius: 4px;
}

/* Material-UI library.css (loaded after) */
.MuiButton-root {
  background: #1976d2; /* ✅ WINS - same specificity, comes last */
  border-radius: 8px;
}

/* Your desperate attempt */
.button {
  background: #007bff !important; /* ❌ Maintainability nightmare */
}
```

**Metrics Before Fix:**
- CSS bundle size: 450KB
- !important count: 247 instances
- Selector complexity: avg 4.2 levels deep
- Build time: 12s
- Runtime style recalculations: ~800ms on initial render

**Debugging Steps:**

```javascript
// 1. Use browser DevTools to inspect computed styles
const element = document.querySelector('.button');
const computed = window.getComputedStyle(element);

// 2. Check which rule won
console.log(computed.background); // "rgb(25, 118, 210)"

// 3. Get all matching rules with specificity
function debugSpecificity(selector) {
  const rules = [...document.styleSheets]
    .flatMap(sheet => [...sheet.cssRules])
    .filter(rule => element.matches(rule.selectorText));

  return rules.map(rule => ({
    selector: rule.selectorText,
    specificity: calculateSpecificity(rule.selectorText),
    source: rule.parentStyleSheet.href
  })).sort((a, b) => compareSpecificity(b.specificity, a.specificity));
}

console.table(debugSpecificity('.button'));
/*
┌─────┬───────────────────────┬─────────────────┬──────────────────┐
│ idx │ selector              │ specificity     │ source           │
├─────┼───────────────────────┼─────────────────┼──────────────────┤
│ 0   │ .MuiButton-root       │ [0, 0, 1, 0]    │ material-ui.css  │
│ 1   │ .button               │ [0, 0, 1, 0]    │ app.css          │
└─────┴───────────────────────┴─────────────────┴──────────────────┘
*/
```

**Solution 1: CSS Modules (Recommended)**

```css
/* Button.module.css - scoped to component */
.button {
  background: #007bff; /* No collision with .MuiButton-root */
  composes: base from './base.module.css';
}

/* Generates: .Button_button__2Fgx3 */
```

**Solution 2: Increase Specificity Strategically**

```css
/* ✅ Use wrapper class from your app */
.app .button {
  /* Specificity: 0,0,2,0 - beats .MuiButton-root */
  background: #007bff;
}

/* Even better: Use :where() for library styles */
:where(.MuiButton-root) {
  /* Specificity: 0,0,0,0 - easy to override */
  background: #1976d2;
}
```

**Solution 3: CSS Cascade Layers**

```css
@layer library, app;

@layer library {
  /* All Material-UI styles here */
  .MuiButton-root {
    background: #1976d2;
  }
}

@layer app {
  /* Your styles ALWAYS win, regardless of specificity */
  .button {
    background: #007bff; /* ✅ WINS over library layer */
  }
}
```

**Metrics After Fix:**
- CSS bundle size: 380KB (-70KB, 15.5% reduction)
- !important count: 12 instances (-95%)
- Selector complexity: avg 2.1 levels deep
- Build time: 8s (-33%)
- Runtime style recalculations: ~210ms (-73%)

**Key Learnings:**
1. Layer your CSS architecturally (reset → base → components → utilities)
2. Use CSS Modules or BEM to avoid naming collisions
3. Reserve `!important` for utility classes only
4. Prefer cascade layers over high specificity
5. Use browser DevTools specificity inspector

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Selector Strategies</strong></summary>

**1. Low Specificity (Classes) vs High Specificity (IDs)**

| Aspect | Low Specificity (Classes) | High Specificity (IDs) |
|--------|---------------------------|------------------------|
| **Reusability** | ✅ High - can reuse classes | ❌ Low - IDs must be unique |
| **Override Ease** | ✅ Easy to override | ❌ Requires !important or higher ID |
| **Performance** | ⚠️ Good (~0.05ms) | ✅ Best (~0.03ms) - hash lookup |
| **Maintainability** | ✅ Excellent | ❌ Specificity wars |
| **Team Scalability** | ✅ Easy to reason about | ❌ Conflicts in large teams |

```css
/* ❌ HIGH SPECIFICITY APPROACH */
#header #nav ul li a.active {
  /* Specificity: 0,2,1,3 - nightmare to override */
  color: blue;
}

/* ✅ LOW SPECIFICITY APPROACH (BEM) */
.nav__link--active {
  /* Specificity: 0,0,1,0 - easy to override */
  color: blue;
}
```

**When to use IDs:**
- JavaScript hooks (`getElementById` is fastest)
- Fragment identifiers (`#section-1`)
- ARIA relationships (`aria-labelledby="heading-id"`)
- **Never for styling** in modern CSS

---

**2. Flat Selectors vs Nested Selectors**

| Aspect | Flat Selectors | Nested Selectors |
|--------|----------------|------------------|
| **Performance** | ✅ Fast (O(1) hash) | ❌ Slow (O(n) traversal) |
| **Specificity** | ✅ Low (0,0,1,0) | ⚠️ Increases with depth |
| **Readability** | ⚠️ Requires naming convention | ✅ Shows hierarchy |
| **Bundle Size** | ✅ Smaller | ❌ Larger (repeated selectors) |

```css
/* ❌ NESTED (SCSS/SASS) */
.header {
  .nav {
    ul {
      li {
        a {
          /* Compiles to: .header .nav ul li a */
          /* Specificity: 0,0,2,3 */
          color: blue;
        }
      }
    }
  }
}

/* ✅ FLAT (BEM) */
.nav__link {
  /* Specificity: 0,0,1,0 */
  color: blue;
}
```

**Performance Benchmark:**

```javascript
// Selector matching time (1000 elements)
const selectors = {
  'Flat (.nav__link)': 2.3ms,
  'Shallow (.nav .link)': 8.7ms,
  'Deep (.header .nav ul li a)': 34.2ms,
  'ID (#nav-1)': 0.8ms
};
```

**Decision Matrix:**

```
Use FLAT selectors when:
├─ Building component libraries
├─ Performance is critical (tables, lists)
└─ Working with large teams

Use NESTED selectors when:
├─ Prototyping (faster to write)
├─ Overriding third-party styles (scoping)
└─ Small projects (< 10 components)
```

---

**3. !important Usage Strategies**

| Use Case | Rating | Example |
|----------|--------|---------|
| **Utility classes** | ✅ Good | `.hidden { display: none !important; }` |
| **User preferences** | ✅ Good | `:root[data-theme="high-contrast"]` |
| **Overriding inline styles** | ⚠️ Acceptable | Third-party widgets |
| **Regular component styles** | ❌ Bad | `.button { color: blue !important; }` |
| **Fixing specificity wars** | ❌ Very Bad | Indicates architectural problem |

```css
/* ✅ GOOD: Utility classes */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  /* Should NEVER be overridden */
}

/* ✅ GOOD: User accessibility preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* ❌ BAD: Regular styles */
.button {
  background: blue !important; /* Why? Fix specificity instead */
}
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: CSS Specificity Like a Scoring System</strong></summary>

**Simple Analogy:**

Imagine CSS selectors are like **job interview candidates**, and specificity is their **qualification score**:

1. **Inline styles** = PhD (1000 points) - highest qualification
2. **IDs** = Master's degree (100 points)
3. **Classes** = Bachelor's degree (10 points)
4. **Elements** = High school diploma (1 point)

When multiple candidates (selectors) apply for the same job (style an element), the **highest qualification wins**!

```css
/* Candidate 1: High school diploma */
p { color: black; } /* Score: 1 */

/* Candidate 2: Bachelor's degree */
.text { color: blue; } /* Score: 10 - HIRED! */

/* Candidate 3: Master's degree */
#heading { color: red; } /* Score: 100 - HIRED! */

/* Candidate 4: PhD */
<p style="color: green;">Text</p> /* Score: 1000 - HIRED! */
```

**What if two candidates have the same qualification?**

The **last one interviewed (last in source order) gets the job**:

```css
.text { color: blue; }  /* Interviewed first */
.text { color: red; }   /* Interviewed last - HIRED! */
```

**Interview Answer Template:**

"CSS specificity determines which styles apply when multiple rules target the same element. It's calculated using a four-part score: inline styles (highest), IDs, classes/attributes/pseudo-classes, and elements (lowest). For example, `#nav .link` has specificity (0,1,1,0) which beats `.nav .link` (0,0,2,0) because the ID carries more weight. When specificity is equal, the last rule in source order wins. This is why we avoid IDs for styling - they're too specific and hard to override. Instead, we use classes which keep specificity low and maintainable."

**Common Junior Mistakes:**

```css
/* ❌ Mistake 1: "More words = higher specificity" */
div p span a {
  /* Specificity: 0,0,0,4 */
}

.link {
  /* Specificity: 0,0,1,0 - WINS because class > element */
  color: blue;
}

/* ❌ Mistake 2: "Classes add up to beat IDs" */
.one.two.three.four.five {
  /* Specificity: 0,0,5,0 - Still loses! */
}

#id {
  /* Specificity: 0,1,0,0 - WINS because 1 ID > 5 classes */
  color: red;
}

/* ❌ Mistake 3: "!important makes specificity higher" */
/* WRONG! !important is OUTSIDE the specificity system */
/* It creates a separate "important cascade" that always wins */
```

</details>

---

## Question 2: CSS Variables (Custom Properties)

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Time:** 10-12 minutes
**Companies:** Google, Meta, Amazon, Netflix

### Question
What are CSS custom properties (variables)? How do they work, and how do they differ from preprocessor variables?

### Answer

**CSS Custom Properties** (also called CSS variables) are entities defined by CSS authors that contain specific values to be reused throughout a document.

**Key Points:**

1. **Scoped** - Can be global (:root) or scoped to elements, inherited by children
2. **Dynamic** - Can be changed at runtime with JavaScript, unlike Sass/Less variables
3. **Cascading** - Follow cascade and inheritance rules like regular properties
4. **Syntax** - Defined with `--name` and accessed with `var(--name)`
5. **Fallbacks** - Support default values: `var(--color, blue)`

### Code Example

```css
/* =========================================== */
/* 1. BASIC SYNTAX */
/* =========================================== */

:root {
  /* Define variables in :root for global scope */
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --spacing-unit: 8px;
  --border-radius: 4px;
  --font-family: 'Inter', sans-serif;
}

.button {
  /* Use variables with var() function */
  background: var(--primary-color);
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}

/* With fallback value */
.special-button {
  /* If --accent-color doesn't exist, use #ff6b6b */
  background: var(--accent-color, #ff6b6b);
}
```

**Scoping and Inheritance:**

```css
/* =========================================== */
/* 2. SCOPING AND INHERITANCE */
/* =========================================== */

:root {
  --text-color: black;
  --background: white;
}

.dark-theme {
  /* Override variables in this scope */
  --text-color: white;
  --background: #1a1a1a;
}

.card {
  /* Inherits variables from parent */
  color: var(--text-color);
  background: var(--background);
}

/*
<body> (text-color: black, background: white)
  ├─ <div class="card"> (inherits: black, white)
  └─ <div class="dark-theme">
      └─ <div class="card"> (inherits: white, #1a1a1a)
*/
```

**Dynamic Theming:**

```html
<body data-theme="light">
  <button onclick="toggleTheme()">Toggle Theme</button>
  <div class="content">Content</div>
</body>
```

```css
/* =========================================== */
/* 3. DYNAMIC THEMING */
/* =========================================== */

:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
}

[data-theme="dark"] {
  /* Dark theme */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #f8f9fa;
  --text-secondary: #adb5bd;
  --border-color: #495057;
}

.content {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  /* Automatically updates when data-theme changes */
}
```

```javascript
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  body.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
}
```

**JavaScript Manipulation:**

```javascript
/* =========================================== */
/* 4. JAVASCRIPT MANIPULATION */
/* =========================================== */

// Get variable value
const root = document.documentElement;
const primaryColor = getComputedStyle(root)
  .getPropertyValue('--primary-color'); // "#007bff"

// Set variable value
root.style.setProperty('--primary-color', '#ff0000');

// Remove variable
root.style.removeProperty('--primary-color');

// Scoped to element
const card = document.querySelector('.card');
card.style.setProperty('--card-bg', '#f0f0f0');
```

**CSS vs Preprocessor Variables:**

```css
/* =========================================== */
/* 5. CSS VARIABLES VS SASS/LESS VARIABLES */
/* =========================================== */

/* SASS variables (compile-time) */
$primary-color: #007bff;
$spacing: 8px;

.button {
  background: $primary-color; /* Replaced at compile time */
  padding: $spacing * 2; /* Calculated: 16px */
}

/* Compiles to: */
.button {
  background: #007bff;
  padding: 16px;
}
/* ❌ Can't change at runtime */
/* ❌ No inheritance or cascade */
/* ✅ Can use in media queries, selectors */

/* CSS variables (runtime) */
:root {
  --primary-color: #007bff;
  --spacing: 8px;
}

.button {
  background: var(--primary-color); /* Resolved at runtime */
  padding: calc(var(--spacing) * 2); /* Calculated: 16px */
}
/* ✅ Can change at runtime with JS */
/* ✅ Inherits and cascades */
/* ❌ Can't use in media queries or selectors */
```

**Practical Use Cases:**

```css
/* =========================================== */
/* 6. PRACTICAL PATTERNS */
/* =========================================== */

/* Pattern 1: Component variants */
.button {
  --button-bg: var(--primary-color);
  --button-text: white;

  background: var(--button-bg);
  color: var(--button-text);
}

.button--secondary {
  --button-bg: var(--secondary-color);
}

.button--outline {
  --button-bg: transparent;
  --button-text: var(--primary-color);
}

/* Pattern 2: Responsive spacing scale */
:root {
  --space-unit: 4px;
  --space-xs: calc(var(--space-unit) * 1);  /* 4px */
  --space-sm: calc(var(--space-unit) * 2);  /* 8px */
  --space-md: calc(var(--space-unit) * 4);  /* 16px */
  --space-lg: calc(var(--space-unit) * 8);  /* 32px */
  --space-xl: calc(var(--space-unit) * 12); /* 48px */
}

@media (min-width: 768px) {
  :root {
    --space-unit: 8px; /* Double spacing on larger screens */
  }
}

/* Pattern 3: Color system with opacity */
:root {
  --primary: 0, 123, 255; /* RGB values */
}

.overlay {
  background: rgba(var(--primary), 0.1);
  border: 1px solid rgba(var(--primary), 0.3);
}

.button {
  background: rgb(var(--primary));
}
```

**Advanced Techniques:**

```css
/* =========================================== */
/* 7. ADVANCED PATTERNS */
/* =========================================== */

/* Pattern 1: Computed properties */
:root {
  --base-size: 16px;
  --scale-ratio: 1.25;

  --font-size-sm: calc(var(--base-size) / var(--scale-ratio));
  --font-size-md: var(--base-size);
  --font-size-lg: calc(var(--base-size) * var(--scale-ratio));
  --font-size-xl: calc(var(--base-size) * var(--scale-ratio) * var(--scale-ratio));
}

/* Pattern 2: Component API */
.progress-bar {
  --progress: 0; /* Default 0% */

  width: 100%;
  height: 20px;
  background: #eee;
}

.progress-bar::after {
  content: '';
  display: block;
  width: calc(var(--progress) * 1%);
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s;
}

/* Usage: */
<div class="progress-bar" style="--progress: 75"></div>

/* Pattern 3: Conditional values (using @supports) */
:root {
  --gap: 20px;
}

@supports (gap: 20px) {
  :root {
    --gap: 0; /* No need for margin if gap works */
  }
}

.grid {
  display: grid;
  gap: 20px;
  margin: var(--gap); /* Fallback for old browsers */
}
```

### Common Mistakes

❌ **Wrong**: Using variables in media queries
```css
:root {
  --breakpoint: 768px;
}

@media (min-width: var(--breakpoint)) { /* ❌ DOESN'T WORK */
  /* ... */
}
```

✅ **Correct**: Use Sass variables for static values
```scss
$breakpoint: 768px;

@media (min-width: $breakpoint) { /* ✅ Works */
  :root {
    --spacing: 16px; /* CSS vars for dynamic values */
  }
}
```

❌ **Wrong**: Forgetting fallback values
```css
.element {
  color: var(--undefined-color); /* If undefined, property is invalid */
}
```

✅ **Correct**: Always provide fallbacks
```css
.element {
  color: var(--undefined-color, blue); /* Falls back to blue */
}
```

### Follow-up Questions
1. "Can you use CSS variables in calc()?"
2. "How do CSS variables affect performance compared to static values?"
3. "Can you animate CSS variables?"
4. "What's the browser support for CSS custom properties?"

### Resources
- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [CSS Variables: The Complete Guide](https://css-tricks.com/a-complete-guide-to-custom-properties/)

---

<details>
<summary><strong>🔍 Deep Dive: CSS Variables Implementation and Performance</strong></summary>

**How Browsers Process CSS Variables:**

Unlike preprocessor variables that are replaced at build time, CSS variables are resolved during the browser's **CSSOM construction and cascade resolution** phase.

```javascript
// Simplified browser variable resolution algorithm
class CSSOMVariableResolver {
  constructor() {
    this.variableCache = new Map(); // Memoize computed values
  }

  resolveVariable(element, propertyName) {
    const cacheKey = `${element.id}-${propertyName}`;

    // Check cache first
    if (this.variableCache.has(cacheKey)) {
      return this.variableCache.get(cacheKey);
    }

    // Walk up DOM tree to find variable definition
    let currentElement = element;
    while (currentElement) {
      const computedStyle = getComputedStyle(currentElement);
      const value = computedStyle.getPropertyValue(propertyName);

      if (value) {
        this.variableCache.set(cacheKey, value);
        return value;
      }

      currentElement = currentElement.parentElement;
    }

    return null; // Variable not found
  }

  substituteVariable(value, element) {
    // Match var(--name, fallback) pattern
    const varRegex = /var\(([^,)]+)(?:,\s*([^)]+))?\)/g;

    return value.replace(varRegex, (match, varName, fallback) => {
      const resolved = this.resolveVariable(element, varName.trim());
      return resolved || fallback || '';
    });
  }
}

// Example usage:
const resolver = new CSSOMVariableResolver();
const element = document.querySelector('.button');
const backgroundValue = 'var(--primary-color, blue)';
const resolved = resolver.substituteVariable(backgroundValue, element);
// Result: "#007bff" or "blue" (fallback)
```

**Cascade and Inheritance Internals:**

```css
:root {
  --color: red;    /* Specificity: 0,0,1,0 */
}

.parent {
  --color: blue;   /* Specificity: 0,0,1,0 - Same level */
}

#specific {
  --color: green;  /* Specificity: 0,1,0,0 - Higher, wins! */
}

.child {
  color: var(--color); /* Inherits from closest ancestor */
}
```

**Browser Rendering Pipeline with CSS Variables:**

```
Traditional CSS:
1. Parse CSS → CSSOM
2. Apply styles directly
3. Render

With CSS Variables:
1. Parse CSS → CSSOM
2. Variable Resolution Phase ← NEW
   ├─ Find all var() functions
   ├─ Walk DOM tree to resolve values
   ├─ Cache resolved values
   └─ Substitute values
3. Apply computed styles
4. Render

Performance Impact: +2-5ms per frame (negligible for <100 variables)
```

**Performance Characteristics:**

```javascript
// Benchmark: 1000 elements with variables
const tests = {
  'Static value': () => {
    // background: #007bff;
    // Time: ~0.5ms
  },

  'CSS variable': () => {
    // background: var(--primary);
    // Time: ~2.3ms (4.6x slower, but still imperceptible)
  },

  'Nested variable': () => {
    // background: var(--button-bg);
    // --button-bg: var(--primary);
    // Time: ~4.1ms (variable lookup chain)
  },

  'Calc with variable': () => {
    // padding: calc(var(--space) * 2);
    // Time: ~3.8ms (calc + variable resolution)
  }
};

// CRITICAL: Variables are resolved once, then cached
// Changing :root variable re-triggers cascade for affected elements
document.documentElement.style.setProperty('--primary', '#ff0000');
// Recalculation time: ~15ms for 1000 elements (batch optimized)
```

**Memory Implications:**

```javascript
// Each defined custom property adds ~40 bytes to CSSOM
const memoryUsage = {
  '10 variables': '~400 bytes',
  '100 variables': '~4 KB',
  '1000 variables': '~40 KB',

  // Plus resolution cache (depends on DOM size):
  'Cache (1000 elements × 10 vars)': '~80 KB'
};

// Recommendation: < 200 global variables for optimal performance
```

**Advanced: Cycle Detection**

```css
/* ❌ Circular dependency - browser must detect */
:root {
  --a: var(--b);
  --b: var(--c);
  --c: var(--a); /* Cycle! */
}

.element {
  color: var(--a); /* Invalid - property ignored */
}

/* Browser cycle detection algorithm:
   1. Maintain visited stack during resolution
   2. If variable appears twice in stack → cycle detected
   3. Treat value as invalid (not inherited)
   4. Use initial value or fallback
*/
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Dynamic Theme System with Performance Optimization</strong></summary>

**Problem: Theme Switch Causing Janky UI (300ms+ freeze)**

Your app's dark mode toggle causes visible UI freeze because 5000+ elements recompute styles.

**Production Setup:**

```css
/* themes.css */
:root {
  /* 50+ color variables */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  /* ... 47 more variables */
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  /* ... override all 50 variables */
}

/* Used across 200+ component styles */
.header { background: var(--bg-primary); }
.card { background: var(--bg-secondary); color: var(--text-primary); }
/* ... 198 more components */
```

**Metrics Before Fix:**

```javascript
// Performance measurement
performance.mark('theme-switch-start');
document.body.setAttribute('data-theme', 'dark');
performance.mark('theme-switch-end');
performance.measure('theme-switch', 'theme-switch-start', 'theme-switch-end');

// Results:
const measure = performance.getEntriesByName('theme-switch')[0];
console.log({
  duration: measure.duration,           // 342ms 🔴
  affectedElements: 5234,
  styleRecalcs: 1,                      // Batch recalc
  layout: 87ms,
  paint: 145ms,
  composite: 45ms,
  fps: 3                                // 🔴 TERRIBLE UX
});
```

**Debugging Steps:**

```javascript
// 1. Identify slow properties
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log({
      name: entry.name,
      duration: entry.duration,
      type: entry.entryType
    });
  }
});

observer.observe({ entryTypes: ['measure', 'paint'] });

// 2. Check which variables cause reflows
const expensiveProps = [
  'width', 'height', 'top', 'left', 'padding', 'margin', 'border-width'
];

// 3. Use Chrome DevTools Performance tab
// → Record → Toggle theme → Stop
// → Analyze "Recalculate Style" and "Layout" events
```

**Solution 1: CSS Containment (Fastest)**

```css
/* Isolate expensive components */
.card {
  /* Tells browser: layout inside won't affect outside */
  contain: layout style paint;

  background: var(--bg-secondary);
  color: var(--text-primary);
}

.sidebar {
  contain: layout;
  /* Prevents sidebar layout changes from affecting main */
}
```

**Solution 2: Reduce Variable Scope**

```css
/* ❌ BEFORE: All variables in :root (affects entire DOM) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  /* ... 50 variables */
}

/* ✅ AFTER: Scope variables to components */
.app-header {
  --bg: var(--bg-primary);
  background: var(--bg);
}

.app-sidebar {
  --bg: var(--bg-secondary);
  background: var(--bg);
}

/* Only changed elements recalculate */
```

**Solution 3: Batch Updates with CSS Transition**

```css
/* Smooth transition hides jank */
* {
  transition: background-color 0.3s ease,
              color 0.3s ease;
}

/* Perceived performance: smooth fade vs instant jank */
```

**Solution 4: Two Stylesheets (Extreme Cases)**

```html
<!-- For apps with 1000+ variables -->
<link rel="stylesheet" href="theme-light.css" id="theme-stylesheet">

<script>
// Swap entire stylesheet (faster than 1000 var changes)
function switchTheme(theme) {
  const link = document.getElementById('theme-stylesheet');
  link.href = `theme-${theme}.css`;
  // Browser loads new sheet, applies instantly
}
</script>
```

**Metrics After Fix:**

```javascript
// After applying CSS containment + scoping
console.log({
  duration: 45ms,                       // 🟢 87% improvement
  affectedElements: 1203,               // 🟢 77% reduction
  styleRecalcs: 1,
  layout: 12ms,                         // 🟢 86% improvement
  paint: 28ms,                          // 🟢 81% improvement
  composite: 5ms,
  fps: 60                               // 🟢 SMOOTH
});
```

**Key Learnings:**
1. Use `contain: layout style paint` for isolated components
2. Scope variables to minimize affected elements
3. Avoid variables for layout properties (width, height) if possible
4. Use transitions to mask recalculation jank
5. For extreme cases (1000+ vars), consider stylesheet swapping

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: CSS Variables vs Preprocessor Variables</strong></summary>

**Decision Matrix:**

| Feature | CSS Variables | Sass/Less Variables | Winner |
|---------|---------------|---------------------|--------|
| **Runtime updates** | ✅ Yes | ❌ No (compile-time) | CSS |
| **JavaScript control** | ✅ Yes | ❌ No | CSS |
| **Performance** | ⚠️ 2-5ms overhead | ✅ Zero (precompiled) | Sass |
| **Inheritance** | ✅ Cascades | ❌ Global scope only | CSS |
| **Use in media queries** | ❌ No | ✅ Yes | Sass |
| **Use in selectors** | ❌ No | ✅ Yes | Sass |
| **Type operations** | ⚠️ Limited (calc only) | ✅ Full (math, logic) | Sass |
| **Browser support** | ⚠️ IE11 not supported | ✅ Compiles to CSS3 | Sass |
| **Debugging** | ✅ DevTools shows values | ⚠️ Shows compiled values | CSS |
| **Bundle size** | ✅ Smaller | ⚠️ Larger (repeated values) | CSS |

**Hybrid Approach (Best of Both Worlds):**

```scss
// design-tokens.scss (Sass variables for static values)
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$grid-columns: 12;

// Used in media queries (CSS vars can't do this)
@media (min-width: $breakpoint-md) {
  .container {
    max-width: 720px;
  }
}

// Convert to CSS variables for runtime (theming, JS control)
:root {
  // Sass generates CSS vars
  --spacing-unit: 8px;
  --color-primary: #{$color-primary};

  @each $size, $value in $spacing-scale {
    --spacing-#{$size}: #{$value};
  }
}

// Use CSS vars in components
.card {
  padding: var(--spacing-md);
  background: var(--color-primary);
}
```

**When to Use What:**

```
Use CSS Variables:
├─ Theming (light/dark mode)
├─ User preferences (font size, spacing)
├─ Component variants (button colors, sizes)
├─ JavaScript-controlled values (progress, scroll position)
└─ Runtime calculations (responsive spacing scales)

Use Preprocessor Variables:
├─ Build-time constants (breakpoints, grid columns)
├─ Media query values
├─ Selector generation
├─ Complex math/logic
└─ Legacy browser support (IE11)

Use BOTH:
├─ Sass for static tokens
├─ Generate CSS vars from Sass
└─ Best performance + flexibility
```

**Performance Trade-offs:**

```javascript
// Scenario: Changing primary color across 1000 components

// CSS Variables:
document.documentElement.style.setProperty('--primary', '#ff0000');
// Time: ~15ms (batch recalculation)
// Lines of code: 1

// Static CSS (manual find-replace):
// Time: Requires rebuild (~5 seconds) + page reload
// Lines of code: 1000 changes

// Winner: CSS Variables for runtime changes
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: CSS Variables Like Labeled Containers</strong></summary>

**Simple Analogy:**

Think of CSS variables like **labeled containers** in a warehouse:

```css
/* Create labeled containers in the warehouse */
:root {
  --primary-color: #007bff;  /* Container labeled "primary-color" holds blue */
  --spacing: 8px;            /* Container labeled "spacing" holds 8px */
}

/* Use contents of containers */
.button {
  background: var(--primary-color); /* Get value from "primary-color" container */
  padding: var(--spacing);           /* Get value from "spacing" container */
}
```

**Why is this useful?**

1. **Change once, update everywhere:**
```css
/* Update one container, all uses update automatically */
:root {
  --primary-color: #ff0000; /* Change to red - all buttons turn red! */
}
```

2. **Different containers in different rooms (scopes):**
```css
/* Warehouse main office (global) */
:root {
  --temperature: 72°F;
}

/* Freezer section (local scope) */
.freezer {
  --temperature: 0°F; /* Override for this room */
}

/* Items inside freezer use their room's temperature */
.ice-cream {
  storage-temp: var(--temperature); /* Uses 0°F, not 72°F */
}
```

**Interview Answer Template:**

"CSS custom properties, or variables, allow us to define reusable values that cascade and inherit like normal CSS properties. Unlike Sass variables which are replaced at build time, CSS variables are resolved at runtime, so we can change them with JavaScript or override them based on scope. We define them with `--name: value` and use them with `var(--name)`. For example, for theming, I'd define color variables in `:root` and override them in a `[data-theme='dark']` selector. This way, changing the theme is just toggling an attribute, and all components using those variables update automatically. This is more maintainable than hardcoding colors everywhere."

**Common Junior Mistakes:**

```css
/* ❌ Mistake 1: Wrong syntax */
:root {
  primary-color: blue; /* Missing -- prefix */
}

.button {
  background: var(primary-color); /* Won't work */
}

/* ✅ Correct: */
:root {
  --primary-color: blue;
}

.button {
  background: var(--primary-color);
}

/* ❌ Mistake 2: Trying to use in media queries */
:root {
  --breakpoint: 768px;
}

@media (min-width: var(--breakpoint)) { /* DOESN'T WORK */
}

/* ✅ Correct: Use Sass/Less for this */
$breakpoint: 768px;
@media (min-width: $breakpoint) { /* Works */ }

/* ❌ Mistake 3: Forgetting variables need units in calc */
:root {
  --spacing: 8;
}

.element {
  padding: calc(var(--spacing) * 2); /* Result: "calc(8 * 2)" invalid */
}

/* ✅ Correct: */
:root {
  --spacing: 8px; /* Include unit */
}

.element {
  padding: calc(var(--spacing) * 2); /* Result: 16px ✅ */
}
```

</details>

---
