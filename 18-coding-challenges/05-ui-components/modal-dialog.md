# Modal Dialog Component

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Companies:** All companies
**Time:** 35 minutes

---

## Problem Statement

Build an accessible, reusable modal dialog component with proper focus management, keyboard navigation, and backdrop interaction.

### Requirements

- ✅ Overlay backdrop with click-to-close
- ✅ Focus trap inside modal
- ✅ Keyboard navigation (ESC to close, Tab cycling)
- ✅ Accessibility (ARIA attributes, focus management)
- ✅ Animation (open/close transitions)
- ✅ Prevent body scroll when open
- ✅ Stack multiple modals

---

## Solution

### HTML/CSS/Vanilla JS

```html
<!DOCTYPE html>
<html>
<head>
<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-overlay.active {
  opacity: 1;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.modal-overlay.active .modal {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f0f0f0;
}

.modal-body {
  margin-bottom: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

body.modal-open {
  overflow: hidden;
}
</style>
</head>
<body>
  <button id="openModal">Open Modal</button>

  <div id="modalRoot"></div>

  <script>
    class Modal {
      constructor(options = {}) {
        this.title = options.title || '';
        this.content = options.content || '';
        this.onClose = options.onClose || null;
        this.closeOnBackdrop = options.closeOnBackdrop !== false;
        this.closeOnEsc = options.closeOnEsc !== false;

        this.overlay = null;
        this.modal = null;
        this.previousFocus = null;
        this.focusableElements = [];

        this.create();
      }

      create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-labelledby', 'modal-title');

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'modal';

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';

        const title = document.createElement('h2');
        title.id = 'modal-title';
        title.className = 'modal-title';
        title.textContent = this.title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.addEventListener('click', () => this.close());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = this.content;

        // Footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.close());

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.style.cssText = 'background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;';
        confirmBtn.addEventListener('click', () => {
          console.log('Confirmed!');
          this.close();
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        // Assemble
        this.modal.appendChild(header);
        this.modal.appendChild(body);
        this.modal.appendChild(footer);
        this.overlay.appendChild(this.modal);

        // Event listeners
        if (this.closeOnBackdrop) {
          this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
              this.close();
            }
          });
        }

        if (this.closeOnEsc) {
          this.handleEscape = (e) => {
            if (e.key === 'Escape') {
              this.close();
            }
          };
          document.addEventListener('keydown', this.handleEscape);
        }
      }

      open() {
        // Save current focus
        this.previousFocus = document.activeElement;

        // Append to DOM
        document.getElementById('modalRoot').appendChild(this.overlay);

        // Prevent body scroll
        document.body.classList.add('modal-open');

        // Trigger animation
        requestAnimationFrame(() => {
          this.overlay.classList.add('active');
        });

        // Focus management
        this.setupFocusTrap();
        this.focusFirstElement();
      }

      close() {
        // Remove active class
        this.overlay.classList.remove('active');

        // Wait for animation
        setTimeout(() => {
          this.overlay.remove();
          document.body.classList.remove('modal-open');

          // Restore focus
          if (this.previousFocus) {
            this.previousFocus.focus();
          }

          // Cleanup
          document.removeEventListener('keydown', this.handleEscape);

          // Call callback
          if (this.onClose) {
            this.onClose();
          }
        }, 300);
      }

      setupFocusTrap() {
        // Get all focusable elements
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(
          this.modal.querySelectorAll(focusableSelector)
        );

        // Handle Tab key
        this.modal.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab') return;

          const firstElement = this.focusableElements[0];
          const lastElement = this.focusableElements[this.focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      }

      focusFirstElement() {
        if (this.focusableElements.length > 0) {
          this.focusableElements[0].focus();
        }
      }
    }

    // Usage
    document.getElementById('openModal').addEventListener('click', () => {
      const modal = new Modal({
        title: 'Confirm Action',
        content: '<p>Are you sure you want to continue?</p>',
        onClose: () => console.log('Modal closed')
      });
      modal.open();
    });
  </script>
</body>
</html>
```

---

### React Implementation

```jsx
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
  closeOnEsc = true
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocusRef.current = document.activeElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Trigger animation
      setIsAnimating(true);

      // Focus first element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`modal-overlay ${isAnimating ? 'active' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={modalRef} className="modal">
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// Usage
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Modal
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Action"
      >
        <p>Are you sure you want to continue?</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          <button onClick={() => {
            console.log('Confirmed!');
            setIsModalOpen(false);
          }}>
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
}
```

---

## Common Mistakes

- ❌ No focus trap (Tab escapes modal)
- ❌ Not restoring focus after close
- ❌ Forgetting ARIA attributes
- ❌ Body scroll not prevented
- ❌ Backdrop click closes even when clicking modal
- ❌ No keyboard support (ESC key)

✅ Implement focus trap
✅ Save and restore previous focus
✅ Add proper ARIA attributes
✅ Prevent body scroll when open
✅ Check event.target for backdrop
✅ Support ESC key to close

---

[← Back to UI Components](../README.md)
