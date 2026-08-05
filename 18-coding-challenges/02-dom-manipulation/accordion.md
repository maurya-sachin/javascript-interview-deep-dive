# Accordion Component

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Companies:** Airbnb, Uber, Lyft, Pinterest, Shopify, Stripe
**Time:** 20-30 minutes

---

## Problem Statement

Build an accessible accordion component with expand/collapse functionality, single/multiple open modes, keyboard navigation, and smooth animations. The component should allow users to toggle content visibility while maintaining proper accessibility standards.

### Requirements

- ✅ Expand/collapse panels on click
- ✅ Support single-open mode (close others when opening one)
- ✅ Support multiple-open mode (multiple panels open simultaneously)
- ✅ Keyboard navigation (↑↓ arrows, Home, End, Space, Enter)
- ✅ Smooth animations (height transitions)
- ✅ Accessible (ARIA attributes, screen reader support)
- ✅ Focus management
- ✅ Prevent layout shift during animations
- ✅ Support nested accordions
- ✅ Customizable icons and styling
- ✅ Event callbacks (onOpen, onClose, onChange)

---

## Example Usage

```html
<div id="faq-accordion"></div>

<script>
const accordion = new Accordion('#faq-accordion', {
  allowMultiple: false,
  defaultOpen: [0],
  animationDuration: 300,
  onOpen: (index, panel) => {
    console.log('Opened panel:', index);
    // Track analytics
    gtag('event', 'accordion_open', { panel_index: index });
  },
  onClose: (index, panel) => {
    console.log('Closed panel:', index);
  },
  onChange: (openPanels) => {
    console.log('Open panels:', openPanels);
    // Save state to localStorage
    localStorage.setItem('accordion_state', JSON.stringify(openPanels));
  }
});

// Public API
accordion.open(2);           // Open panel at index 2
accordion.close(1);          // Close panel at index 1
accordion.toggle(0);         // Toggle panel at index 0
accordion.openAll();         // Open all panels
accordion.closeAll();        // Close all panels
accordion.getOpenPanels();   // Returns [0, 2]
accordion.destroy();         // Cleanup
</script>
```

### HTML Structure

```html
<div class="accordion" id="faq-accordion">
  <div class="accordion-panel" data-accordion-panel>
    <button class="accordion-trigger" data-accordion-trigger>
      <span class="accordion-title">What is your return policy?</span>
      <span class="accordion-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </span>
    </button>
    <div class="accordion-content" data-accordion-content>
      <div class="accordion-content-inner">
        <p>We offer a 30-day money-back guarantee on all products.</p>
      </div>
    </div>
  </div>

  <div class="accordion-panel" data-accordion-panel>
    <button class="accordion-trigger" data-accordion-trigger>
      <span class="accordion-title">How long does shipping take?</span>
      <span class="accordion-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </span>
    </button>
    <div class="accordion-content" data-accordion-content>
      <div class="accordion-content-inner">
        <p>Standard shipping takes 5-7 business days. Express shipping is available.</p>
      </div>
    </div>
  </div>

  <div class="accordion-panel" data-accordion-panel>
    <button class="accordion-trigger" data-accordion-trigger>
      <span class="accordion-title">Do you ship internationally?</span>
      <span class="accordion-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </span>
    </button>
    <div class="accordion-content" data-accordion-content>
      <div class="accordion-content-inner">
        <p>Yes, we ship to over 100 countries worldwide.</p>
      </div>
    </div>
  </div>
</div>
```

---

## Solution 1: Vanilla JavaScript Implementation

```javascript
class Accordion {
  constructor(container, options = {}) {
    // Configuration
    this.options = {
      allowMultiple: options.allowMultiple !== undefined ? options.allowMultiple : false,
      defaultOpen: options.defaultOpen || [],
      animationDuration: options.animationDuration || 300,
      onOpen: options.onOpen || (() => {}),
      onClose: options.onClose || (() => {}),
      onChange: options.onChange || (() => {}),
      scrollToPanel: options.scrollToPanel !== undefined ? options.scrollToPanel : true,
      scrollOffset: options.scrollOffset || 20,
    };

    // Get container element
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!this.container) {
      throw new Error('Accordion container not found');
    }

    // Get all panels
    this.panels = Array.from(
      this.container.querySelectorAll('[data-accordion-panel]')
    );

    if (this.panels.length === 0) {
      throw new Error('No accordion panels found');
    }

    // State
    this.state = {
      openPanels: new Set(),
      isAnimating: false,
    };

    // Initialize
    this.init();
  }

  init() {
    // Setup ARIA attributes
    this.setupARIA();

    // Attach event listeners
    this.attachEventListeners();

    // Open default panels
    this.openDefaultPanels();
  }

  setupARIA() {
    this.panels.forEach((panel, index) => {
      const trigger = panel.querySelector('[data-accordion-trigger]');
      const content = panel.querySelector('[data-accordion-content]');

      if (!trigger || !content) {
        console.warn(`Panel ${index} is missing trigger or content element`);
        return;
      }

      // Generate unique IDs
      const triggerId = `accordion-trigger-${this.generateId()}-${index}`;
      const contentId = `accordion-content-${this.generateId()}-${index}`;

      // Set ARIA attributes on trigger
      trigger.setAttribute('id', triggerId);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', contentId);

      // Set ARIA attributes on content
      content.setAttribute('id', contentId);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', triggerId);

      // Store index on panel
      panel.dataset.index = index;

      // Hide content initially
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';
      content.style.transition = `max-height ${this.options.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    });
  }

  attachEventListeners() {
    // Event delegation for clicks
    this.container.addEventListener('click', this.handleClick.bind(this));

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  handleClick(event) {
    const trigger = event.target.closest('[data-accordion-trigger]');
    if (!trigger) return;

    event.preventDefault();

    const panel = trigger.closest('[data-accordion-panel]');
    const index = parseInt(panel.dataset.index, 10);

    this.toggle(index);
  }

  handleKeyboard(event) {
    const trigger = event.target.closest('[data-accordion-trigger]');
    if (!trigger) return;

    const panel = trigger.closest('[data-accordion-panel]');
    const currentIndex = parseInt(panel.dataset.index, 10);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusPanel((currentIndex + 1) % this.panels.length);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusPanel(
          (currentIndex - 1 + this.panels.length) % this.panels.length
        );
        break;

      case 'Home':
        event.preventDefault();
        this.focusPanel(0);
        break;

      case 'End':
        event.preventDefault();
        this.focusPanel(this.panels.length - 1);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggle(currentIndex);
        break;
    }
  }

  focusPanel(index) {
    const panel = this.panels[index];
    if (!panel) return;

    const trigger = panel.querySelector('[data-accordion-trigger]');
    if (trigger) {
      trigger.focus();
    }
  }

  toggle(index) {
    const isOpen = this.state.openPanels.has(index);

    if (isOpen) {
      this.close(index);
    } else {
      this.open(index);
    }
  }

  open(index) {
    const panel = this.panels[index];
    if (!panel) return;

    // Close other panels if not allowing multiple
    if (!this.options.allowMultiple) {
      this.closeAll(index);
    }

    const trigger = panel.querySelector('[data-accordion-trigger]');
    const content = panel.querySelector('[data-accordion-content]');

    if (!trigger || !content) return;

    // Already open
    if (this.state.openPanels.has(index)) return;

    // Update state
    this.state.openPanels.add(index);

    // Update ARIA
    trigger.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');

    // Animate height
    const contentInner = content.querySelector('.accordion-content-inner');
    const targetHeight = contentInner ? contentInner.scrollHeight : content.scrollHeight;

    // Force reflow to ensure transition works
    content.style.maxHeight = '0';
    void content.offsetHeight;

    // Set target height
    content.style.maxHeight = `${targetHeight}px`;

    // Remove max-height after animation completes
    setTimeout(() => {
      if (this.state.openPanels.has(index)) {
        content.style.maxHeight = 'none';
      }
    }, this.options.animationDuration);

    // Scroll to panel if enabled
    if (this.options.scrollToPanel) {
      this.scrollToPanel(panel);
    }

    // Callbacks
    this.options.onOpen(index, panel);
    this.options.onChange(Array.from(this.state.openPanels));

    // Emit custom event
    this.container.dispatchEvent(
      new CustomEvent('accordion:open', {
        detail: { index, panel },
        bubbles: true,
      })
    );
  }

  close(index) {
    const panel = this.panels[index];
    if (!panel) return;

    const trigger = panel.querySelector('[data-accordion-trigger]');
    const content = panel.querySelector('[data-accordion-content]');

    if (!trigger || !content) return;

    // Already closed
    if (!this.state.openPanels.has(index)) return;

    // Update state
    this.state.openPanels.delete(index);

    // Update ARIA
    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');

    // Animate height
    // Get current height
    const currentHeight = content.scrollHeight;

    // Set current height explicitly
    content.style.maxHeight = `${currentHeight}px`;

    // Force reflow
    void content.offsetHeight;

    // Collapse
    content.style.maxHeight = '0';

    // Callbacks
    this.options.onClose(index, panel);
    this.options.onChange(Array.from(this.state.openPanels));

    // Emit custom event
    this.container.dispatchEvent(
      new CustomEvent('accordion:close', {
        detail: { index, panel },
        bubbles: true,
      })
    );
  }

  openAll() {
    if (!this.options.allowMultiple) {
      console.warn('Cannot open all panels when allowMultiple is false');
      return;
    }

    this.panels.forEach((_, index) => {
      this.open(index);
    });
  }

  closeAll(exceptIndex = -1) {
    this.panels.forEach((_, index) => {
      if (index !== exceptIndex) {
        this.close(index);
      }
    });
  }

  openDefaultPanels() {
    this.options.defaultOpen.forEach((index) => {
      if (index >= 0 && index < this.panels.length) {
        this.open(index);
      }
    });
  }

  scrollToPanel(panel) {
    setTimeout(() => {
      const rect = panel.getBoundingClientRect();
      const offset = this.options.scrollOffset;

      if (rect.top < offset) {
        window.scrollBy({
          top: rect.top - offset,
          behavior: 'smooth',
        });
      }
    }, this.options.animationDuration / 2);
  }

  getOpenPanels() {
    return Array.from(this.state.openPanels);
  }

  isOpen(index) {
    return this.state.openPanels.has(index);
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  destroy() {
    // Remove event listeners
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('keydown', this.handleKeyboard);

    // Reset state
    this.state.openPanels.clear();

    // Remove inline styles
    this.panels.forEach((panel) => {
      const content = panel.querySelector('[data-accordion-content]');
      if (content) {
        content.style.maxHeight = '';
        content.style.overflow = '';
        content.style.transition = '';
      }
      panel.classList.remove('is-open');
    });
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Accordion };
}
```

---

## Complete CSS Styles

```css
/* Accordion container */
.accordion {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Panel */
.accordion-panel {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s ease;
}

.accordion-panel:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.accordion-panel:last-child {
  margin-bottom: 0;
}

.accordion-panel.is-open {
  border-color: #4A90E2;
}

/* Trigger button */
.accordion-trigger {
  width: 100%;
  padding: 18px 20px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  transition: background-color 0.2s ease;
  outline: none;
}

.accordion-trigger:hover {
  background-color: #f5f5f5;
}

.accordion-trigger:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: -2px;
}

/* Title */
.accordion-title {
  flex: 1;
  line-height: 1.5;
}

/* Icon */
.accordion-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #666;
}

.accordion-panel.is-open .accordion-icon {
  transform: rotate(180deg);
  color: #4A90E2;
}

.accordion-icon svg {
  display: block;
  fill: currentColor;
}

/* Content wrapper */
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Content inner (for padding) */
.accordion-content-inner {
  padding: 0 20px 20px 20px;
  color: #555;
  line-height: 1.6;
}

.accordion-content-inner p {
  margin: 0 0 12px 0;
}

.accordion-content-inner p:last-child {
  margin-bottom: 0;
}

/* Content elements */
.accordion-content-inner h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #333;
}

.accordion-content-inner ul,
.accordion-content-inner ol {
  margin: 0 0 12px 20px;
  padding: 0;
}

.accordion-content-inner li {
  margin-bottom: 8px;
}

.accordion-content-inner a {
  color: #4A90E2;
  text-decoration: none;
}

.accordion-content-inner a:hover {
  text-decoration: underline;
}

.accordion-content-inner code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

/* Nested accordions */
.accordion-content-inner .accordion {
  margin-top: 16px;
}

.accordion-content-inner .accordion .accordion-panel {
  background: #f9f9f9;
  border-color: #d0d0d0;
}

/* States */
.accordion-panel:focus-within {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

/* Loading state */
.accordion-panel.is-loading .accordion-trigger {
  opacity: 0.6;
  pointer-events: none;
}

/* Disabled state */
.accordion-panel[aria-disabled="true"] .accordion-trigger {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .accordion {
    max-width: 100%;
  }

  .accordion-trigger {
    padding: 14px 16px;
    font-size: 15px;
  }

  .accordion-content-inner {
    padding: 0 16px 16px 16px;
    font-size: 14px;
  }

  .accordion-icon {
    width: 20px;
    height: 20px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .accordion-panel {
    border-width: 2px;
  }

  .accordion-trigger:focus-visible {
    outline-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .accordion-content {
    transition: none;
  }

  .accordion-icon {
    transition: none;
  }

  .accordion-trigger {
    transition: none;
  }
}

/* Print styles */
@media print {
  .accordion-panel {
    border: 1px solid #000;
    page-break-inside: avoid;
  }

  .accordion-content {
    max-height: none !important;
    overflow: visible !important;
  }

  .accordion-icon {
    display: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .accordion-panel {
    background: #1e1e1e;
    border-color: #444;
  }

  .accordion-trigger {
    color: #e0e0e0;
  }

  .accordion-trigger:hover {
    background-color: #2a2a2a;
  }

  .accordion-content-inner {
    color: #b0b0b0;
  }

  .accordion-content-inner h3 {
    color: #e0e0e0;
  }

  .accordion-content-inner code {
    background: #2a2a2a;
  }
}
```

---

## Solution 2: React Implementation

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function AccordionPanel({
  index,
  title,
  children,
  isOpen,
  onToggle,
  animationDuration = 300
}) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const contentInner = contentRef.current.querySelector('.accordion-content-inner');
      setHeight(contentInner ? contentInner.scrollHeight : 0);
    }
  }, [children]);

  const handleClick = () => {
    onToggle(index);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(index);
    }
  };

  return (
    <div
      className={`accordion-panel ${isOpen ? 'is-open' : ''}`}
      data-accordion-panel
    >
      <button
        className="accordion-trigger"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${index}`}
        id={`accordion-trigger-${index}`}
        data-accordion-trigger
      >
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M7 10l5 5 5-5z"/>
          </svg>
        </span>
      </button>
      <div
        ref={contentRef}
        className="accordion-content"
        id={`accordion-content-${index}`}
        role="region"
        aria-labelledby={`accordion-trigger-${index}`}
        style={{
          maxHeight: isOpen ? `${height}px` : '0',
          transition: `max-height ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        }}
        data-accordion-content
      >
        <div className="accordion-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

function Accordion({
  children,
  allowMultiple = false,
  defaultOpen = [],
  animationDuration = 300,
  onOpen,
  onClose,
  onChange
}) {
  const [openPanels, setOpenPanels] = useState(new Set(defaultOpen));
  const containerRef = useRef(null);

  useEffect(() => {
    onChange?.(Array.from(openPanels));
  }, [openPanels, onChange]);

  const handleToggle = useCallback((index) => {
    setOpenPanels((prev) => {
      const newOpenPanels = new Set(prev);

      if (newOpenPanels.has(index)) {
        // Close panel
        newOpenPanels.delete(index);
        onClose?.(index);
      } else {
        // Open panel
        if (!allowMultiple) {
          // Close all other panels
          newOpenPanels.clear();
        }
        newOpenPanels.add(index);
        onOpen?.(index);
      }

      return newOpenPanels;
    });
  }, [allowMultiple, onOpen, onClose]);

  const handleKeyDown = useCallback((e) => {
    const trigger = e.target.closest('[data-accordion-trigger]');
    if (!trigger) return;

    const panel = trigger.closest('[data-accordion-panel]');
    const panels = Array.from(containerRef.current.querySelectorAll('[data-accordion-panel]'));
    const currentIndex = panels.indexOf(panel);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % panels.length;
        panels[nextIndex]?.querySelector('[data-accordion-trigger]')?.focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + panels.length) % panels.length;
        panels[prevIndex]?.querySelector('[data-accordion-trigger]')?.focus();
        break;

      case 'Home':
        e.preventDefault();
        panels[0]?.querySelector('[data-accordion-trigger]')?.focus();
        break;

      case 'End':
        e.preventDefault();
        panels[panels.length - 1]?.querySelector('[data-accordion-trigger]')?.focus();
        break;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="accordion"
      onKeyDown={handleKeyDown}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;

        return React.cloneElement(child, {
          index,
          isOpen: openPanels.has(index),
          onToggle: handleToggle,
          animationDuration
        });
      })}
    </div>
  );
}

// Export
export { Accordion, AccordionPanel };

// Example usage:
// <Accordion allowMultiple={false} defaultOpen={[0]}>
//   <AccordionPanel title="Question 1">
//     <p>Answer 1</p>
//   </AccordionPanel>
//   <AccordionPanel title="Question 2">
//     <p>Answer 2</p>
//   </AccordionPanel>
// </Accordion>
```

---

## Test Cases

```javascript
describe('Accordion', () => {
  let container;
  let accordion;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-accordion" class="accordion">
        <div class="accordion-panel" data-accordion-panel>
          <button class="accordion-trigger" data-accordion-trigger>
            <span class="accordion-title">Panel 1</span>
          </button>
          <div class="accordion-content" data-accordion-content>
            <div class="accordion-content-inner">Content 1</div>
          </div>
        </div>
        <div class="accordion-panel" data-accordion-panel>
          <button class="accordion-trigger" data-accordion-trigger>
            <span class="accordion-title">Panel 2</span>
          </button>
          <div class="accordion-content" data-accordion-content>
            <div class="accordion-content-inner">Content 2</div>
          </div>
        </div>
        <div class="accordion-panel" data-accordion-panel>
          <button class="accordion-trigger" data-accordion-trigger>
            <span class="accordion-title">Panel 3</span>
          </button>
          <div class="accordion-content" data-accordion-content>
            <div class="accordion-content-inner">Content 3</div>
          </div>
        </div>
      </div>
    `;
    container = document.getElementById('test-accordion');
  });

  afterEach(() => {
    accordion?.destroy();
  });

  test('initializes with correct ARIA attributes', () => {
    accordion = new Accordion('#test-accordion');

    const triggers = container.querySelectorAll('[data-accordion-trigger]');
    triggers.forEach((trigger) => {
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    });
  });

  test('opens panel on click', () => {
    accordion = new Accordion('#test-accordion');
    const trigger = container.querySelector('[data-accordion-trigger]');

    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(accordion.isOpen(0)).toBe(true);
  });

  test('closes other panels in single mode', () => {
    accordion = new Accordion('#test-accordion', {
      allowMultiple: false
    });

    const triggers = container.querySelectorAll('[data-accordion-trigger]');

    triggers[0].click();
    expect(accordion.isOpen(0)).toBe(true);

    triggers[1].click();
    expect(accordion.isOpen(0)).toBe(false);
    expect(accordion.isOpen(1)).toBe(true);
  });

  test('allows multiple panels open in multiple mode', () => {
    accordion = new Accordion('#test-accordion', {
      allowMultiple: true
    });

    const triggers = container.querySelectorAll('[data-accordion-trigger]');

    triggers[0].click();
    triggers[1].click();

    expect(accordion.isOpen(0)).toBe(true);
    expect(accordion.isOpen(1)).toBe(true);
  });

  test('keyboard navigation with ArrowDown', () => {
    accordion = new Accordion('#test-accordion');
    const triggers = container.querySelectorAll('[data-accordion-trigger]');

    triggers[0].focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    triggers[0].dispatchEvent(event);

    expect(document.activeElement).toBe(triggers[1]);
  });

  test('keyboard navigation with ArrowUp', () => {
    accordion = new Accordion('#test-accordion');
    const triggers = container.querySelectorAll('[data-accordion-trigger]');

    triggers[1].focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    triggers[1].dispatchEvent(event);

    expect(document.activeElement).toBe(triggers[0]);
  });

  test('Home key focuses first panel', () => {
    accordion = new Accordion('#test-accordion');
    const triggers = container.querySelectorAll('[data-accordion-trigger]');

    triggers[2].focus();
    const event = new KeyboardEvent('keydown', { key: 'Home' });
    triggers[2].dispatchEvent(event);

    expect(document.activeElement).toBe(triggers[0]);
  });

  test('End key focuses last panel', () => {
    accordion = new Accordion('#test-accordion');
    const triggers = container.querySelectorAll('[data-accordion-trigger]');

    triggers[0].focus();
    const event = new KeyboardEvent('keydown', { key: 'End' });
    triggers[0].dispatchEvent(event);

    expect(document.activeElement).toBe(triggers[2]);
  });

  test('Enter key toggles panel', () => {
    accordion = new Accordion('#test-accordion');
    const trigger = container.querySelector('[data-accordion-trigger]');

    trigger.focus();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    trigger.dispatchEvent(event);

    expect(accordion.isOpen(0)).toBe(true);
  });

  test('Space key toggles panel', () => {
    accordion = new Accordion('#test-accordion');
    const trigger = container.querySelector('[data-accordion-trigger]');

    trigger.focus();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    trigger.dispatchEvent(event);

    expect(accordion.isOpen(0)).toBe(true);
  });

  test('opens default panels', () => {
    accordion = new Accordion('#test-accordion', {
      defaultOpen: [0, 2],
      allowMultiple: true
    });

    expect(accordion.isOpen(0)).toBe(true);
    expect(accordion.isOpen(2)).toBe(true);
  });

  test('calls onOpen callback', () => {
    const onOpen = jest.fn();
    accordion = new Accordion('#test-accordion', { onOpen });

    accordion.open(0);

    expect(onOpen).toHaveBeenCalledWith(0, expect.any(Element));
  });

  test('calls onClose callback', () => {
    const onClose = jest.fn();
    accordion = new Accordion('#test-accordion', { onClose });

    accordion.open(0);
    accordion.close(0);

    expect(onClose).toHaveBeenCalledWith(0, expect.any(Element));
  });

  test('calls onChange callback', () => {
    const onChange = jest.fn();
    accordion = new Accordion('#test-accordion', { onChange });

    accordion.open(0);

    expect(onChange).toHaveBeenCalledWith([0]);
  });

  test('openAll works in multiple mode', () => {
    accordion = new Accordion('#test-accordion', {
      allowMultiple: true
    });

    accordion.openAll();

    expect(accordion.getOpenPanels()).toEqual([0, 1, 2]);
  });

  test('closeAll closes all panels', () => {
    accordion = new Accordion('#test-accordion', {
      allowMultiple: true,
      defaultOpen: [0, 1, 2]
    });

    accordion.closeAll();

    expect(accordion.getOpenPanels()).toEqual([]);
  });

  test('toggle method works', () => {
    accordion = new Accordion('#test-accordion');

    accordion.toggle(0);
    expect(accordion.isOpen(0)).toBe(true);

    accordion.toggle(0);
    expect(accordion.isOpen(0)).toBe(false);
  });

  test('emits custom events', () => {
    accordion = new Accordion('#test-accordion');
    const openListener = jest.fn();
    const closeListener = jest.fn();

    container.addEventListener('accordion:open', openListener);
    container.addEventListener('accordion:close', closeListener);

    accordion.open(0);
    expect(openListener).toHaveBeenCalled();

    accordion.close(0);
    expect(closeListener).toHaveBeenCalled();
  });

  test('destroy removes event listeners', () => {
    accordion = new Accordion('#test-accordion');
    const trigger = container.querySelector('[data-accordion-trigger]');

    accordion.destroy();
    trigger.click();

    // Should not open after destroy
    expect(accordion.isOpen(0)).toBe(false);
  });

  test('handles missing trigger/content gracefully', () => {
    container.innerHTML = `
      <div class="accordion-panel" data-accordion-panel>
        <button data-accordion-trigger>Trigger</button>
      </div>
    `;

    expect(() => {
      accordion = new Accordion('#test-accordion');
    }).not.toThrow();
  });
});
```

---

## Common Mistakes

### ❌ Mistake 1: Using display:none for Animations

```javascript
// BAD - No smooth animation
content.style.display = isOpen ? 'block' : 'none';
```

✅ **Correct:**

```javascript
// Use max-height for smooth transitions
content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : '0';
content.style.overflow = 'hidden';
content.style.transition = 'max-height 0.3s ease';
```

### ❌ Mistake 2: Not Closing Other Panels in Single Mode

```javascript
// BAD - Allows multiple panels open in single mode
function open(index) {
  this.openPanels.add(index);
}
```

✅ **Correct:**

```javascript
function open(index) {
  if (!this.allowMultiple) {
    this.closeAll(index); // Close others first
  }
  this.openPanels.add(index);
}
```

### ❌ Mistake 3: Missing Keyboard Navigation

```javascript
// BAD - Only click support
trigger.addEventListener('click', toggle);
```

✅ **Correct:**

```javascript
// Support both click and keyboard
trigger.addEventListener('click', toggle);
container.addEventListener('keydown', handleKeyboard);

function handleKeyboard(e) {
  switch(e.key) {
    case 'ArrowDown': // Focus next
    case 'ArrowUp':   // Focus previous
    case 'Home':      // Focus first
    case 'End':       // Focus last
    case 'Enter':     // Toggle
    case ' ':         // Toggle
  }
}
```

### ❌ Mistake 4: Missing ARIA Attributes

```javascript
// BAD - No accessibility
<button>Toggle</button>
<div>Content</div>
```

✅ **Correct:**

```javascript
<button
  aria-expanded="false"
  aria-controls="content-id"
  id="trigger-id"
>
  Toggle
</button>
<div
  id="content-id"
  role="region"
  aria-labelledby="trigger-id"
>
  Content
</div>
```

### ❌ Mistake 5: Not Preventing Layout Shift

```javascript
// BAD - Causes layout shift during animation
content.style.height = isOpen ? 'auto' : '0';
```

✅ **Correct:**

```javascript
// Explicitly set height to prevent shift
const height = content.scrollHeight;
content.style.maxHeight = isOpen ? `${height}px` : '0';

// Remove max-height after animation
setTimeout(() => {
  if (isOpen) content.style.maxHeight = 'none';
}, animationDuration);
```

---

## Complexity Analysis

### Time Complexity
- **Open/Close:** O(1) - Constant time for toggling state
- **Keyboard Navigation:** O(1) - Direct array access by index
- **Open All:** O(n) - Must iterate through all panels
- **Close All:** O(n) - Must iterate through all panels

### Space Complexity
- **State Storage:** O(n) - Store open/closed state for n panels
- **DOM References:** O(n) - Store references to all panels
- **Overall:** O(n) where n = number of panels

---

## Real-World Applications

1. **FAQ Sections** - Support pages, help centers
2. **Product Specifications** - E-commerce product details
3. **Form Sections** - Multi-step forms, checkout flows
4. **Navigation Menus** - Mobile navigation, sidebar menus
5. **Settings Panels** - User preferences, configuration options
6. **Dashboard Widgets** - Collapsible data sections

---

## Follow-up Questions

**Performance:**
- "How would you optimize for 100+ panels?"
  - Virtual scrolling for large lists
  - Lazy render content (only render when opened)
  - Use CSS transforms instead of max-height

**Features:**
- "How to add smooth scroll to opened panel?"
  - Use `scrollIntoView()` with `behavior: 'smooth'`
  - Account for fixed headers with offset

**Accessibility:**
- "How to support screen readers better?"
  - Add `aria-live` regions for dynamic content
  - Announce open/close state changes
  - Add descriptive `aria-label` for icons

**State Management:**
- "How to persist accordion state?"
  - Save open panels to localStorage
  - Restore state on mount
  - Clear on logout/session end

**Advanced:**
- "How to support nested accordions?"
  - Separate state management per level
  - Prevent event bubbling between levels
  - Different styling for nested panels

**Animation:**
- "Why use max-height instead of height:auto?"
  - `height: auto` cannot be animated
  - `max-height` allows smooth transitions
  - Use large max-height or calculate exact height

---

## Resources

- [WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [MDN: ARIA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques)
- [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)

---

[← Back to DOM Manipulation Problems](../README.md)
