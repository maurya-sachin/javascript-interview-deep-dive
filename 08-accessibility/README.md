# Accessibility (A11y) Interview Preparation

> **10+ questions covering WCAG, keyboard navigation, screen readers, and accessibility testing**

Master web accessibility from fundamentals to advanced patterns. Essential for inclusive web development.

---

## 📚 Table of Contents

### 1️⃣ WCAG Fundamentals (1 file, ~3 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [01. WCAG Fundamentals](./wcag-01-fundamentals.md) | WCAG guidelines, POUR principles, conformance levels | 🟡 |

### 2️⃣ Keyboard Navigation (1 file, ~3 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [02. Keyboard Navigation](./keyboard-01-navigation.md) | Focus management, keyboard shortcuts, tab order | 🟡 |

### 3️⃣ Screen Readers (1 file, ~2 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [03. Screen Readers](./screen-readers-01-basics.md) | ARIA, semantic HTML, screen reader testing | 🟡 🔴 |

### 4️⃣ Testing Accessibility (1 file, ~2 Q&A)
| File | Topics | Difficulty |
|------|--------|------------|
| [04. Testing Accessibility](./testing-01-tools.md) | Automated testing, manual testing, accessibility audits | 🟡 |

**Total:** 10 Q&A (will expand to 40+)

---

## ⭐ Most Frequently Asked

1. **WCAG Levels** - A, AA, AAA conformance (⭐⭐⭐⭐⭐)
2. **ARIA Attributes** - When and how to use (⭐⭐⭐⭐⭐)
3. **Keyboard Navigation** - Focus management (⭐⭐⭐⭐)
4. **Screen Reader Testing** - NVDA, JAWS, VoiceOver (⭐⭐⭐⭐)
5. **Semantic HTML** - Importance for accessibility (⭐⭐⭐⭐)

---

## 🎯 Learning Path

### Beginners (New to Accessibility)
1. **Start:** WCAG Fundamentals - Understand POUR principles
2. **Then:** Keyboard Navigation - Learn focus management
3. **Practice:** Semantic HTML - Use proper elements
4. **Skip:** Advanced ARIA initially

### Intermediate (6+ months experience)
1. **Master:** ARIA attributes - Roles, states, properties
2. **Deep Dive:** Screen Readers - Testing with NVDA/JAWS
3. **Learn:** Accessibility Testing - Automated and manual
4. **Explore:** Complex widgets - Modals, dropdowns, tabs

### Advanced (1+ year experience)
1. **All Sections** - Complete mastery
2. **Focus:** Complex accessibility patterns
3. **Master:** Screen reader optimization
4. **Perfect:** Accessibility auditing and remediation

---

## 🏆 Interview Readiness Checklist

### Junior Level (0-2 years)
- [ ] Understand WCAG basics
- [ ] Know POUR principles
- [ ] Can implement keyboard navigation
- [ ] Understand semantic HTML importance
- [ ] Basic ARIA usage

### Mid Level (2-4 years)
- [ ] Can implement focus management
- [ ] Proficient with ARIA attributes
- [ ] Can test with screen readers
- [ ] Understand color contrast requirements
- [ ] Can audit accessibility issues
- [ ] Know when to use ARIA vs semantic HTML
- [ ] Can implement accessible forms

### Senior Level (4+ years)
- [ ] Can architect accessible applications
- [ ] Expert in complex ARIA patterns
- [ ] Can handle accessible SPA routing
- [ ] Proficient with screen reader testing
- [ ] Can mentor juniors on accessibility
- [ ] Understand legal requirements (ADA, Section 508)
- [ ] Can implement accessible custom widgets
- [ ] Expert in accessibility testing tools
- [ ] Can design inclusive user experiences

---

## 📊 Progress Tracking

**Fundamentals**
- [ ] 01. WCAG Fundamentals (3 Q&A)
- [ ] 02. Keyboard Navigation (3 Q&A)

**Advanced Topics**
- [ ] 03. Screen Readers (2 Q&A)
- [ ] 04. Testing Accessibility (2 Q&A)

---

## 🔑 Key Concepts

### POUR Principles
```
P - Perceivable
  - Text alternatives for images
  - Captions for videos
  - Adaptable content

O - Operable
  - Keyboard accessible
  - Enough time to interact
  - No seizure-inducing content

U - Understandable
  - Readable text
  - Predictable navigation
  - Input assistance

R - Robust
  - Compatible with assistive tech
  - Valid HTML
  - Progressive enhancement
```

### WCAG Conformance Levels
- **Level A** - Minimum accessibility (basic)
- **Level AA** - Target for most sites (recommended)
- **Level AAA** - Enhanced accessibility (ideal)

### Common ARIA Roles
- **role="button"** - Interactive button
- **role="navigation"** - Navigation landmark
- **role="dialog"** - Modal dialog
- **role="alert"** - Important message
- **role="tablist"** - Tab interface

### Common Mistakes
- Using divs instead of buttons
- Missing alt text for images
- Poor color contrast
- Not managing focus
- Overusing ARIA
- Inaccessible forms
- Missing keyboard support
- Not testing with screen readers

---

## 💡 Accessibility Best Practices

### DO's ✅
- Use semantic HTML first
- Provide text alternatives for images
- Ensure keyboard navigation works
- Manage focus properly
- Test with screen readers
- Use sufficient color contrast (4.5:1 minimum)
- Label all form inputs
- Provide skip links
- Use ARIA when HTML isn't enough
- Test with real users

### DON'Ts ❌
- Use divs for interactive elements
- Rely only on color to convey information
- Skip keyboard testing
- Remove focus outlines without replacement
- Overuse ARIA
- Ignore form labels
- Forget alt text
- Disable zoom
- Use only automated testing
- Ignore mobile accessibility

---

## 🛠️ Tools & Libraries

### Testing Tools
- **axe DevTools** - Browser extension for accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Accessibility audits
- **Pa11y** - Automated accessibility testing

### Screen Readers
- **NVDA** - Free Windows screen reader
- **JAWS** - Popular Windows screen reader
- **VoiceOver** - macOS/iOS screen reader
- **TalkBack** - Android screen reader

### Testing Libraries
- **jest-axe** - Jest matcher for accessibility testing
- **@testing-library/react** - Encourages accessible queries
- **cypress-axe** - Cypress accessibility testing

---

## 📈 Accessibility Standards

### WCAG 2.1 Success Criteria

**Level A (Minimum):**
- Text alternatives for non-text content
- Captions for audio/video
- Keyboard accessible
- Sufficient time to interact

**Level AA (Target):**
- Color contrast 4.5:1 minimum
- Resize text up to 200%
- Multiple navigation mechanisms
- Consistent identification

**Level AAA (Enhanced):**
- Color contrast 7:1 minimum
- Sign language for audio
- Extended time limits
- Context-sensitive help

---

## 📚 Resources

### Official Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Articles & Guides
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [Deque University](https://dequeuniversity.com/)

### Testing
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

[← Back to Main README](../README.md) | [Start Learning →](./wcag-01-fundamentals.md)

**Total:** 10 questions across all accessibility topics (will expand to 40+) ✅
