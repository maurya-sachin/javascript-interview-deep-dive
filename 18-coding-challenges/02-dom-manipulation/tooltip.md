# Tooltip Component

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Companies:** Atlassian, Stripe, Shopify, Adobe
**Time:** 25-35 minutes

---

## Problem Statement

Build a smart tooltip component with hover/focus triggers, automatic positioning (with viewport edge detection), arrow pointer, delay control, and full accessibility support.

### Requirements

- ✅ Show on hover/focus, hide on mouseleave/blur
- ✅ Auto-position (top, right, bottom, left)
- ✅ Flip position if near viewport edge
- ✅ Arrow pointing to trigger element
- ✅ Configurable show/hide delay
- ✅ Accessible (role="tooltip", aria-describedby)
- ✅ Portal rendering (avoid overflow:hidden clipping)
- ✅ Hide on scroll
- ✅ Single tooltip instance (hide previous when showing new)

---

## Solution

### Vanilla JavaScript Implementation

```javascript
class Tooltip {
  constructor(options = {}) {
    this.showDelay = options.showDelay || 200;
    this.hideDelay = options.hideDelay || 0;
    this.offset = options.offset || 10;
    this.container = options.container || document.body;

    this.tooltip = null;
    this.arrow = null;
    this.currentTrigger = null;
    this.showTimeout = null;
    this.hideTimeout = null;

    this.init();
  }

  init() {
    // Event delegation on document
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
    document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
    document.addEventListener('focus', this.handleFocus.bind(this), true);
    document.addEventListener('blur', this.handleBlur.bind(this), true);

    // Hide on scroll
    window.addEventListener('scroll', this.hide.bind(this), true);

    // Inject styles
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('tooltip-styles')) return;

    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    style.textContent = `
      .tooltip {
        position: fixed;
        z-index: 9999;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        max-width: 200px;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }

      .tooltip-visible {
        opacity: 1;
      }

      .tooltip-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border: 6px solid transparent;
      }

      .tooltip-arrow-top {
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #333;
      }

      .tooltip-arrow-bottom {
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #333;
      }

      .tooltip-arrow-left {
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: #333;
      }

      .tooltip-arrow-right {
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  handleMouseEnter(e) {
    const trigger = e.target.closest('[data-tooltip]');
    if (!trigger) return;

    this.scheduleShow(trigger);
  }

  handleMouseLeave(e) {
    const trigger = e.target.closest('[data-tooltip]');
    if (!trigger) return;

    this.scheduleHide();
  }

  handleFocus(e) {
    if (e.target.hasAttribute('data-tooltip')) {
      this.scheduleShow(e.target);
    }
  }

  handleBlur(e) {
    if (e.target.hasAttribute('data-tooltip')) {
      this.scheduleHide();
    }
  }

  scheduleShow(trigger) {
    this.clearTimeouts();

    this.showTimeout = setTimeout(() => {
      this.show(trigger);
    }, this.showDelay);
  }

  scheduleHide() {
    this.clearTimeouts();

    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, this.hideDelay);
  }

  show(trigger) {
    // Hide existing tooltip
    this.hide();

    this.currentTrigger = trigger;

    const content = trigger.getAttribute('data-tooltip');
    const preferredPosition = trigger.getAttribute('data-tooltip-position') || 'top';

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.textContent = content;
    this.tooltip.setAttribute('role', 'tooltip');

    // Create arrow
    this.arrow = document.createElement('div');
    this.arrow.className = 'tooltip-arrow';
    this.tooltip.appendChild(this.arrow);

    // Add to DOM (portal rendering)
    this.container.appendChild(this.tooltip);

    // Position tooltip
    this.position(trigger, preferredPosition);

    // Accessibility
    const tooltipId = `tooltip-${Date.now()}`;
    this.tooltip.id = tooltipId;
    trigger.setAttribute('aria-describedby', tooltipId);

    // Animate in
    requestAnimationFrame(() => {
      this.tooltip.classList.add('tooltip-visible');
    });
  }

  position(trigger, preferredPosition) {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Try preferred position first
    let position = this.calculatePosition(triggerRect, tooltipRect, preferredPosition);

    // Check if tooltip would overflow viewport
    const overflow = this.checkOverflow(position, tooltipRect);

    // Flip if overflowing
    if (overflow) {
      const oppositePosition = this.getOppositePosition(preferredPosition);
      position = this.calculatePosition(triggerRect, tooltipRect, oppositePosition);
    }

    // Apply position
    this.tooltip.style.left = `${position.left}px`;
    this.tooltip.style.top = `${position.top}px`;

    // Position arrow
    this.positionArrow(position.placement);
  }

  calculatePosition(triggerRect, tooltipRect, placement) {
    let left, top;

    switch(placement) {
      case 'top':
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        top = triggerRect.top - tooltipRect.height - this.offset;
        break;

      case 'bottom':
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        top = triggerRect.bottom + this.offset;
        break;

      case 'left':
        left = triggerRect.left - tooltipRect.width - this.offset;
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;

      case 'right':
        left = triggerRect.right + this.offset;
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;
    }

    return { left, top, placement };
  }

  checkOverflow(position, tooltipRect) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    return (
      position.left < 0 ||
      position.top < 0 ||
      position.left + tooltipRect.width > viewport.width ||
      position.top + tooltipRect.height > viewport.height
    );
  }

  getOppositePosition(position) {
    const opposites = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    return opposites[position];
  }

  positionArrow(placement) {
    this.arrow.className = `tooltip-arrow tooltip-arrow-${placement}`;
  }

  hide() {
    if (!this.tooltip) return;

    this.tooltip.classList.remove('tooltip-visible');

    setTimeout(() => {
      if (this.tooltip && this.tooltip.parentNode) {
        this.tooltip.parentNode.removeChild(this.tooltip);
      }

      if (this.currentTrigger) {
        this.currentTrigger.removeAttribute('aria-describedby');
      }

      this.tooltip = null;
      this.arrow = null;
      this.currentTrigger = null;
    }, 200); // Match CSS transition duration
  }

  clearTimeouts() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  destroy() {
    this.hide();
    this.clearTimeouts();

    document.removeEventListener('mouseenter', this.handleMouseEnter, true);
    document.removeEventListener('mouseleave', this.handleMouseLeave, true);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('blur', this.handleBlur, true);
    window.removeEventListener('scroll', this.hide, true);
  }
}

// Usage
const tooltip = new Tooltip({
  showDelay: 200,
  hideDelay: 100,
  offset: 10
});
```

### HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Tooltip Demo</title>
  <style>
    body {
      padding: 100px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .demo-section {
      margin: 40px 0;
    }

    button, .tooltip-trigger {
      padding: 10px 20px;
      margin: 10px;
      border: 2px solid #333;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover, .tooltip-trigger:hover {
      background: #f0f0f0;
    }

    .icon {
      display: inline-block;
      width: 20px;
      height: 20px;
      background: #4A90E2;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      cursor: help;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Tooltip Component Demo</h1>

  <div class="demo-section">
    <h2>Basic Tooltips</h2>
    <button data-tooltip="This is a helpful tooltip!" data-tooltip-position="top">
      Hover me (top)
    </button>

    <button data-tooltip="Bottom positioned tooltip" data-tooltip-position="bottom">
      Hover me (bottom)
    </button>

    <button data-tooltip="Left positioned tooltip" data-tooltip-position="left">
      Hover me (left)
    </button>

    <button data-tooltip="Right positioned tooltip" data-tooltip-position="right">
      Hover me (right)
    </button>
  </div>

  <div class="demo-section">
    <h2>Icon with Tooltip</h2>
    <p>
      Need help?
      <span class="icon" data-tooltip="Click to get support" tabindex="0">?</span>
    </p>
  </div>

  <div class="demo-section">
    <h2>Edge Detection (hover near edges)</h2>
    <div style="position: absolute; top: 10px; left: 10px;">
      <button data-tooltip="Auto-flips to bottom-right" data-tooltip-position="top">
        Top-left corner
      </button>
    </div>

    <div style="position: absolute; top: 10px; right: 10px;">
      <button data-tooltip="Auto-flips to bottom-left" data-tooltip-position="top">
        Top-right corner
      </button>
    </div>

    <div style="position: absolute; bottom: 10px; left: 10px;">
      <button data-tooltip="Auto-flips to top-right" data-tooltip-position="bottom">
        Bottom-left corner
      </button>
    </div>
  </div>

  <script src="tooltip.js"></script>
  <script>
    // Initialize tooltip
    const tooltip = new Tooltip({
      showDelay: 200,
      hideDelay: 100,
      offset: 10
    });
  </script>
</body>
</html>
```

---

## React Implementation

```jsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function Tooltip({ children, content, position = 'top', showDelay = 200, hideDelay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(position);

  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const offset = 10;

  const calculatePosition = (triggerRect, tooltipRect, placement) => {
    let left, top;

    switch(placement) {
      case 'top':
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        top = triggerRect.top - tooltipRect.height - offset;
        break;

      case 'bottom':
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        top = triggerRect.bottom + offset;
        break;

      case 'left':
        left = triggerRect.left - tooltipRect.width - offset;
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;

      case 'right':
        left = triggerRect.right + offset;
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;

      default:
        left = triggerRect.left;
        top = triggerRect.top;
    }

    return { left, top, placement };
  };

  const checkOverflow = (pos, tooltipRect) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    return (
      pos.left < 0 ||
      pos.top < 0 ||
      pos.left + tooltipRect.width > viewport.width ||
      pos.top + tooltipRect.height > viewport.height
    );
  };

  const getOppositePosition = (pos) => {
    const opposites = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    return opposites[pos];
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let pos = calculatePosition(triggerRect, tooltipRect, position);

    // Check overflow and flip if needed
    if (checkOverflow(pos, tooltipRect)) {
      const oppositePlacement = getOppositePosition(position);
      pos = calculatePosition(triggerRect, tooltipRect, oppositePlacement);
      setActualPlacement(oppositePlacement);
    } else {
      setActualPlacement(position);
    }

    setTooltipPosition({ top: pos.top, left: pos.left });
  };

  const handleMouseEnter = () => {
    clearTimeout(hideTimeoutRef.current);

    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);
  };

  const handleMouseLeave = () => {
    clearTimeout(showTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  };

  const handleFocus = () => {
    handleMouseEnter();
  };

  const handleBlur = () => {
    handleMouseLeave();
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();

      // Update on scroll
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={isVisible ? 'tooltip' : undefined}
      >
        {children}
      </span>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 9999,
            background: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            maxWidth: '200px',
            pointerEvents: 'none'
          }}
        >
          {content}
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              border: '6px solid transparent',
              ...(actualPlacement === 'top' && {
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderTopColor: '#333'
              }),
              ...(actualPlacement === 'bottom' && {
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderBottomColor: '#333'
              }),
              ...(actualPlacement === 'left' && {
                right: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderLeftColor: '#333'
              }),
              ...(actualPlacement === 'right' && {
                left: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRightColor: '#333'
              })
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}

// Usage
function App() {
  return (
    <div style={{ padding: '100px' }}>
      <h1>Tooltip Demo</h1>

      <div style={{ margin: '20px 0' }}>
        <Tooltip content="This is a helpful tooltip!" position="top">
          <button>Hover me (top)</button>
        </Tooltip>

        <Tooltip content="Bottom positioned tooltip" position="bottom">
          <button style={{ marginLeft: '10px' }}>Hover me (bottom)</button>
        </Tooltip>

        <Tooltip content="Left positioned tooltip" position="left">
          <button style={{ marginLeft: '10px' }}>Hover me (left)</button>
        </Tooltip>

        <Tooltip content="Right positioned tooltip" position="right">
          <button style={{ marginLeft: '10px' }}>Hover me (right)</button>
        </Tooltip>
      </div>

      <div style={{ margin: '40px 0' }}>
        <p>
          Need help?
          <Tooltip content="Click to get support" position="top">
            <span
              tabIndex={0}
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                background: '#4A90E2',
                color: 'white',
                borderRadius: '50%',
                textAlign: 'center',
                lineHeight: '20px',
                cursor: 'help',
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}
            >
              ?
            </span>
          </Tooltip>
        </p>
      </div>
    </div>
  );
}

export default App;
```

---

## Test Cases

```javascript
describe('Tooltip', () => {
  let tooltip;

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-tooltip="Test tooltip" data-tooltip-position="top">
        Hover me
      </button>
    `;

    tooltip = new Tooltip({
      showDelay: 0,
      hideDelay: 0
    });
  });

  afterEach(() => {
    tooltip.destroy();
  });

  test('shows tooltip on hover', (done) => {
    const button = document.querySelector('button');

    button.dispatchEvent(new Event('mouseenter', { bubbles: true }));

    setTimeout(() => {
      const tooltipEl = document.querySelector('.tooltip');
      expect(tooltipEl).toBeTruthy();
      expect(tooltipEl.textContent).toBe('Test tooltip');
      done();
    }, 50);
  });

  test('hides tooltip on mouseleave', (done) => {
    const button = document.querySelector('button');

    button.dispatchEvent(new Event('mouseenter', { bubbles: true }));

    setTimeout(() => {
      button.dispatchEvent(new Event('mouseleave', { bubbles: true }));

      setTimeout(() => {
        const tooltipEl = document.querySelector('.tooltip-visible');
        expect(tooltipEl).toBeFalsy();
        done();
      }, 250);
    }, 50);
  });

  test('positions tooltip correctly', (done) => {
    const button = document.querySelector('button');
    button.getBoundingClientRect = () => ({
      top: 100,
      left: 100,
      right: 200,
      bottom: 150,
      width: 100,
      height: 50
    });

    button.dispatchEvent(new Event('mouseenter', { bubbles: true }));

    setTimeout(() => {
      const tooltipEl = document.querySelector('.tooltip');
      const top = parseInt(tooltipEl.style.top);

      // Should be above the button (top position)
      expect(top).toBeLessThan(100);
      done();
    }, 50);
  });

  test('flips position on viewport overflow', (done) => {
    const button = document.querySelector('button');

    // Position button at top edge
    button.getBoundingClientRect = () => ({
      top: 5,
      left: 100,
      right: 200,
      bottom: 55,
      width: 100,
      height: 50
    });

    button.dispatchEvent(new Event('mouseenter', { bubbles: true }));

    setTimeout(() => {
      const tooltipEl = document.querySelector('.tooltip');
      const arrow = tooltipEl.querySelector('.tooltip-arrow');

      // Should flip to bottom
      expect(arrow.className).toContain('tooltip-arrow-bottom');
      done();
    }, 50);
  });

  test('shows on focus for accessibility', (done) => {
    const button = document.querySelector('button');

    button.dispatchEvent(new Event('focus', { bubbles: true }));

    setTimeout(() => {
      const tooltipEl = document.querySelector('.tooltip');
      expect(tooltipEl).toBeTruthy();
      done();
    }, 50);
  });

  test('sets aria-describedby on trigger', (done) => {
    const button = document.querySelector('button');

    button.dispatchEvent(new Event('mouseenter', { bubbles: true }));

    setTimeout(() => {
      const ariaDescribedBy = button.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();

      const tooltipEl = document.getElementById(ariaDescribedBy);
      expect(tooltipEl.getAttribute('role')).toBe('tooltip');
      done();
    }, 50);
  });
});
```

---

## Time & Space Complexity

**Time Complexity:**
- Show: O(1) - DOM manipulation and position calculation
- Position: O(1) - getBoundingClientRect and arithmetic
- Hide: O(1) - DOM removal

**Space Complexity:**
- O(1) - Single tooltip instance, minimal state

---

## Common Mistakes

❌ **Mistake:** Not using portal rendering
```javascript
// Tooltip clipped by parent's overflow:hidden
trigger.appendChild(tooltip);
```

✅ **Correct:** Render to document.body
```javascript
document.body.appendChild(tooltip);
```

---

❌ **Mistake:** Not handling viewport edges
```javascript
// Tooltip goes off-screen
tooltip.style.top = `${triggerRect.top - tooltipHeight}px`;
```

✅ **Correct:** Check overflow and flip
```javascript
if (checkOverflow(position, tooltipRect)) {
  const opposite = getOppositePosition(preferredPosition);
  position = calculatePosition(triggerRect, tooltipRect, opposite);
}
```

---

❌ **Mistake:** Showing immediately on hover (annoying UX)
```javascript
onMouseEnter={() => setIsVisible(true)}
```

✅ **Correct:** Add show delay
```javascript
showTimeout = setTimeout(() => setIsVisible(true), 200);
```

---

❌ **Mistake:** Not cleaning up on scroll
```javascript
// Tooltip stays in old position when user scrolls
```

✅ **Correct:** Hide on scroll or update position
```javascript
window.addEventListener('scroll', this.hide, true);
```

---

❌ **Mistake:** Multiple tooltips showing at once
```javascript
// Previous tooltip still visible
function show(trigger) {
  this.tooltip = createTooltip();
}
```

✅ **Correct:** Hide previous before showing new
```javascript
function show(trigger) {
  this.hide(); // Close existing
  this.tooltip = createTooltip();
}
```

---

## Real-World Applications

1. **Help text** - Explain form fields, icons
2. **Action hints** - Show keyboard shortcuts
3. **Icon explanations** - Describe icon purpose
4. **Disabled button reasons** - "You must be logged in"
5. **Truncated text preview** - Show full content on hover
6. **Feature discovery** - Onboarding tooltips

---

## Follow-up Questions

- "How would you add rich HTML content instead of plain text?"
- "How to make tooltip interactive (clickable links)?"
- "How to handle multiple tooltips on the same page?"
- "How would you implement tooltip animations (fade, slide, scale)?"
- "How to prevent tooltip from blocking mouse events?"
- "How would you add touch support for mobile devices?"

---

## Resources

- [WAI-ARIA: Tooltip Role](https://www.w3.org/TR/wai-aria-1.2/#tooltip)
- [Floating UI (Popper.js successor)](https://floating-ui.com/)
- [Inclusive Components: Tooltips](https://inclusive-components.design/tooltips-toggletips/)

---

[← Back to DOM Manipulation Problems](../README.md)
