# DOM Events - Complete Guide

## Question 1: What's the difference between preventDefault() and stopPropagation()?

**Answer:**

`preventDefault()` and `stopPropagation()` are two different methods that control different aspects of event behavior:

**preventDefault():**
- Prevents the browser's default action for an event
- Does NOT stop event propagation
- Example: Prevents form submission, link navigation, context menu

**stopPropagation():**
- Stops the event from bubbling/capturing further
- Does NOT prevent default browser behavior
- Example: Prevents parent handlers from firing

```javascript
// preventDefault() - Stop default action
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevents form submission
  // Event still bubbles to parent elements
  console.log('Form not submitted, but event bubbles');
});

// stopPropagation() - Stop event propagation
const link = document.querySelector('a');
link.addEventListener('click', (e) => {
  e.stopPropagation(); // Stops bubbling
  // But link still navigates (default action)
  console.log('Link navigates, but parent handlers don\'t fire');
});

// Both together
link.addEventListener('click', (e) => {
  e.preventDefault();     // Don't navigate
  e.stopPropagation();    // Don't bubble
  // Complete control over event
});
```

**Real-World Examples:**

```javascript
// Example 1: Custom form validation
class FormValidator {
  constructor(form) {
    this.form = form;
    this.form.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent default submission

      if (this.validate()) {
        // Submit via AJAX instead
        this.submitAjax();
      }
      // Event still bubbles for analytics tracking
    });
  }

  validate() {
    const inputs = this.form.querySelectorAll('input[required]');
    return Array.from(inputs).every(input => input.value.trim() !== '');
  }

  submitAjax() {
    const formData = new FormData(this.form);
    fetch('/api/submit', {
      method: 'POST',
      body: formData
    });
  }
}

// Example 2: Dropdown menu that shouldn't close parent
class Dropdown {
  constructor(element) {
    this.element = element;
    this.button = element.querySelector('.dropdown-button');
    this.menu = element.querySelector('.dropdown-menu');

    this.button.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger document click handler
      this.toggle();
    });

    this.menu.addEventListener('click', (e) => {
      e.stopPropagation(); // Clicking menu items doesn't close dropdown
    });

    // Close on outside click
    document.addEventListener('click', () => {
      this.close();
    });
  }

  toggle() {
    this.menu.classList.toggle('open');
  }

  close() {
    this.menu.classList.remove('open');
  }
}

// Example 3: Custom right-click menu
class ContextMenu {
  constructor() {
    this.menu = document.getElementById('context-menu');

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent browser context menu
      this.show(e.pageX, e.pageY);
    });

    document.addEventListener('click', () => {
      this.hide(); // Hide on any click
    });

    this.menu.addEventListener('click', (e) => {
      e.stopPropagation(); // Menu clicks don't trigger document click
    });
  }

  show(x, y) {
    this.menu.style.left = x + 'px';
    this.menu.style.top = y + 'px';
    this.menu.classList.add('visible');
  }

  hide() {
    this.menu.classList.remove('visible');
  }
}
```

**stopImmediatePropagation():**

```javascript
// stopImmediatePropagation() - Stops ALL handlers, even on same element
const button = document.querySelector('button');

button.addEventListener('click', (e) => {
  console.log('Handler 1');
  e.stopImmediatePropagation(); // Stops everything after this
});

button.addEventListener('click', (e) => {
  console.log('Handler 2'); // Never executes
});

document.body.addEventListener('click', (e) => {
  console.log('Parent handler'); // Never executes
});

// Click output: "Handler 1" only
```

**Comparison Table:**

| Method | Stops Propagation | Prevents Default | Stops Other Handlers on Same Element |
|--------|-------------------|------------------|--------------------------------------|
| `preventDefault()` | ❌ No | ✅ Yes | ❌ No |
| `stopPropagation()` | ✅ Yes | ❌ No | ❌ No |
| `stopImmediatePropagation()` | ✅ Yes | ❌ No | ✅ Yes |
| Both `preventDefault()` + `stopPropagation()` | ✅ Yes | ✅ Yes | ❌ No |

---

<details>
<summary><strong>🔍 Deep Dive: Browser Event Cancellation Mechanism</strong></summary>


**How preventDefault() Works Internally:**

```javascript
// Browser's internal event implementation
class BrowserEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.defaultPrevented = false;
    this.cancelable = options.cancelable !== false;
    this.bubbles = options.bubbles !== false;
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    } else {
      console.warn(`Event '${this.type}' is not cancelable`);
    }
  }

  stopPropagation() {
    this.propagationStopped = true;
  }

  stopImmediatePropagation() {
    this.propagationStopped = true;
    this.immediatePropagationStopped = true;
  }

  // Check if default can be prevented
  get cancelable() {
    return this._cancelable;
  }
}

// Browser checks defaultPrevented before executing default action
class BrowserEventDispatcher {
  dispatchClickEvent(element) {
    const event = new BrowserEvent('click', { cancelable: true });

    // Execute all handlers
    this.executeHandlers(element, event);

    // Check if default action should execute
    if (!event.defaultPrevented) {
      this.executeDefaultAction(element, event);
    }
  }

  executeDefaultAction(element, event) {
    if (element.tagName === 'A') {
      // Navigate to href
      window.location.href = element.href;
    } else if (element.tagName === 'FORM' && event.type === 'submit') {
      // Submit form
      element.submit();
    }
    // ... other default actions
  }
}
```

**Cancelable vs Non-Cancelable Events:**

```javascript
class EventCancelability {
  static checkCancelable(eventType) {
    const cancelableEvents = [
      'click', 'mousedown', 'keydown', 'submit',
      'contextmenu', 'wheel', 'touchstart', 'dragstart'
    ];

    const nonCancelableEvents = [
      'load', 'unload', 'abort', 'error',
      'focus', 'blur', 'resize', 'scroll' // These can't be prevented
    ];

    return {
      cancelable: cancelableEvents.includes(eventType),
      nonCancelable: nonCancelableEvents.includes(eventType)
    };
  }

  static testCancelability() {
    // Try preventing non-cancelable event
    window.addEventListener('load', (e) => {
      e.preventDefault(); // Does nothing!
      console.log('Default prevented:', e.defaultPrevented); // false
      console.log('Cancelable:', e.cancelable); // false
    });

    // Prevent cancelable event
    document.addEventListener('click', (e) => {
      e.preventDefault(); // Works!
      console.log('Default prevented:', e.defaultPrevented); // true
      console.log('Cancelable:', e.cancelable); // true
    });
  }
}
```

**Propagation Flow with stopPropagation:**

```javascript
class PropagationFlowVisualizer {
  static demonstrateFlow() {
    const structure = `
      <div id="grandparent">
        <div id="parent">
          <button id="child">Click Me</button>
        </div>
      </div>
    `;

    const logs = [];

    // Setup listeners
    grandparent.addEventListener('click', (e) => {
      logs.push('Grandparent - Capture');
    }, true);

    parent.addEventListener('click', (e) => {
      logs.push('Parent - Capture');
      // e.stopPropagation(); // Uncomment to see effect
    }, true);

    child.addEventListener('click', (e) => {
      logs.push('Child - Target');
      e.stopPropagation(); // Stop here
    });

    parent.addEventListener('click', (e) => {
      logs.push('Parent - Bubble'); // Never reaches here
    });

    grandparent.addEventListener('click', (e) => {
      logs.push('Grandparent - Bubble'); // Never reaches here
    });

    // Click child
    child.click();

    console.log(logs);
    // ['Grandparent - Capture', 'Parent - Capture', 'Child - Target']
    // Bubble phase never executes
  }
}
```

**Performance Impact of Propagation Stopping:**

```javascript
class PropagationPerformance {
  static benchmark() {
    const container = document.createElement('div');

    // Create deep nesting
    let current = container;
    for (let i = 0; i < 100; i++) {
      const div = document.createElement('div');
      current.appendChild(div);
      current = div;
    }
    const deepButton = current;

    // Test 1: Full propagation (no stopPropagation)
    let handlerCount = 0;
    current = container;
    while (current) {
      current.addEventListener('click', () => handlerCount++);
      current = current.firstChild;
    }

    const start1 = performance.now();
    for (let i = 0; i < 1000; i++) {
      handlerCount = 0;
      deepButton.click();
    }
    const fullPropTime = performance.now() - start1;
    console.log('Full propagation:', fullPropTime, 'ms');
    console.log('Handlers executed per click:', handlerCount / 1000);

    // Test 2: Stop propagation at target
    container.innerHTML = '';
    current = container;
    for (let i = 0; i < 100; i++) {
      const div = document.createElement('div');
      current.appendChild(div);
      current = div;
    }
    const deepButton2 = current;

    handlerCount = 0;
    current = container;
    while (current) {
      if (current === deepButton2) {
        current.addEventListener('click', (e) => {
          handlerCount++;
          e.stopPropagation();
        });
      } else {
        current.addEventListener('click', () => handlerCount++);
      }
      current = current.firstChild;
    }

    const start2 = performance.now();
    for (let i = 0; i < 1000; i++) {
      handlerCount = 0;
      deepButton2.click();
    }
    const stoppedPropTime = performance.now() - start2;
    console.log('Stopped propagation:', stoppedPropTime, 'ms');
    console.log('Handlers executed per click:', handlerCount / 1000);

    return {
      fullPropagation: fullPropTime,
      stoppedPropagation: stoppedPropTime,
      speedup: ((fullPropTime / stoppedPropTime - 1) * 100).toFixed(1) + '%'
    };
    // Typical: 40-60% faster with stopped propagation
  }
}
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Modal Form with Nested Click Handlers</strong></summary>


**The Problem:**

An e-commerce checkout modal had a bug where clicking form fields would close the modal. The issue stemmed from improper use of stopPropagation and preventDefault.

**Initial Metrics:**
- Cart abandonment rate: 34% (industry average: 18%)
- User complaints: 156 in one week
- Mobile completion rate: 23% (desktop: 67%)
- Support tickets: "Form keeps closing when I try to fill it"

**Buggy Implementation:**

```javascript
// ❌ WRONG: Misused stopPropagation and preventDefault
class BuggyCheckoutModal {
  constructor() {
    this.modal = document.getElementById('checkout-modal');
    this.form = this.modal.querySelector('form');
    this.overlay = document.querySelector('.modal-overlay');

    this.init();
  }

  init() {
    // Close modal on overlay click
    this.overlay.addEventListener('click', (e) => {
      e.preventDefault(); // BUG: Prevents link clicks in modal!
      this.close();
    });

    // Handle form submission
    this.form.addEventListener('submit', (e) => {
      e.stopPropagation(); // BUG: Stops event, but doesn't prevent submission
      // Form still submits because preventDefault() not called!
      this.processPayment();
    });

    // Close button
    this.modal.querySelector('.close-btn').addEventListener('click', (e) => {
      // BUG: No stopPropagation - triggers overlay click handler too!
      this.close();
    });

    // Form field focus
    this.form.querySelectorAll('input').forEach(input => {
      input.addEventListener('focus', (e) => {
        e.stopPropagation(); // Useless - focus doesn't bubble
      });
    });
  }

  close() {
    this.modal.style.display = 'none';
  }

  processPayment() {
    console.log('Processing payment...');
  }
}

// What goes wrong:
// 1. Clicking "Terms of Service" link in modal doesn't work (preventDefault on overlay)
// 2. Form submits page reload (missing preventDefault)
// 3. Close button closes modal twice (no stopPropagation, triggers both handlers)
// 4. stopPropagation on focus does nothing (focus doesn't bubble)
```

**Debugging Process:**

```javascript
class EventDebugger {
  static trackEventFlow(selector) {
    const element = document.querySelector(selector);
    const originalPreventDefault = Event.prototype.preventDefault;
    const originalStopPropagation = Event.prototype.stopPropagation;

    Event.prototype.preventDefault = function() {
      console.log('preventDefault called:', {
        type: this.type,
        target: this.target,
        cancelable: this.cancelable,
        stackTrace: new Error().stack
      });
      originalPreventDefault.call(this);
    };

    Event.prototype.stopPropagation = function() {
      console.log('stopPropagation called:', {
        type: this.type,
        target: this.target,
        bubbles: this.bubbles,
        stackTrace: new Error().stack
      });
      originalStopPropagation.call(this);
    };
  }

  static logEventPhases(root) {
    const phases = { capture: [], bubble: [] };

    function addLogger(el, phase) {
      el.addEventListener('click', (e) => {
        phases[phase].push({
          element: el.tagName + (el.className ? '.' + el.className : ''),
          defaultPrevented: e.defaultPrevented,
          propagationStopped: e.cancelBubble,
          timestamp: performance.now()
        });
      }, phase === 'capture');
    }

    let current = root;
    while (current) {
      addLogger(current, 'capture');
      addLogger(current, 'bubble');
      current = current.parentElement;
    }

    return phases;
  }
}

// Debug output revealed:
// 1. preventDefault() called on overlay, preventing ALL child link clicks
// 2. stopPropagation() called on form submit (useless without preventDefault)
// 3. Close button click event reached overlay (caused double close attempt)
```

**Fixed Implementation:**

```javascript
// ✅ CORRECT: Proper use of both methods
class FixedCheckoutModal {
  constructor() {
    this.modal = document.getElementById('checkout-modal');
    this.form = this.modal.querySelector('form');
    this.overlay = document.querySelector('.modal-overlay');
    this.modalContent = this.modal.querySelector('.modal-content');

    this.init();
  }

  init() {
    // Close on overlay click, but not modal content
    this.overlay.addEventListener('click', (e) => {
      // Only close if clicking directly on overlay
      if (e.target === this.overlay) {
        this.close();
      }
      // No preventDefault - allow links to work
      // No stopPropagation - allow event delegation
    });

    // Alternative: Stop propagation from modal content
    this.modalContent.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent overlay click handler
      // No preventDefault - allow buttons, links, etc.
    });

    // Handle form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent page reload
      // No stopPropagation needed - we want analytics to track this
      this.processPayment();
    });

    // Close button
    this.modal.querySelector('.close-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger overlay handler
      // No preventDefault needed - button has no default action
      this.close();
    });

    // Terms link should work normally
    const termsLink = this.modal.querySelector('.terms-link');
    termsLink.addEventListener('click', (e) => {
      // Let default action happen (open link)
      // Event still bubbles for analytics
    });

    // Keyboard: Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        // No preventDefault - allow other Escape handlers
        // No stopPropagation - allow global keyboard shortcuts
        this.close();
      }
    });
  }

  isOpen() {
    return this.modal.style.display !== 'none';
  }

  close() {
    this.modal.style.display = 'none';
  }

  processPayment() {
    const formData = new FormData(this.form);

    fetch('/api/checkout', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showSuccess();
      }
    });
  }

  showSuccess() {
    alert('Payment successful!');
    this.close();
  }
}
```

**Testing Strategy:**

```javascript
class ModalEventTester {
  static runTests() {
    const modal = new FixedCheckoutModal();
    const tests = [];

    // Test 1: Click overlay directly
    tests.push({
      name: 'Overlay click closes modal',
      run: () => {
        modal.open();
        document.querySelector('.modal-overlay').click();
        return modal.isOpen() === false;
      }
    });

    // Test 2: Click inside modal content
    tests.push({
      name: 'Content click doesn\'t close modal',
      run: () => {
        modal.open();
        document.querySelector('.modal-content').click();
        return modal.isOpen() === true;
      }
    });

    // Test 3: Submit form
    tests.push({
      name: 'Form submit prevents reload',
      run: () => {
        let reloaded = false;
        const originalSubmit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = () => { reloaded = true; };

        modal.form.dispatchEvent(new Event('submit'));

        HTMLFormElement.prototype.submit = originalSubmit;
        return !reloaded;
      }
    });

    // Test 4: Links work
    tests.push({
      name: 'Links inside modal work',
      run: () => {
        const link = document.querySelector('.modal .terms-link');
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });

        link.dispatchEvent(event);
        return !event.defaultPrevented;
      }
    });

    // Test 5: Close button
    tests.push({
      name: 'Close button closes modal',
      run: () => {
        modal.open();
        document.querySelector('.close-btn').click();
        return modal.isOpen() === false;
      }
    });

    // Run all tests
    const results = tests.map(test => ({
      name: test.name,
      passed: test.run()
    }));

    console.table(results);
    return results.every(r => r.passed);
  }
}
```

**Metrics After Fix:**

```javascript
// Before fix:
// - Cart abandonment: 34%
// - User complaints: 156/week
// - Mobile completion: 23%
// - Form submission errors: 12%

// After fix:
// - Cart abandonment: 19% (↓ 44%)
// - User complaints: 8/week (↓ 95%)
// - Mobile completion: 64% (↑ 178%)
// - Form submission errors: 0.3% (↓ 97.5%)

// Revenue impact: +$47,000/month from reduced abandonment
```

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: When to Use Each Method</strong></summary>


**preventDefault() Use Cases:**

| Scenario | Why preventDefault | Alternative |
|----------|-------------------|-------------|
| **Form validation** | Prevent submission until valid | Use `novalidate` + manual submit |
| **Custom link behavior** | Navigate programmatically (SPA) | Use `<button>` instead of `<a>` |
| **Right-click menus** | Show custom context menu | CSS-only limited alternative |
| **Drag and drop** | Prevent default drag behavior | No alternative |
| **Custom keyboard shortcuts** | Override browser shortcuts | Limited options |

**stopPropagation() Use Cases:**

| Scenario | Why stopPropagation | Alternative |
|----------|---------------------|-------------|
| **Modal click-outside** | Prevent document handler | Check `event.target` instead |
| **Nested click handlers** | Prevent parent handlers | Event delegation pattern |
| **Dropdown menus** | Keep menu open on interaction | Check `contains()` |
| **Complex nested widgets** | Isolate component events | Better component boundaries |

**Decision Matrix:**

```javascript
class EventMethodSelector {
  static selectMethod(scenario) {
    const strategies = {
      'form-submission': {
        method: 'preventDefault',
        reason: 'Prevent page reload, handle via AJAX',
        alternatives: ['novalidate attribute'],
        confidence: 'high'
      },

      'link-navigation': {
        method: 'preventDefault',
        reason: 'Handle navigation programmatically (SPA)',
        alternatives: ['Use buttons for actions', 'History API'],
        confidence: 'high'
      },

      'modal-close-on-outside-click': {
        method: 'neither',
        reason: 'Check event.target instead',
        alternatives: ['if (e.target === overlay) close()'],
        confidence: 'high',
        avoid: 'stopPropagation - breaks delegation'
      },

      'dropdown-menu': {
        method: 'stopPropagation',
        reason: 'Prevent document click handler',
        alternatives: ['Check if contains(e.target)'],
        confidence: 'medium'
      },

      'nested-buttons': {
        method: 'stopPropagation',
        reason: 'Prevent parent button click',
        alternatives: ['Check event.target in parent'],
        confidence: 'medium'
      }
    };

    return strategies[scenario];
  }

  static shouldPreventDefault(event) {
    // Rules for when to prevent default
    const preventCases = [
      // Forms
      event.type === 'submit' && !event.target.hasAttribute('novalidate'),

      // Links in SPAs
      event.type === 'click' &&
      event.target.matches('a[href]') &&
      event.target.hasAttribute('data-spa-link'),

      // Context menus
      event.type === 'contextmenu',

      // Drag and drop
      event.type === 'dragover' || event.type === 'drop'
    ];

    return preventCases.some(condition => condition);
  }

  static shouldStopPropagation(event) {
    // Rules for when to stop propagation
    const stopCases = [
      // Modals/dropdowns with explicit stop attribute
      event.target.closest('[data-stop-propagation]'),

      // Nested interactive elements
      event.target.matches('button') &&
      event.target.closest('button') !== event.target
    ];

    return stopCases.some(condition => condition);
  }
}
```

**Anti-Patterns to Avoid:**

```javascript
// ❌ Anti-pattern 1: Always stopping propagation
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Breaks event delegation!
    handleClick(btn);
  });
});

// ✅ Better: Only stop when necessary
document.body.addEventListener('click', (e) => {
  if (e.target.matches('button')) {
    handleClick(e.target);
  }
});

// ❌ Anti-pattern 2: Preventing default on wrong events
document.addEventListener('click', (e) => {
  e.preventDefault(); // Breaks all clicks!
});

// ✅ Better: Prevent only specific elements
document.addEventListener('click', (e) => {
  if (e.target.matches('.custom-action')) {
    e.preventDefault();
    handleCustomAction(e.target);
  }
});

// ❌ Anti-pattern 3: Return false (jQuery-style)
element.onclick = function(e) {
  return false; // Does both preventDefault + stopPropagation (unclear!)
};

// ✅ Better: Be explicit
element.addEventListener('click', (e) => {
  e.preventDefault();     // Clear intent
  e.stopPropagation();    // Clear intent
});
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: preventDefault vs stopPropagation</strong></summary>


**Simple Analogy:**

Imagine you're watching a movie in a theater:

- **preventDefault()**: You prevent the projectionist from changing the film (stop the default action), but people can still whisper comments to each other (event still propagates)

- **stopPropagation()**: You tell people to stop whispering to others (stop propagation), but the movie still plays (default action still happens)

**Visual Diagram:**

```
preventDefault():
==================
User clicks link
     ↓
Event bubbles normally: child → parent → document
     ↓
Browser SKIPS default action (navigation) ✗


stopPropagation():
==================
User clicks link
     ↓
Event STOPS at current element (no further bubbling) ✗
     ↓
Browser executes default action (navigation) ✓
```

**Interview Answer Template:**

> "`preventDefault()` and `stopPropagation()` control different aspects of events:
>
> **preventDefault()** stops the browser's default action. For example:
> - On a form submit event, it prevents the form from submitting
> - On a link click, it prevents navigation
> - On a right-click, it prevents the context menu
>
> But the event still bubbles up to parent elements.
>
> **stopPropagation()** stops the event from bubbling up (or capturing down) to other elements. Parent handlers won't fire. But it doesn't prevent the browser's default action.
>
> A common use case: in a modal, I'll use `stopPropagation()` on the modal content to prevent clicks from reaching the overlay's click-outside handler, while allowing buttons and links to work normally. For forms, I use `preventDefault()` to stop the page reload and handle submission via AJAX instead.
>
> There's also `stopImmediatePropagation()` which is like `stopPropagation()` but also prevents other handlers on the same element from running."

**Quick Reference:**

```javascript
// Prevent form submission (but event still bubbles)
form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitViaAjax();
});

// Stop event from reaching parent (but link still navigates)
link.addEventListener('click', (e) => {
  e.stopPropagation();
  // Link still navigates!
});

// Do both: prevent navigation AND stop bubbling
link.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  customNavigation();
});

// Stop immediately (prevents other handlers on same element too)
button.addEventListener('click', (e) => {
  e.stopImmediatePropagation();
  // No other click handlers on this button will run
});

// Check if already prevented/stopped
element.addEventListener('click', (e) => {
  if (e.defaultPrevented) {
    console.log('Someone already prevented default');
  }

  if (e.cancelBubble) {
    console.log('Propagation was stopped');
  }
});
```

**Common Gotchas:**

```javascript
// 1. preventDefault() only works on cancelable events
window.addEventListener('scroll', (e) => {
  e.preventDefault(); // Does nothing! Scroll isn't cancelable
  console.log(e.cancelable); // false
});

// 2. stopPropagation() doesn't prevent default
link.addEventListener('click', (e) => {
  e.stopPropagation();
  // Link STILL navigates - need preventDefault() too!
});

// 3. Return false in inline handlers
<button onclick="return false"> // Prevents default only
<button onclick="event.stopPropagation(); return false;"> // Does both

// 4. Passive listeners can't preventDefault()
element.addEventListener('touchstart', (e) => {
  e.preventDefault(); // No-op if listener is passive — browser logs a console warning, doesn't throw
}, { passive: true });
```

</details>

---

## Question 2: How do you create and dispatch custom events using the CustomEvent API?

**Answer:**

The CustomEvent API allows you to create and dispatch custom events with custom data, enabling communication between different parts of your application without tight coupling.

**Basic Usage:**

```javascript
// Create custom event
const event = new CustomEvent('userLogin', {
  detail: {
    username: 'john_doe',
    timestamp: Date.now(),
    role: 'admin'
  },
  bubbles: true,
  cancelable: true
});

// Dispatch event
document.dispatchEvent(event);

// Listen for custom event
document.addEventListener('userLogin', (e) => {
  console.log('User logged in:', e.detail.username);
  console.log('Role:', e.detail.role);
});
```

**CustomEvent vs Event:**

```javascript
// Event (basic, no custom data)
const basicEvent = new Event('customAction', {
  bubbles: true,
  cancelable: true
});

// CustomEvent (with custom data in detail property)
const customEvent = new CustomEvent('customAction', {
  detail: { message: 'Hello', count: 42 },
  bubbles: true,
  cancelable: true
});

// Listen and access data
element.addEventListener('customAction', (e) => {
  console.log(e.detail); // { message: 'Hello', count: 42 }
});
```

**Real-World Example: Component Communication:**

```javascript
// Component 1: Shopping Cart
class ShoppingCart {
  constructor() {
    this.items = [];
    this.element = document.getElementById('cart');
  }

  addItem(product) {
    this.items.push(product);
    this.update();

    // Dispatch custom event
    const event = new CustomEvent('cart:item-added', {
      detail: {
        product,
        totalItems: this.items.length,
        totalPrice: this.calculateTotal()
      },
      bubbles: true
    });

    this.element.dispatchEvent(event);
  }

  removeItem(productId) {
    const index = this.items.findIndex(item => item.id === productId);
    if (index > -1) {
      const removed = this.items.splice(index, 1)[0];

      const event = new CustomEvent('cart:item-removed', {
        detail: {
          product: removed,
          totalItems: this.items.length,
          totalPrice: this.calculateTotal()
        },
        bubbles: true
      });

      this.element.dispatchEvent(event);
    }
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  update() {
    this.element.textContent = `Cart (${this.items.length})`;
  }
}

// Component 2: Cart Badge
class CartBadge {
  constructor() {
    this.badge = document.getElementById('cart-badge');

    // Listen for cart events
    document.addEventListener('cart:item-added', (e) => {
      this.updateBadge(e.detail.totalItems);
      this.showAnimation('added');
    });

    document.addEventListener('cart:item-removed', (e) => {
      this.updateBadge(e.detail.totalItems);
      this.showAnimation('removed');
    });
  }

  updateBadge(count) {
    this.badge.textContent = count;
    this.badge.style.display = count > 0 ? 'block' : 'none';
  }

  showAnimation(type) {
    this.badge.classList.add(`animate-${type}`);
    setTimeout(() => {
      this.badge.classList.remove(`animate-${type}`);
    }, 300);
  }
}

// Component 3: Analytics
class Analytics {
  constructor() {
    document.addEventListener('cart:item-added', (e) => {
      this.track('add_to_cart', {
        product_id: e.detail.product.id,
        product_name: e.detail.product.name,
        price: e.detail.product.price,
        cart_total: e.detail.totalPrice
      });
    });

    document.addEventListener('cart:item-removed', (e) => {
      this.track('remove_from_cart', {
        product_id: e.detail.product.id
      });
    });
  }

  track(eventName, data) {
    console.log(`[Analytics] ${eventName}`, data);
    // Send to analytics service
  }
}

// Initialize components (no direct coupling!)
const cart = new ShoppingCart();
const badge = new CartBadge();
const analytics = new Analytics();

// Add item - automatically updates badge and tracks analytics
cart.addItem({ id: 1, name: 'Laptop', price: 999 });
```

**Advanced Pattern: Event Bus:**

```javascript
class EventBus {
  constructor() {
    this.bus = document.createElement('div');
  }

  on(event, callback) {
    this.bus.addEventListener(event, callback);
  }

  off(event, callback) {
    this.bus.removeEventListener(event, callback);
  }

  emit(event, detail = {}) {
    const customEvent = new CustomEvent(event, { detail });
    this.bus.dispatchEvent(customEvent);
  }

  once(event, callback) {
    const onceCallback = (e) => {
      callback(e);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
}

// Usage
const eventBus = new EventBus();

// Module A
eventBus.on('user:login', (e) => {
  console.log('User logged in:', e.detail.user);
});

// Module B
eventBus.emit('user:login', {
  user: { id: 1, name: 'John' }
});

// One-time listener
eventBus.once('app:ready', () => {
  console.log('App initialized');
});
```

---

<details>
<summary><strong>🔍 Deep Dive: Custom Event Implementation Details</strong></summary>


**Browser Implementation of CustomEvent:**

```javascript
// Simplified browser implementation
class CustomEventPolyfill {
  constructor(type, options = {}) {
    // Create base event
    const event = document.createEvent('CustomEvent');

    // Initialize with type and options
    event.initCustomEvent(
      type,
      options.bubbles || false,
      options.cancelable || false,
      options.detail || null
    );

    return event;
  }
}

// Modern browser native implementation (conceptual)
class BrowserCustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, {
      bubbles: options.bubbles,
      cancelable: options.cancelable,
      composed: options.composed
    });

    // Store custom data
    this._detail = options.detail !== undefined ? options.detail : null;

    // Make detail read-only
    Object.defineProperty(this, 'detail', {
      get: () => this._detail,
      enumerable: true
    });
  }
}
```

**Memory and Performance Characteristics:**

```javascript
class CustomEventPerformance {
  static benchmarkEventCreation(iterations = 10000) {
    const results = {
      basicEvent: 0,
      customEvent: 0,
      customEventWithLargePayload: 0
    };

    // Test 1: Basic Event
    let start = performance.now();
    for (let i = 0; i < iterations; i++) {
      new Event('test');
    }
    results.basicEvent = performance.now() - start;

    // Test 2: CustomEvent with small payload
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
      new CustomEvent('test', {
        detail: { id: i, value: 'test' }
      });
    }
    results.customEvent = performance.now() - start;

    // Test 3: CustomEvent with large payload
    start = performance.now();
    const largePayload = new Array(1000).fill({ data: 'test' });
    for (let i = 0; i < iterations; i++) {
      new CustomEvent('test', {
        detail: { items: largePayload }
      });
    }
    results.customEventWithLargePayload = performance.now() - start;

    return results;
    // Typical results (10k iterations):
    // basicEvent: 8ms
    // customEvent: 12ms (50% slower, but still fast)
    // customEventWithLargePayload: 15ms (payload is referenced, not copied)
  }

  static benchmarkEventDispatch(iterations = 10000) {
    const element = document.createElement('div');
    const results = {};

    // No listeners
    const event1 = new CustomEvent('test1');
    let start = performance.now();
    for (let i = 0; i < iterations; i++) {
      element.dispatchEvent(event1);
    }
    results.noListeners = performance.now() - start;

    // One listener
    element.addEventListener('test2', () => {});
    const event2 = new CustomEvent('test2');
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
      element.dispatchEvent(event2);
    }
    results.oneListener = performance.now() - start;

    // Ten listeners
    for (let i = 0; i < 10; i++) {
      element.addEventListener('test3', () => {});
    }
    const event3 = new CustomEvent('test3');
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
      element.dispatchEvent(event3);
    }
    results.tenListeners = performance.now() - start;

    return results;
    // Typical results (10k iterations):
    // noListeners: 12ms
    // oneListener: 18ms
    // tenListeners: 45ms (scales linearly with listeners)
  }
}
```

**Event Detail Deep Copying:**

```javascript
class EventDetailBehavior {
  static demonstrateDetailReference() {
    const data = { count: 0, items: [] };

    const event = new CustomEvent('test', { detail: data });

    // Detail is a REFERENCE, not a copy
    console.log(event.detail.count); // 0

    // Mutating original object affects event detail
    data.count = 10;
    console.log(event.detail.count); // 10 (!)

    // This can cause bugs if not careful
  }

  static safeEventCreation(data) {
    // Deep clone to prevent mutations
    return new CustomEvent('test', {
      detail: JSON.parse(JSON.stringify(data))
    });

    // Or use structured clone (modern browsers)
    return new CustomEvent('test', {
      detail: structuredClone(data)
    });
  }
}
```

**Event Bubbling Through Shadow DOM:**

```javascript
class ShadowDOMEvents {
  static demonstrateComposedEvents() {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });

    const button = document.createElement('button');
    shadow.appendChild(button);
    document.body.appendChild(host);

    // Listen outside shadow boundary
    document.addEventListener('custom-event', (e) => {
      console.log('Event reached document');
      console.log('Event target:', e.target); // Retargeted to host
    });

    // Non-composed event (default)
    const nonComposedEvent = new CustomEvent('custom-event', {
      bubbles: true,
      composed: false // Doesn't cross shadow boundary
    });
    button.dispatchEvent(nonComposedEvent);
    // Output: (nothing - event stops at shadow boundary)

    // Composed event
    const composedEvent = new CustomEvent('custom-event', {
      bubbles: true,
      composed: true // Crosses shadow boundary
    });
    button.dispatchEvent(composedEvent);
    // Output: "Event reached document", "Event target: <div>"
  }
}
```

</details>

---

<details>
<summary><strong>🐛 Real-World Scenario: Race Conditions in Custom Event System</strong></summary>


**The Problem:**

A multi-tab dashboard application used custom events for widget communication, but race conditions caused data inconsistencies and duplicate API calls.

**Initial Metrics:**
- Duplicate API calls: 34% of requests
- Stale data shown: 18% of widget updates
- User confusion: "Why are numbers different in different widgets?"
- Server load: 2.3x expected
- Support tickets: 89 in one week

**Buggy Implementation:**

```javascript
// ❌ WRONG: Race conditions and event timing issues
class BuggyDataManager {
  constructor() {
    this.data = null;
    this.loading = false;

    // Listen for data requests
    document.addEventListener('data:fetch', (e) => {
      this.fetchData(e.detail.endpoint);
    });
  }

  async fetchData(endpoint) {
    // BUG: No check if already loading
    this.loading = true;

    const response = await fetch(endpoint);
    const data = await response.json();

    this.data = data;
    this.loading = false;

    // BUG: Event dispatched before state fully updated
    document.dispatchEvent(new CustomEvent('data:loaded', {
      detail: { data }
    }));
  }
}

class BuggyWidget {
  constructor(id) {
    this.id = id;

    // BUG: No unsubscribe mechanism
    document.addEventListener('data:loaded', (e) => {
      // BUG: All widgets respond to all data loads
      this.render(e.detail.data);
    });
  }

  loadData() {
    // BUG: Multiple widgets trigger multiple fetches
    document.dispatchEvent(new CustomEvent('data:fetch', {
      detail: { endpoint: '/api/data' }
    }));
  }

  render(data) {
    console.log(`Widget ${this.id} rendering:`, data);
  }
}

// Create 3 widgets
const widget1 = new BuggyWidget(1);
const widget2 = new BuggyWidget(2);
const widget3 = new BuggyWidget(3);

// All widgets request data simultaneously
widget1.loadData();
widget2.loadData(); // Duplicate fetch!
widget3.loadData(); // Duplicate fetch!

// Problems:
// 1. Three simultaneous API calls for same data
// 2. All widgets respond to each other's data loads
// 3. Race conditions - last response wins, may show stale data
// 4. Memory leak - event listeners never removed
```

**Fixed Implementation:**

```javascript
// ✅ CORRECT: Proper event coordination and state management
class FixedDataManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.subscribers = new Map();

    document.addEventListener('data:request', (e) => {
      this.handleDataRequest(e);
    });
  }

  async handleDataRequest(event) {
    const { endpoint, requestId } = event.detail;

    // Check cache first
    if (this.cache.has(endpoint)) {
      this.dispatchDataLoaded(endpoint, this.cache.get(endpoint), requestId);
      return;
    }

    // Check if already fetching
    if (this.pendingRequests.has(endpoint)) {
      // Add to subscribers for this endpoint
      if (!this.subscribers.has(endpoint)) {
        this.subscribers.set(endpoint, []);
      }
      this.subscribers.get(endpoint).push(requestId);
      return;
    }

    // Start new fetch
    this.pendingRequests.set(endpoint, true);
    this.subscribers.set(endpoint, [requestId]);

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      // Cache the data
      this.cache.set(endpoint, data);

      // Notify all subscribers
      const subscribers = this.subscribers.get(endpoint) || [];
      subscribers.forEach(id => {
        this.dispatchDataLoaded(endpoint, data, id);
      });

    } catch (error) {
      // Notify subscribers of error
      const subscribers = this.subscribers.get(endpoint) || [];
      subscribers.forEach(id => {
        this.dispatchDataError(endpoint, error, id);
      });
    } finally {
      // Clean up
      this.pendingRequests.delete(endpoint);
      this.subscribers.delete(endpoint);
    }
  }

  dispatchDataLoaded(endpoint, data, requestId) {
    // Use microtask to ensure state consistency
    queueMicrotask(() => {
      document.dispatchEvent(new CustomEvent('data:loaded', {
        detail: {
          endpoint,
          data: structuredClone(data), // Prevent mutations
          requestId,
          timestamp: Date.now()
        }
      }));
    });
  }

  dispatchDataError(endpoint, error, requestId) {
    document.dispatchEvent(new CustomEvent('data:error', {
      detail: { endpoint, error: error.message, requestId }
    }));
  }

  clearCache(endpoint) {
    if (endpoint) {
      this.cache.delete(endpoint);
    } else {
      this.cache.clear();
    }
  }
}

class FixedWidget {
  constructor(id, config) {
    this.id = id;
    this.config = config;
    this.requestId = null;
    this.destroyed = false;

    this.dataLoadedHandler = this.handleDataLoaded.bind(this);
    this.dataErrorHandler = this.handleDataError.bind(this);

    document.addEventListener('data:loaded', this.dataLoadedHandler);
    document.addEventListener('data:error', this.dataErrorHandler);
  }

  handleDataLoaded(event) {
    // Only process events meant for this widget
    if (event.detail.requestId !== this.requestId) {
      return;
    }

    if (this.destroyed) {
      return;
    }

    this.render(event.detail.data);
  }

  handleDataError(event) {
    if (event.detail.requestId !== this.requestId) {
      return;
    }

    console.error(`Widget ${this.id} error:`, event.detail.error);
    this.renderError(event.detail.error);
  }

  loadData() {
    // Generate unique request ID
    this.requestId = `widget-${this.id}-${Date.now()}`;

    document.dispatchEvent(new CustomEvent('data:request', {
      detail: {
        endpoint: this.config.endpoint,
        requestId: this.requestId
      },
      bubbles: true
    }));
  }

  render(data) {
    console.log(`Widget ${this.id} rendering (ID: ${this.requestId}):`, data);
  }

  renderError(error) {
    console.error(`Widget ${this.id} error:`, error);
  }

  destroy() {
    this.destroyed = true;
    document.removeEventListener('data:loaded', this.dataLoadedHandler);
    document.removeEventListener('data:error', this.dataErrorHandler);
  }
}

// Initialize
const dataManager = new FixedDataManager();

const widget1 = new FixedWidget(1, { endpoint: '/api/data' });
const widget2 = new FixedWidget(2, { endpoint: '/api/data' });
const widget3 = new FixedWidget(3, { endpoint: '/api/data' });

// All widgets request data - only ONE API call made!
widget1.loadData();
widget2.loadData();
widget3.loadData();

// Each widget only processes its own response
```

**Metrics After Fix:**

```javascript
// Before:
// - Duplicate API calls: 34%
// - Stale data: 18%
// - Server requests: 23,400/hour
// - Memory leaks: Yes (listeners never removed)
// - Response time: 450ms avg

// After:
// - Duplicate API calls: 0%
// - Stale data: 0%
// - Server requests: 6,800/hour (71% reduction!)
// - Memory leaks: None (proper cleanup)
// - Response time: 180ms avg (60% faster)

// Cost savings: $4,200/month in server costs
```

</details>

---

<details>
<summary><strong>⚖️ Trade-offs: Custom Events vs Other Patterns</strong></summary>


**Custom Events vs Direct Method Calls:**

| Aspect | Custom Events | Direct Calls | Winner |
|--------|---------------|--------------|--------|
| **Coupling** | Loose (pub/sub) | Tight (direct dependency) | Events |
| **Performance** | ~2-5ms overhead | Instant | Direct |
| **Testability** | Easy to mock | Harder to mock | Events |
| **Debugging** | Harder to trace | Easy to trace | Direct |
| **Async** | Natural async | Requires promises | Events |

**When to Use Custom Events:**

```javascript
// ✅ Good use case: Decoupled components
class GoodEventUse {
  // Multiple components need to react to one action
  handleUserAction() {
    document.dispatchEvent(new CustomEvent('user:action', {
      detail: { action: 'purchase' }
    }));
    // Analytics, UI updates, cache invalidation all happen independently
  }
}

// ❌ Bad use case: Simple parent-child communication
class BadEventUse {
  // Overkill for direct parent-child
  handleClick() {
    this.element.dispatchEvent(new CustomEvent('button:click'));
    // Just call a callback instead!
  }
}

// ✅ Better:
class BetterDirectCall {
  constructor(onClick) {
    this.onClick = onClick;
  }

  handleClick() {
    this.onClick(); // Simple and direct
  }
}
```

**Decision Matrix:**

```javascript
class CommunicationPatternSelector {
  static selectPattern(scenario) {
    const patterns = {
      'one-to-many-notification': {
        recommended: 'Custom Events',
        reason: 'Multiple listeners, loose coupling',
        alternative: 'Observer pattern',
        confidence: 'high'
      },

      'parent-child-simple': {
        recommended: 'Callbacks/Props',
        reason: 'Direct, simple, fast',
        alternative: 'Custom events (overkill)',
        confidence: 'high'
      },

      'cross-module-communication': {
        recommended: 'Event Bus or Custom Events',
        reason: 'Modules shouldn\'t know about each other',
        alternative: 'Dependency injection',
        confidence: 'high'
      },

      'state-management': {
        recommended: 'State management library',
        reason: 'Centralized state, time-travel debugging',
        alternative: 'Custom events (too fragmented)',
        confidence: 'high'
      },

      'plugin-system': {
        recommended: 'Custom Events',
        reason: 'Plugins shouldn\'t depend on host internals',
        alternative: 'Hook system',
        confidence: 'high'
      }
    };

    return patterns[scenario];
  }
}
```

</details>

---

<details>
<summary><strong>💬 Explain to Junior: Custom Events</strong></summary>


**Simple Analogy:**

Think of custom events like a messaging app for your code:

- **Direct method calls**: Like calling someone on the phone (you need their number, they must answer)
- **Custom events**: Like posting in a group chat (anyone interested can listen, sender doesn't need to know who's listening)

**Visual Diagram:**

```
DIRECT CALLS:                    CUSTOM EVENTS:
=============                    ==============

Component A                      Component A
    |                                |
    |--- calls --->                  |--- emits event --->
    |                                         |
Component B                              Event Bus
                                          /   |   \
                                         /    |    \
                                        B     C     D
                                    (all listening)

Tight coupling                    Loose coupling
```

**Interview Answer Template:**

> "Custom events let you create your own event types with custom data. They're perfect for component communication without tight coupling.
>
> You create them with `new CustomEvent('eventName', { detail: data })` where `detail` holds your custom data. Then dispatch with `element.dispatchEvent(event)`.
>
> For example, in an e-commerce app, when a user adds an item to the cart, I can dispatch a `cart:item-added` event. Then multiple components can listen for it:
> - Cart badge updates the count
> - Analytics tracks the event
> - Inventory system reserves the item
>
> None of these components need to know about each other. The cart just dispatches the event and anyone interested can listen.
>
> The main advantage is loose coupling - components communicate without direct dependencies, making code more maintainable and testable."

**Quick Reference:**

```javascript
// Create and dispatch
const event = new CustomEvent('my-event', {
  detail: { data: 'hello' },
  bubbles: true,
  cancelable: true
});
element.dispatchEvent(event);

// Listen
element.addEventListener('my-event', (e) => {
  console.log(e.detail); // { data: 'hello' }
});

// Event bus pattern
class EventBus {
  constructor() {
    this.bus = document.createElement('div');
  }
  on(event, callback) {
    this.bus.addEventListener(event, callback);
  }
  emit(event, detail) {
    this.bus.dispatchEvent(new CustomEvent(event, { detail }));
  }
}

// Usage
const bus = new EventBus();
bus.on('user:login', (e) => console.log(e.detail.user));
bus.emit('user:login', { user: { name: 'John' } });
```


</details>