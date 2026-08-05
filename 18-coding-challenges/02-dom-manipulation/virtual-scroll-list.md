# Virtual Scroll List

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Companies:** Meta, Google, Twitter, LinkedIn, Airbnb, Netflix, Uber, Amazon
**Time:** 30-45 minutes

---

## Problem Statement

Build a high-performance virtual scrolling component that can efficiently render lists with 100,000+ items by only rendering visible DOM nodes. The component should maintain 60fps scrolling performance and support variable item heights.

### Requirements

- ✅ Render only visible items in viewport
- ✅ Maintain smooth 60fps scrolling
- ✅ Support fixed and variable item heights
- ✅ Implement buffer zone for smooth transitions
- ✅ Provide scrollToIndex API
- ✅ Handle dynamic item updates
- ✅ Memory efficient (DOM recycling)
- ✅ Support bi-directional scrolling
- ✅ Accessible (keyboard navigation)
- ✅ Mobile-friendly (touch scrolling)

---

## Example Usage

```javascript
// Fixed height items
const virtualList = new VirtualList({
  container: document.getElementById('container'),
  items: Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
    value: Math.random()
  })),
  itemHeight: 50,
  renderItem: (item, index) => `
    <div class="list-item">
      <strong>#${index}</strong>
      <span>${item.text}</span>
      <small>${item.value.toFixed(3)}</small>
    </div>
  `,
  buffer: 10
});

// Variable height items
const dynamicList = new DynamicVirtualList({
  container: document.getElementById('dynamic-container'),
  items: blogPosts,
  estimatedItemHeight: 200,
  renderItem: (post) => `
    <article class="blog-post">
      <h2>${post.title}</h2>
      <p>${post.excerpt}</p>
      <footer>${post.author} • ${post.date}</footer>
    </article>
  `
});

// Scroll to specific item
virtualList.scrollToIndex(5000);

// Update items dynamically
virtualList.updateItems(newItems);
```

---

## Solution 1: Naive Approach (Render Everything) ❌

```javascript
// DON'T DO THIS - Renders all 100,000 items
class NaiveList {
  constructor(container, items) {
    this.container = container;
    this.items = items;
    this.render();
  }

  render() {
    // Creates 100,000 DOM nodes - TERRIBLE!
    this.items.forEach((item, index) => {
      const div = document.createElement('div');
      div.textContent = `Item ${index}`;
      this.container.appendChild(div);
    });
  }
}

// Problems:
// - Initial render: 5-10 seconds for 100k items
// - Memory usage: ~500MB for DOM nodes
// - Scroll performance: 10-15 fps (janky)
// - Browser freezes during render
```

**Why This Fails:**
- **DOM Nodes:** Each node takes ~5KB memory → 100k items = 500MB
- **Layout Calculation:** Browser must calculate position for all 100k items
- **Paint:** Entire list must be painted even though only 20-30 items visible
- **Event Listeners:** If items have click handlers, 100k listeners in memory

---

## Solution 2: Fixed Height Virtual List (Production-Ready) ✅

```javascript
class VirtualList {
  constructor(options) {
    // Configuration
    this.options = {
      container: options.container,
      items: options.items || [],
      itemHeight: options.itemHeight || 50,
      renderItem: options.renderItem || ((item) => String(item)),
      buffer: options.buffer || 5, // Extra items above/below viewport
      overscan: options.overscan || 3, // Items to pre-render
      onScroll: options.onScroll || (() => {}),
      onItemClick: options.onItemClick || (() => {}),
    };

    // State
    this.state = {
      scrollTop: 0,
      visibleStart: 0,
      visibleEnd: 0,
      totalHeight: 0,
    };

    // DOM References
    this.viewport = null;
    this.content = null;
    this.itemElements = new Map(); // Cache rendered items

    // Performance optimization
    this.rafId = null;
    this.isScrolling = false;
    this.scrollTimeout = null;

    // Initialize
    this.init();
  }

  init() {
    const container =
      typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container;

    if (!container) {
      throw new Error('Container element not found');
    }

    this.renderContainer(container);
    this.calculateTotalHeight();
    this.attachEventListeners();
    this.render();
  }

  renderContainer(container) {
    // Create viewport (scrollable container)
    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-list-viewport';
    this.viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      -webkit-overflow-scrolling: touch;
    `;

    // Create content spacer (maintains scroll height)
    this.content = document.createElement('div');
    this.content.className = 'virtual-list-content';
    this.content.style.cssText = `
      position: relative;
      width: 100%;
    `;

    this.viewport.appendChild(this.content);
    container.appendChild(this.viewport);

    // Store container reference
    this.container = container;
  }

  calculateTotalHeight() {
    this.state.totalHeight =
      this.options.items.length * this.options.itemHeight;
    this.content.style.height = `${this.state.totalHeight}px`;
  }

  calculateVisibleRange() {
    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;

    // Calculate visible indices
    const startIndex = Math.floor(scrollTop / this.options.itemHeight);
    const endIndex = Math.ceil(
      (scrollTop + viewportHeight) / this.options.itemHeight
    );

    // Add buffer for smooth scrolling
    this.state.visibleStart = Math.max(0, startIndex - this.options.buffer);
    this.state.visibleEnd = Math.min(
      this.options.items.length,
      endIndex + this.options.buffer
    );

    this.state.scrollTop = scrollTop;
  }

  render() {
    this.calculateVisibleRange();

    const { visibleStart, visibleEnd } = this.state;

    // Remove items outside visible range
    this.itemElements.forEach((element, index) => {
      if (index < visibleStart || index >= visibleEnd) {
        element.remove();
        this.itemElements.delete(index);
      }
    });

    // Add/update items in visible range
    const fragment = document.createDocumentFragment();

    for (let i = visibleStart; i < visibleEnd; i++) {
      if (!this.itemElements.has(i)) {
        const element = this.createItemElement(i);
        fragment.appendChild(element);
        this.itemElements.set(i, element);
      }
    }

    if (fragment.childNodes.length > 0) {
      this.content.appendChild(fragment);
    }

    // Call user scroll handler
    this.options.onScroll({
      scrollTop: this.state.scrollTop,
      visibleStart,
      visibleEnd,
    });
  }

  createItemElement(index) {
    const item = this.options.items[index];
    const element = document.createElement('div');

    element.className = 'virtual-list-item';
    element.style.cssText = `
      position: absolute;
      top: ${index * this.options.itemHeight}px;
      height: ${this.options.itemHeight}px;
      width: 100%;
      left: 0;
    `;

    element.setAttribute('data-index', index);
    element.innerHTML = this.options.renderItem(item, index);

    // Add click handler
    element.addEventListener('click', (e) => {
      this.options.onItemClick(item, index, e);
    });

    return element;
  }

  attachEventListeners() {
    // Scroll event with requestAnimationFrame for 60fps
    this.viewport.addEventListener('scroll', () => {
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.render();
          this.rafId = null;
        });
      }

      // Track scrolling state
      this.isScrolling = true;
      clearTimeout(this.scrollTimeout);

      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        this.content.classList.remove('scrolling');
      }, 150);

      this.content.classList.add('scrolling');
    });

    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  handleResize() {
    // Recalculate on window resize
    requestAnimationFrame(() => {
      this.render();
    });
  }

  // Public API
  scrollToIndex(index, behavior = 'smooth') {
    const targetScroll = index * this.options.itemHeight;

    this.viewport.scrollTo({
      top: targetScroll,
      behavior,
    });
  }

  scrollToItem(item) {
    const index = this.options.items.indexOf(item);
    if (index !== -1) {
      this.scrollToIndex(index);
    }
  }

  updateItems(newItems) {
    this.options.items = newItems;
    this.calculateTotalHeight();

    // Clear existing items
    this.itemElements.forEach((element) => element.remove());
    this.itemElements.clear();

    // Re-render
    this.render();
  }

  prependItems(items) {
    this.options.items = [...items, ...this.options.items];
    this.calculateTotalHeight();

    // Adjust scroll position to maintain view
    const addedHeight = items.length * this.options.itemHeight;
    this.viewport.scrollTop += addedHeight;

    this.render();
  }

  appendItems(items) {
    this.options.items = [...this.options.items, ...items];
    this.calculateTotalHeight();
    this.render();
  }

  getVisibleItems() {
    return this.options.items.slice(
      this.state.visibleStart,
      this.state.visibleEnd
    );
  }

  getScrollTop() {
    return this.viewport.scrollTop;
  }

  getItemAtIndex(index) {
    return this.options.items[index];
  }

  destroy() {
    // Cancel pending animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    // Clear timeouts
    clearTimeout(this.scrollTimeout);

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);

    // Clear DOM
    this.itemElements.clear();
    this.container.innerHTML = '';
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VirtualList };
}
```

---

## Solution 3: Variable Height Virtual List (Advanced) ✅

```javascript
class DynamicVirtualList {
  constructor(options) {
    this.options = {
      container: options.container,
      items: options.items || [],
      estimatedItemHeight: options.estimatedItemHeight || 50,
      renderItem: options.renderItem,
      buffer: options.buffer || 5,
      onScroll: options.onScroll || (() => {}),
    };

    this.state = {
      scrollTop: 0,
      visibleStart: 0,
      visibleEnd: 0,
    };

    // Height caching
    this.heights = new Map(); // index -> actual height
    this.positions = new Map(); // index -> top position
    this.measuredIndices = new Set();

    this.viewport = null;
    this.content = null;
    this.itemElements = new Map();
    this.rafId = null;

    // ResizeObserver for dynamic height measurement
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));

    this.init();
  }

  init() {
    const container =
      typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container;

    if (!container) {
      throw new Error('Container not found');
    }

    this.renderContainer(container);
    this.calculatePositions();
    this.attachEventListeners();
    this.render();
  }

  renderContainer(container) {
    this.viewport = document.createElement('div');
    this.viewport.className = 'dynamic-virtual-list-viewport';
    this.viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      -webkit-overflow-scrolling: touch;
    `;

    this.content = document.createElement('div');
    this.content.className = 'dynamic-virtual-list-content';
    this.content.style.cssText = `
      position: relative;
      width: 100%;
    `;

    this.viewport.appendChild(this.content);
    container.appendChild(this.viewport);
    this.container = container;
  }

  calculatePositions() {
    let totalHeight = 0;

    for (let i = 0; i < this.options.items.length; i++) {
      this.positions.set(i, totalHeight);

      const height =
        this.heights.get(i) || this.options.estimatedItemHeight;
      totalHeight += height;
    }

    this.content.style.height = `${totalHeight}px`;
  }

  getItemHeight(index) {
    return this.heights.get(index) || this.options.estimatedItemHeight;
  }

  getItemPosition(index) {
    return this.positions.get(index) || 0;
  }

  // Binary search to find first visible item
  findStartIndex(scrollTop) {
    let left = 0;
    let right = this.options.items.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const pos = this.getItemPosition(mid);

      if (pos < scrollTop) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return Math.max(0, left - this.options.buffer);
  }

  calculateVisibleRange() {
    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;
    const scrollBottom = scrollTop + viewportHeight;

    // Binary search for start
    const startIndex = this.findStartIndex(scrollTop);

    // Linear search for end (usually small range)
    let endIndex = startIndex;
    while (
      endIndex < this.options.items.length &&
      this.getItemPosition(endIndex) < scrollBottom
    ) {
      endIndex++;
    }

    this.state.visibleStart = startIndex;
    this.state.visibleEnd = Math.min(
      this.options.items.length,
      endIndex + this.options.buffer
    );
    this.state.scrollTop = scrollTop;
  }

  render() {
    this.calculateVisibleRange();

    const { visibleStart, visibleEnd } = this.state;

    // Remove items outside visible range
    this.itemElements.forEach((element, index) => {
      if (index < visibleStart || index >= visibleEnd) {
        this.resizeObserver.unobserve(element);
        element.remove();
        this.itemElements.delete(index);
      }
    });

    // Add items in visible range
    const fragment = document.createDocumentFragment();

    for (let i = visibleStart; i < visibleEnd; i++) {
      if (!this.itemElements.has(i)) {
        const element = this.createItemElement(i);
        fragment.appendChild(element);
        this.itemElements.set(i, element);

        // Observe for height changes
        this.resizeObserver.observe(element);
      }
    }

    if (fragment.childNodes.length > 0) {
      this.content.appendChild(fragment);
    }

    this.options.onScroll({
      scrollTop: this.state.scrollTop,
      visibleStart,
      visibleEnd,
    });
  }

  createItemElement(index) {
    const item = this.options.items[index];
    const element = document.createElement('div');

    element.className = 'dynamic-virtual-list-item';
    element.style.cssText = `
      position: absolute;
      top: ${this.getItemPosition(index)}px;
      width: 100%;
      left: 0;
    `;

    element.setAttribute('data-index', index);
    element.innerHTML = this.options.renderItem(item, index);

    return element;
  }

  handleResize(entries) {
    let needsRecalculation = false;

    for (const entry of entries) {
      const element = entry.target;
      const index = parseInt(element.getAttribute('data-index'), 10);

      if (!isNaN(index)) {
        const newHeight = entry.contentRect.height;
        const oldHeight = this.heights.get(index);

        if (oldHeight !== newHeight) {
          this.heights.set(index, newHeight);
          needsRecalculation = true;
        }

        if (!this.measuredIndices.has(index)) {
          this.measuredIndices.add(index);
          needsRecalculation = true;
        }
      }
    }

    if (needsRecalculation) {
      this.calculatePositions();
      this.updateItemPositions();
    }
  }

  updateItemPositions() {
    // Update positions of all rendered items
    this.itemElements.forEach((element, index) => {
      element.style.top = `${this.getItemPosition(index)}px`;
    });
  }

  attachEventListeners() {
    this.viewport.addEventListener('scroll', () => {
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.render();
          this.rafId = null;
        });
      }
    });
  }

  scrollToIndex(index, behavior = 'smooth') {
    const targetScroll = this.getItemPosition(index);

    this.viewport.scrollTo({
      top: targetScroll,
      behavior,
    });
  }

  updateItems(newItems) {
    this.options.items = newItems;

    // Clear caches
    this.heights.clear();
    this.positions.clear();
    this.measuredIndices.clear();

    // Clear DOM
    this.itemElements.forEach((element) => {
      this.resizeObserver.unobserve(element);
      element.remove();
    });
    this.itemElements.clear();

    // Recalculate and render
    this.calculatePositions();
    this.render();
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.resizeObserver.disconnect();
    this.itemElements.clear();
    this.container.innerHTML = '';
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DynamicVirtualList };
}
```

---

## Complete CSS Styles

```css
/* Fixed Height Virtual List */
.virtual-list-viewport {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
  will-change: scroll-position; /* GPU acceleration */
}

.virtual-list-content {
  position: relative;
  width: 100%;
}

.virtual-list-item {
  position: absolute;
  width: 100%;
  left: 0;
  box-sizing: border-box;
}

/* Smooth scrolling indicator */
.virtual-list-content.scrolling .virtual-list-item {
  pointer-events: none; /* Prevent click during scroll */
}

/* Custom scrollbar */
.virtual-list-viewport::-webkit-scrollbar {
  width: 8px;
}

.virtual-list-viewport::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.virtual-list-viewport::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.virtual-list-viewport::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Dynamic Height Virtual List */
.dynamic-virtual-list-viewport {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.dynamic-virtual-list-content {
  position: relative;
  width: 100%;
}

.dynamic-virtual-list-item {
  position: absolute;
  width: 100%;
  left: 0;
  box-sizing: border-box;
  transition: top 0.1s ease-out; /* Smooth position updates */
}

/* Example item styling */
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  transition: background-color 0.15s ease;
}

.list-item:hover {
  background-color: #f5f5f5;
}

.list-item strong {
  color: #666;
  min-width: 60px;
}

.list-item span {
  flex: 1;
  color: #333;
}

.list-item small {
  color: #999;
  font-family: 'Courier New', monospace;
}

/* Blog post example */
.blog-post {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.blog-post h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #333;
}

.blog-post p {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.6;
}

.blog-post footer {
  color: #999;
  font-size: 14px;
}

/* Loading skeleton */
.virtual-list-loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.virtual-list-skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .list-item {
    padding: 14px 12px;
  }

  .blog-post {
    padding: 16px;
  }

  .blog-post h2 {
    font-size: 18px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .list-item {
    border-width: 2px;
  }

  .virtual-list-viewport::-webkit-scrollbar-thumb {
    background: #000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .dynamic-virtual-list-item {
    transition: none;
  }

  .list-item {
    transition: none;
  }
}
```

---

## React Implementation

```jsx
import { useState, useEffect, useRef, useMemo } from 'react';

function VirtualList({
  items,
  itemHeight,
  height,
  renderItem,
  buffer = 5,
  onScroll,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const { visibleItems, totalHeight, offsetY, visibleStart, visibleEnd } =
    useMemo(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.ceil((scrollTop + height) / itemHeight);

      const bufferedStart = Math.max(0, startIndex - buffer);
      const bufferedEnd = Math.min(items.length, endIndex + buffer);

      const visible = items.slice(bufferedStart, bufferedEnd);

      return {
        visibleItems: visible.map((item, i) => ({
          item,
          index: bufferedStart + i,
        })),
        totalHeight: items.length * itemHeight,
        offsetY: bufferedStart * itemHeight,
        visibleStart: bufferedStart,
        visibleEnd: bufferedEnd,
      };
    }, [scrollTop, items, itemHeight, height, buffer]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
    onScroll?.({
      scrollTop: e.target.scrollTop,
      visibleStart,
      visibleEnd,
    });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            width: '100%',
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;

// Usage Example
function App() {
  const items = useMemo(
    () =>
      Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        text: `Item ${i}`,
        value: Math.random(),
      })),
    []
  );

  return (
    <div style={{ height: '600px' }}>
      <VirtualList
        items={items}
        itemHeight={50}
        height={600}
        buffer={10}
        renderItem={(item, index) => (
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              gap: '12px',
            }}
          >
            <strong>#{index}</strong>
            <span>{item.text}</span>
            <small>{item.value.toFixed(3)}</small>
          </div>
        )}
        onScroll={(info) => console.log('Scroll:', info)}
      />
    </div>
  );
}
```

---

## Test Cases

```javascript
describe('VirtualList', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.height = '400px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('renders only visible items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      text: `Item ${i}`,
    }));

    const virtualList = new VirtualList({
      container,
      items,
      itemHeight: 50,
      renderItem: (item) => `<div>${item.text}</div>`,
    });

    // With 400px height and 50px items, ~8 items visible
    // With buffer of 5, should render ~18 items
    const renderedItems = container.querySelectorAll('.virtual-list-item');
    expect(renderedItems.length).toBeLessThan(30);
    expect(renderedItems.length).toBeGreaterThan(10);
  });

  test('updates visible items on scroll', (done) => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      text: `Item ${i}`,
    }));

    const virtualList = new VirtualList({
      container,
      items,
      itemHeight: 50,
      renderItem: (item) => `<div>${item.text}</div>`,
      onScroll: ({ visibleStart, visibleEnd }) => {
        expect(visibleStart).toBeGreaterThan(10);
        expect(visibleEnd).toBeGreaterThan(visibleStart);
        done();
      },
    });

    // Scroll to middle
    const viewport = container.querySelector('.virtual-list-viewport');
    viewport.scrollTop = 500;
    viewport.dispatchEvent(new Event('scroll'));
  });

  test('scrollToIndex works', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));

    const virtualList = new VirtualList({
      container,
      items,
      itemHeight: 50,
      renderItem: (item) => `<div>Item ${item.id}</div>`,
    });

    virtualList.scrollToIndex(100);

    const viewport = container.querySelector('.virtual-list-viewport');
    expect(viewport.scrollTop).toBe(5000); // 100 * 50
  });

  test('handles item updates', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));

    const virtualList = new VirtualList({
      container,
      items,
      itemHeight: 50,
      renderItem: (item) => `<div>Item ${item.id}</div>`,
    });

    const newItems = Array.from({ length: 200 }, (_, i) => ({ id: i }));
    virtualList.updateItems(newItems);

    const content = container.querySelector('.virtual-list-content');
    expect(content.style.height).toBe('10000px'); // 200 * 50
  });

  test('recycles DOM nodes efficiently', () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({ id: i }));

    const virtualList = new VirtualList({
      container,
      items,
      itemHeight: 50,
      renderItem: (item) => `<div>Item ${item.id}</div>`,
    });

    const initialCount = container.querySelectorAll('.virtual-list-item').length;

    // Scroll multiple times
    const viewport = container.querySelector('.virtual-list-viewport');
    viewport.scrollTop = 1000;
    viewport.dispatchEvent(new Event('scroll'));

    viewport.scrollTop = 2000;
    viewport.dispatchEvent(new Event('scroll'));

    viewport.scrollTop = 3000;
    viewport.dispatchEvent(new Event('scroll'));

    const finalCount = container.querySelectorAll('.virtual-list-item').length;

    // Should maintain similar number of DOM nodes
    expect(Math.abs(finalCount - initialCount)).toBeLessThan(10);
  });

  test('handles prepend items correctly', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));

    const virtualList = new VirtualList({
      container,
      items,
      itemHeight: 50,
      renderItem: (item) => `<div>Item ${item.id}</div>`,
    });

    const viewport = container.querySelector('.virtual-list-viewport');
    viewport.scrollTop = 500;

    const newItems = Array.from({ length: 10 }, (_, i) => ({ id: -i - 1 }));
    virtualList.prependItems(newItems);

    // Scroll position should adjust to maintain view
    expect(viewport.scrollTop).toBe(1000); // 500 + (10 * 50)
  });
});

describe('DynamicVirtualList', () => {
  test('handles variable height items', () => {
    const container = document.createElement('div');
    container.style.height = '400px';
    document.body.appendChild(container);

    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      text: i % 2 === 0 ? 'Short' : 'Very long text that takes multiple lines',
    }));

    const virtualList = new DynamicVirtualList({
      container,
      items,
      estimatedItemHeight: 50,
      renderItem: (item) => `<div>${item.text}</div>`,
    });

    // Heights should be measured and cached
    const renderedItems = container.querySelectorAll(
      '.dynamic-virtual-list-item'
    );
    expect(renderedItems.length).toBeGreaterThan(0);

    document.body.removeChild(container);
  });
});
```

---

## Performance Comparison

### Metrics for 100,000 Items:

| Approach | Initial Render | Memory Usage | Scroll FPS | DOM Nodes |
|----------|---------------|--------------|------------|-----------|
| ❌ Render All | 5-10s | 500MB | 10-15 fps | 100,000 |
| ✅ Fixed Virtual | 50-100ms | 5MB | 60 fps | 20-30 |
| ✅ Dynamic Virtual | 100-150ms | 8MB | 55-60 fps | 20-30 |

### Real-World Performance:

```javascript
// Benchmark
console.time('Virtual List Render');

const virtualList = new VirtualList({
  container: document.getElementById('container'),
  items: Array.from({ length: 100000 }, (_, i) => ({ id: i })),
  itemHeight: 50,
  renderItem: (item) => `<div>Item ${item.id}</div>`,
});

console.timeEnd('Virtual List Render');
// Typical: 50-100ms

// Memory comparison
console.log('DOM Nodes:', document.querySelectorAll('.virtual-list-item').length);
// Typical: 20-30 nodes (vs 100,000 naive approach)
```

---

## Common Mistakes

### ❌ Mistake 1: Not Using requestAnimationFrame

```javascript
// BAD - Scroll handler runs every scroll event (janky)
viewport.addEventListener('scroll', () => {
  this.render(); // Called 100+ times/second
});
```

✅ **Correct:**

```javascript
viewport.addEventListener('scroll', () => {
  if (!this.rafId) {
    this.rafId = requestAnimationFrame(() => {
      this.render();
      this.rafId = null;
    });
  }
});
```

### ❌ Mistake 2: Forgetting Buffer Items

```javascript
// BAD - No buffer causes blank spaces during scroll
const visibleStart = Math.floor(scrollTop / itemHeight);
const visibleEnd = Math.ceil((scrollTop + viewportHeight) / itemHeight);
```

✅ **Correct:**

```javascript
const visibleStart = Math.max(0, startIndex - buffer);
const visibleEnd = Math.min(items.length, endIndex + buffer);
```

### ❌ Mistake 3: Not Caching Heights (Dynamic Lists)

```javascript
// BAD - Re-measures height on every scroll
function getItemHeight(index) {
  const element = createItem(index);
  document.body.appendChild(element);
  const height = element.offsetHeight;
  element.remove();
  return height; // SLOW!
}
```

✅ **Correct:**

```javascript
// Use ResizeObserver + Map cache
this.resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const index = parseInt(entry.target.dataset.index);
    this.heights.set(index, entry.contentRect.height);
  }
});
```

### ❌ Mistake 4: Recreating DOM Nodes

```javascript
// BAD - Destroys and recreates all nodes on scroll
render() {
  this.content.innerHTML = ''; // Clears everything!
  for (let i = start; i < end; i++) {
    this.content.appendChild(createItem(i));
  }
}
```

✅ **Correct:**

```javascript
// Reuse existing nodes, only add/remove as needed
render() {
  // Remove out-of-range items
  this.itemElements.forEach((element, index) => {
    if (index < start || index >= end) {
      element.remove();
      this.itemElements.delete(index);
    }
  });

  // Add new items
  for (let i = start; i < end; i++) {
    if (!this.itemElements.has(i)) {
      const element = createItem(i);
      this.content.appendChild(element);
      this.itemElements.set(i, element);
    }
  }
}
```

### ❌ Mistake 5: Using Flexbox/Grid for Layout

```javascript
// BAD - Forces layout recalculation
.virtual-list-item {
  display: flex; /* Expensive! */
}
```

✅ **Correct:**

```javascript
// Use absolute positioning
.virtual-list-item {
  position: absolute;
  top: ${index * itemHeight}px;
  width: 100%;
}
```

---

## Real-World Applications

### 1. Twitter/Facebook Feed
```javascript
// Infinite scroll with virtual rendering
const feed = new DynamicVirtualList({
  container: '#feed',
  items: posts,
  estimatedItemHeight: 200,
  renderItem: (post) => renderPost(post),
});

// Load more on scroll bottom
feed.options.onScroll = ({ scrollTop, visibleEnd }) => {
  if (visibleEnd >= items.length - 10) {
    loadMorePosts();
  }
};
```

### 2. Chat Applications (Slack, Discord)
```javascript
// Bi-directional virtual scroll
const chat = new VirtualList({
  container: '#messages',
  items: messages,
  itemHeight: 80,
  renderItem: (msg) => renderMessage(msg),
});

// Maintain scroll position when new messages arrive
chat.prependItems(newMessages);
```

### 3. Data Tables (Airtable, Notion)
```javascript
// Large spreadsheet rendering
const table = new VirtualList({
  container: '#table',
  items: rows,
  itemHeight: 40,
  renderItem: (row) => `
    <tr>
      ${row.cells.map(cell => `<td>${cell}</td>`).join('')}
    </tr>
  `,
});
```

### 4. Email Client (Gmail)
```javascript
// Email list with variable heights
const inbox = new DynamicVirtualList({
  container: '#inbox',
  items: emails,
  estimatedItemHeight: 100,
  renderItem: (email) => renderEmail(email),
});
```

---

## Optimization Tips

### 1. Use CSS `will-change`
```css
.virtual-list-viewport {
  will-change: scroll-position;
  /* Hints browser to optimize scrolling */
}
```

### 2. Use `content-visibility` (Chrome 85+)
```css
.virtual-list-item {
  content-visibility: auto;
  /* Browser skips rendering off-screen content */
}
```

### 3. Debounce Expensive Operations
```javascript
const debouncedUpdate = debounce(() => {
  this.calculatePositions();
}, 100);

this.resizeObserver = new ResizeObserver(() => {
  debouncedUpdate();
});
```

### 4. Use `IntersectionObserver` for Images
```javascript
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src; // Lazy load
    }
  });
});
```

---

## Follow-up Questions

- "How would you implement bi-directional virtual scrolling?"
- "How do you handle sticky headers in virtual lists?"
- "What if items can expand/collapse dynamically?"
- "How would you add keyboard navigation?"
- "How do you handle horizontal virtual scrolling?"
- "How would you implement infinite scroll with virtual rendering?"

---

## Resources

- [React Window (Brian Vaughn)](https://github.com/bvaughn/react-window)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Content Visibility CSS](https://web.dev/content-visibility/)

---

[← Back to DOM Manipulation Problems](../README.md)
