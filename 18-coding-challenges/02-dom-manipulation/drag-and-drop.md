# Drag and Drop Implementation

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐
**Companies:** Google, Meta, Airbnb
**Time:** 30 minutes

---

## Problem

Build a drag-and-drop system for reordering list items.

### Requirements

- ✅ Drag items to reorder
- ✅ Visual feedback during drag
- ✅ Touch device support
- ✅ Handle drop zones
- ✅ Accessibility support

---

## Solution

```javascript
class DragAndDrop {
  constructor(container) {
    this.container = container;
    this.draggedItem = null;
    this.init();
  }

  init() {
    const items = this.container.querySelectorAll('[draggable="true"]');

    items.forEach(item => {
      item.addEventListener('dragstart', this.handleDragStart.bind(this));
      item.addEventListener('dragend', this.handleDragEnd.bind(this));
      item.addEventListener('dragover', this.handleDragOver.bind(this));
      item.addEventListener('drop', this.handleDrop.bind(this));
    });
  }

  handleDragStart(e) {
    this.draggedItem = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this.draggedItem = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = this.getDragAfterElement(e.clientY);
    if (afterElement == null) {
      this.container.appendChild(this.draggedItem);
    } else {
      this.container.insertBefore(this.draggedItem, afterElement);
    }
  }

  handleDrop(e) {
    e.stopPropagation();
    return false;
  }

  getDragAfterElement(y) {
    const draggableElements = [...this.container.querySelectorAll('[draggable="true"]:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}

// Usage
const container = document.getElementById('sortable-list');
new DragAndDrop(container);
```

---

## HTML Structure

```html
<ul id="sortable-list">
  <li draggable="true">Item 1</li>
  <li draggable="true">Item 2</li>
  <li draggable="true">Item 3</li>
</ul>

<style>
.dragging {
  opacity: 0.5;
}
</style>
```

---

[← Back to DOM Manipulation](../README.md)
