# Virtual Scroll / Windowing

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐
**Companies:** Meta, Google, Twitter, LinkedIn
**Time:** 45 minutes

---

## Problem Statement

Implement a virtual scroll component that efficiently renders only visible items from a large list (10,000+ items) by using DOM recycling and viewport calculation.

### Requirements

- ✅ Render only visible items (window)
- ✅ Smooth scrolling experience
- ✅ Handle variable item heights
- ✅ Support scroll to index
- ✅ Optimize for 60fps
- ✅ Memory efficient

---

## Solution

```javascript
class VirtualScroll {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight || 50;
    this.renderItem = options.renderItem;
    this.buffer = options.buffer || 5; // Extra items to render

    this.viewport = null;
    this.content = null;
    this.visibleItems = new Map();

    this.init();
  }

  init() {
    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.style.cssText = `
      height: ${this.container.clientHeight}px;
      overflow-y: auto;
      position: relative;
    `;

    // Create content spacer
    this.content = document.createElement('div');
    this.content.style.cssText = `
      height: ${this.items.length * this.itemHeight}px;
      position: relative;
    `;

    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);

    // Event listeners
    this.viewport.addEventListener('scroll', this.onScroll.bind(this));

    // Initial render
    this.render();
  }

  onScroll() {
    requestAnimationFrame(() => this.render());
  }

  getVisibleRange() {
    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;

    const startIndex = Math.floor(scrollTop / this.itemHeight) - this.buffer;
    const endIndex = Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.buffer;

    return {
      start: Math.max(0, startIndex),
      end: Math.min(this.items.length, endIndex)
    };
  }

  render() {
    const { start, end } = this.getVisibleRange();

    // Remove items outside visible range
    this.visibleItems.forEach((element, index) => {
      if (index < start || index >= end) {
        element.remove();
        this.visibleItems.delete(index);
      }
    });

    // Add/update visible items
    for (let i = start; i < end; i++) {
      if (!this.visibleItems.has(i)) {
        const element = this.createItem(i);
        this.content.appendChild(element);
        this.visibleItems.set(i, element);
      }
    }
  }

  createItem(index) {
    const element = document.createElement('div');
    element.style.cssText = `
      position: absolute;
      top: ${index * this.itemHeight}px;
      height: ${this.itemHeight}px;
      width: 100%;
    `;

    element.innerHTML = this.renderItem(this.items[index], index);
    return element;
  }

  scrollToIndex(index) {
    this.viewport.scrollTop = index * this.itemHeight;
  }

  updateItems(newItems) {
    this.items = newItems;
    this.content.style.height = `${this.items.length * this.itemHeight}px`;
    this.visibleItems.clear();
    this.content.innerHTML = '';
    this.render();
  }
}

// Usage
const virtualScroll = new VirtualScroll({
  container: document.getElementById('container'),
  items: Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Item ${i}` })),
  itemHeight: 50,
  renderItem: (item, index) => `
    <div style="padding: 15px; border-bottom: 1px solid #eee;">
      ${item.text}
    </div>
  `
});
```

---

## Advanced: Variable Height Items

```javascript
class AdvancedVirtualScroll {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.renderItem = options.renderItem;
    this.estimatedItemHeight = options.estimatedItemHeight || 50;

    this.heights = new Map(); // Store actual heights
    this.offsets = new Map(); // Store item positions
    this.measuredItems = new Set();

    this.init();
  }

  init() {
    this.viewport = document.createElement('div');
    this.viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
      position: relative;
    `;

    this.content = document.createElement('div');
    this.content.style.position = 'relative';

    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);

    this.viewport.addEventListener('scroll',
      this.throttle(this.onScroll.bind(this), 16)
    );

    this.calculateOffsets();
    this.render();
  }

  calculateOffsets() {
    let offset = 0;

    for (let i = 0; i < this.items.length; i++) {
      this.offsets.set(i, offset);
      const height = this.heights.get(i) || this.estimatedItemHeight;
      offset += height;
    }

    this.content.style.height = `${offset}px`;
  }

  measureItem(index, element) {
    if (!this.measuredItems.has(index)) {
      const height = element.offsetHeight;
      this.heights.set(index, height);
      this.measuredItems.add(index);

      // Recalculate if different from estimate
      if (Math.abs(height - this.estimatedItemHeight) > 1) {
        this.calculateOffsets();
      }
    }
  }

  getVisibleRange() {
    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;

    let start = 0;
    let end = this.items.length;

    // Binary search for start
    for (let i = 0; i < this.items.length; i++) {
      if (this.offsets.get(i) >= scrollTop) {
        start = Math.max(0, i - 2);
        break;
      }
    }

    // Find end
    const scrollBottom = scrollTop + viewportHeight;
    for (let i = start; i < this.items.length; i++) {
      if (this.offsets.get(i) > scrollBottom) {
        end = Math.min(this.items.length, i + 2);
        break;
      }
    }

    return { start, end };
  }

  throttle(func, wait) {
    let timeout;
    return function(...args) {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          func.apply(this, args);
        }, wait);
      }
    };
  }

  render() {
    const { start, end } = this.getVisibleRange();
    const fragment = document.createDocumentFragment();

    this.content.innerHTML = '';

    for (let i = start; i < end; i++) {
      const element = this.createItem(i);
      fragment.appendChild(element);

      // Measure after render
      requestAnimationFrame(() => {
        this.measureItem(i, element);
      });
    }

    this.content.appendChild(fragment);
  }

  createItem(index) {
    const element = document.createElement('div');
    element.style.cssText = `
      position: absolute;
      top: ${this.offsets.get(index)}px;
      width: 100%;
    `;

    element.innerHTML = this.renderItem(this.items[index], index);
    element.dataset.index = index;

    return element;
  }

  onScroll() {
    this.render();
  }
}
```

---

## React Implementation

```jsx
import { useState, useEffect, useRef, useMemo } from 'react';

function VirtualList({ items, itemHeight, height, renderItem }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + height) / itemHeight);

    const visible = items.slice(
      Math.max(0, startIndex - 5),
      Math.min(items.length, endIndex + 5)
    );

    return {
      visibleItems: visible,
      totalHeight: items.length * itemHeight,
      offsetY: Math.max(0, startIndex - 5) * itemHeight
    };
  }, [scrollTop, items, itemHeight, height]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            width: '100%'
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage
function App() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`
  }));

  return (
    <VirtualList
      items={items}
      itemHeight={50}
      height={600}
      renderItem={(item) => (
        <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          {item.text}
        </div>
      )}
    />
  );
}
```

---

## Common Mistakes

- ❌ Rendering all items (kills performance)
- ❌ Not using requestAnimationFrame (janky scroll)
- ❌ Recreating DOM nodes on every scroll
- ❌ Not handling variable heights
- ❌ Forgetting buffer items (flashing)

✅ Render only visible + buffer
✅ Reuse DOM nodes
✅ Use RAF for smooth rendering
✅ Measure and cache heights
✅ Optimize with IntersectionObserver

---

[← Back to DOM Manipulation](../README.md)
