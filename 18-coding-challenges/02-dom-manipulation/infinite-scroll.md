# Infinite Scroll Implementation

## Problem Statement

Implement infinite scroll that loads more content as the user scrolls to the bottom of the page. Include loading states, error handling, and performance optimizations.

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time to Solve:** 30-40 minutes
**Companies:** Meta, Instagram, Twitter, Pinterest, LinkedIn

## Requirements

- [ ] Load initial batch of items
- [ ] Detect when user scrolls near bottom
- [ ] Fetch next batch of items
- [ ] Show loading indicator
- [ ] Handle end of data
- [ ] Handle errors
- [ ] Prevent duplicate requests
- [ ] Use Intersection Observer for efficiency
- [ ] Support pagination

## Example Usage

```javascript
const infiniteScroll = new InfiniteScroll({
  container: '#content',
  fetchData: async (page) => {
    const response = await fetch(`/api/items?page=${page}`);
    return response.json();
  },
  renderItem: (item) => `
    <div class="item">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </div>
  `,
  threshold: 200, // pixels from bottom
});
```

## Solution 1: Vanilla JavaScript with Intersection Observer

```javascript
class InfiniteScroll {
  constructor(options) {
    this.container =
      typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;

    this.fetchData = options.fetchData;
    this.renderItem = options.renderItem;
    this.threshold = options.threshold || 200;
    this.initialPage = options.initialPage || 1;

    this.state = {
      page: this.initialPage,
      isLoading: false,
      hasMore: true,
      items: [],
    };

    this.init();
  }

  init() {
    this.createSentinel();
    this.setupObserver();
    this.loadMore();
  }

  createSentinel() {
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'infinite-scroll-sentinel';
    this.sentinel.style.height = '1px';
    this.container.appendChild(this.sentinel);

    this.loader = document.createElement('div');
    this.loader.className = 'infinite-scroll-loader';
    this.loader.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
    this.loader.style.display = 'none';
    this.container.appendChild(this.loader);
  }

  setupObserver() {
    const options = {
      root: null,
      rootMargin: `${this.threshold}px`,
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.state.isLoading && this.state.hasMore) {
          this.loadMore();
        }
      });
    }, options);

    this.observer.observe(this.sentinel);
  }

  async loadMore() {
    if (this.state.isLoading || !this.state.hasMore) return;

    this.state.isLoading = true;
    this.showLoader();

    try {
      const data = await this.fetchData(this.state.page);

      if (!data || data.length === 0) {
        this.state.hasMore = false;
        this.showEndMessage();
        return;
      }

      this.state.items.push(...data);
      this.renderItems(data);
      this.state.page++;
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError(error);
    } finally {
      this.state.isLoading = false;
      this.hideLoader();
    }
  }

  renderItems(items) {
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const div = document.createElement('div');
      div.innerHTML = this.renderItem(item);
      fragment.appendChild(div.firstElementChild);
    });

    this.container.insertBefore(fragment, this.sentinel);
  }

  showLoader() {
    this.loader.style.display = 'block';
  }

  hideLoader() {
    this.loader.style.display = 'none';
  }

  showEndMessage() {
    if (this.endMessage) return;

    this.endMessage = document.createElement('div');
    this.endMessage.className = 'infinite-scroll-end';
    this.endMessage.textContent = 'No more items to load';
    this.container.appendChild(this.endMessage);
  }

  showError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'infinite-scroll-error';
    errorDiv.innerHTML = `
      <p>Failed to load items: ${error.message}</p>
      <button onclick="this.parentElement.remove()">Dismiss</button>
    `;
    this.container.insertBefore(errorDiv, this.sentinel);

    setTimeout(() => errorDiv.remove(), 5000);
  }

  destroy() {
    this.observer.disconnect();
    this.sentinel.remove();
    this.loader.remove();
    if (this.endMessage) this.endMessage.remove();
  }
}

// Usage
const scroll = new InfiniteScroll({
  container: '#feed',
  fetchData: async (page) => {
    const response = await fetch(`/api/posts?page=${page}&limit=10`);
    return response.json();
  },
  renderItem: (post) => `
    <article class="post">
      <h2>${post.title}</h2>
      <p>${post.content}</p>
      <footer>Posted: ${post.date}</footer>
    </article>
  `,
});
```

## Solution 2: React Implementation

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function InfiniteScroll({ fetchData, renderItem, threshold = 200 }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchData(page);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      setItems((prev) => [...prev, ...data]);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchData]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, options);

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, threshold]);

  // Load initial data
  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div className="infinite-scroll-container">
      <div className="items-list">
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem ? renderItem(item) : JSON.stringify(item)}
          </div>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => loadMore()}>Retry</button>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="end-message">
          <p>No more items to load</p>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}

// Custom hook version
function useInfiniteScroll(fetchData, options = {}) {
  const {
    initialPage = 1,
    threshold = 200,
  } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchData(page);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      setItems((prev) => [...prev, ...data]);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchData]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loadMore, threshold]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    sentinelRef,
    loadMore,
  };
}

// Usage with custom hook
function Feed() {
  const {
    items,
    isLoading,
    hasMore,
    error,
    sentinelRef,
    loadMore,
  } = useInfiniteScroll(async (page) => {
    const response = await fetch(`/api/posts?page=${page}`);
    return response.json();
  });

  return (
    <div>
      {items.map((post) => (
        <Post key={post.id} {...post} />
      ))}

      {error && (
        <div>
          Error: {error}
          <button onClick={loadMore}>Retry</button>
        </div>
      )}

      {isLoading && <div>Loading...</div>}
      {!hasMore && <div>No more posts</div>}

      <div ref={sentinelRef} />
    </div>
  );
}
```

## Solution 3: Bi-Directional Infinite Scroll

```javascript
// Load both older items (bottom) and newer items (top)
class BiDirectionalScroll {
  constructor(options) {
    this.container = document.querySelector(options.container);
    this.fetchOlder = options.fetchOlder;
    this.fetchNewer = options.fetchNewer;
    this.renderItem = options.renderItem;

    this.state = {
      olderPage: 1,
      newerPage: 1,
      isLoadingOlder: false,
      isLoadingNewer: false,
      hasMoreOlder: true,
      hasMoreNewer: true,
      scrollRestorationKey: null,
    };

    this.init();
  }

  init() {
    this.createSentinels();
    this.setupObservers();
    this.loadOlder(); // Initial load
  }

  createSentinels() {
    // Top sentinel
    this.topSentinel = document.createElement('div');
    this.topSentinel.className = 'top-sentinel';
    this.topSentinel.style.height = '1px';
    this.container.insertBefore(this.topSentinel, this.container.firstChild);

    // Bottom sentinel
    this.bottomSentinel = document.createElement('div');
    this.bottomSentinel.className = 'bottom-sentinel';
    this.bottomSentinel.style.height = '1px';
    this.container.appendChild(this.bottomSentinel);

    // Loaders
    this.topLoader = this.createLoader('top');
    this.bottomLoader = this.createLoader('bottom');
    this.container.insertBefore(this.topLoader, this.topSentinel.nextSibling);
    this.container.insertBefore(this.bottomLoader, this.bottomSentinel);
  }

  createLoader(position) {
    const loader = document.createElement('div');
    loader.className = `loader-${position}`;
    loader.innerHTML = '<div class="spinner"></div>';
    loader.style.display = 'none';
    return loader;
  }

  setupObservers() {
    // Observer for bottom (older items)
    this.bottomObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !this.state.isLoadingOlder &&
          this.state.hasMoreOlder
        ) {
          this.loadOlder();
        }
      },
      { rootMargin: '200px' }
    );
    this.bottomObserver.observe(this.bottomSentinel);

    // Observer for top (newer items)
    this.topObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !this.state.isLoadingNewer &&
          this.state.hasMoreNewer
        ) {
          this.loadNewer();
        }
      },
      { rootMargin: '200px' }
    );
    this.topObserver.observe(this.topSentinel);
  }

  async loadOlder() {
    if (this.state.isLoadingOlder || !this.state.hasMoreOlder) return;

    this.state.isLoadingOlder = true;
    this.bottomLoader.style.display = 'block';

    try {
      const items = await this.fetchOlder(this.state.olderPage);

      if (!items || items.length === 0) {
        this.state.hasMoreOlder = false;
        return;
      }

      this.renderItemsAtBottom(items);
      this.state.olderPage++;
    } catch (error) {
      console.error('Error loading older items:', error);
    } finally {
      this.state.isLoadingOlder = false;
      this.bottomLoader.style.display = 'none';
    }
  }

  async loadNewer() {
    if (this.state.isLoadingNewer || !this.state.hasMoreNewer) return;

    this.state.isLoadingNewer = true;
    this.topLoader.style.display = 'block';

    // Save scroll position
    const scrollBefore = this.container.scrollHeight - this.container.scrollTop;

    try {
      const items = await this.fetchNewer(this.state.newerPage);

      if (!items || items.length === 0) {
        this.state.hasMoreNewer = false;
        return;
      }

      this.renderItemsAtTop(items);
      this.state.newerPage++;

      // Restore scroll position
      requestAnimationFrame(() => {
        const scrollAfter = this.container.scrollHeight - scrollBefore;
        this.container.scrollTop = scrollAfter;
      });
    } catch (error) {
      console.error('Error loading newer items:', error);
    } finally {
      this.state.isLoadingNewer = false;
      this.topLoader.style.display = 'none';
    }
  }

  renderItemsAtBottom(items) {
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const div = document.createElement('div');
      div.innerHTML = this.renderItem(item);
      fragment.appendChild(div.firstElementChild);
    });
    this.container.insertBefore(fragment, this.bottomSentinel);
  }

  renderItemsAtTop(items) {
    const fragment = document.createDocumentFragment();
    items.reverse().forEach((item) => {
      const div = document.createElement('div');
      div.innerHTML = this.renderItem(item);
      fragment.appendChild(div.firstElementChild);
    });
    this.container.insertBefore(fragment, this.topSentinel.nextSibling);
  }

  destroy() {
    this.topObserver.disconnect();
    this.bottomObserver.disconnect();
  }
}

// Usage: Chat/messaging app
const scroll = new BiDirectionalScroll({
  container: '#messages',
  fetchOlder: async (page) => {
    // Load older messages
    const res = await fetch(`/api/messages?page=${page}&direction=older`);
    return res.json();
  },
  fetchNewer: async (page) => {
    // Load newer messages
    const res = await fetch(`/api/messages?page=${page}&direction=newer`);
    return res.json();
  },
  renderItem: (msg) => `
    <div class="message">
      <strong>${msg.user}</strong>: ${msg.text}
    </div>
  `,
});
```

## Solution 4: Scroll Event (Legacy Approach)

```javascript
// Less efficient than Intersection Observer, but works in older browsers
class InfiniteScrollLegacy {
  constructor(options) {
    this.container = document.querySelector(options.container);
    this.fetchData = options.fetchData;
    this.renderItem = options.renderItem;
    this.threshold = options.threshold || 200;

    this.state = {
      page: 1,
      isLoading: false,
      hasMore: true,
    };

    this.handleScroll = this.handleScroll.bind(this);
    this.init();
  }

  init() {
    window.addEventListener('scroll', this.throttle(this.handleScroll, 200));
    this.loadMore();
  }

  handleScroll() {
    if (this.state.isLoading || !this.state.hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - this.threshold) {
      this.loadMore();
    }
  }

  throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  async loadMore() {
    this.state.isLoading = true;

    try {
      const data = await this.fetchData(this.state.page);

      if (!data || data.length === 0) {
        this.state.hasMore = false;
        return;
      }

      data.forEach((item) => {
        const div = document.createElement('div');
        div.innerHTML = this.renderItem(item);
        this.container.appendChild(div.firstElementChild);
      });

      this.state.page++;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
  }
}
```

## CSS Styles

```css
.infinite-scroll-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.infinite-scroll-loader,
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.infinite-scroll-end,
.end-message {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-style: italic;
}

.infinite-scroll-error,
.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
  color: #c33;
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #c33;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## Test Cases

```javascript
describe('InfiniteScroll', () => {
  test('loads initial data', async () => {
    const fetchData = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);

    render(<InfiniteScroll fetchData={fetchData} />);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(1);
    });
  });

  test('loads more when scrolling to bottom', async () => {
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);

    const { container } = render(<InfiniteScroll fetchData={fetchData} />);

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1));

    // Simulate scroll to bottom
    const sentinel = container.querySelector('[data-testid="sentinel"]');
    fireEvent(sentinel, new Event('intersect'));

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2));
  });

  test('stops loading when no more data', async () => {
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([]);

    const { getByText } = render(<InfiniteScroll fetchData={fetchData} />);

    await waitFor(() => {
      expect(getByText('No more items to load')).toBeInTheDocument();
    });
  });

  test('handles errors gracefully', async () => {
    const fetchData = jest.fn().mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<InfiniteScroll fetchData={fetchData} />);

    await waitFor(() => {
      expect(getByText(/Error/i)).toBeInTheDocument();
    });
  });
});
```

## Time & Space Complexity

**Intersection Observer Approach:**
- **Loading new items:** O(n) where n = items per page
- **Observer callback:** O(1) - constant time
- **Memory:** O(total items loaded) - grows linearly with scroll
- **Note:** For thousands of items, consider virtual scrolling to maintain O(viewport items) memory

**Scroll Event Approach:**
- **Scroll handler:** O(1) per call, but fires 100+ times/second
- **With throttling:** O(1) per throttled interval
- **Memory:** Same as Intersection Observer

## Common Mistakes

❌ **Mistake 1:** Not preventing duplicate requests
```javascript
// Can trigger multiple simultaneous requests
if (entries[0].isIntersecting) {
  loadMore();  // No check for isLoading
}
```

✅ **Correct:** Check loading state
```javascript
if (entries[0].isIntersecting && !isLoading && hasMore) {
  loadMore();
}
```

❌ **Mistake 2:** Using scroll events without throttling
```javascript
window.addEventListener('scroll', handleScroll);  // Fires too often
```

✅ **Correct:** Throttle or use Intersection Observer
```javascript
// Better: Intersection Observer (modern, performant)
const observer = new IntersectionObserver(callback, {
  rootMargin: '200px', // Load before reaching end
  threshold: 0.8
});

// Or throttle scroll events (legacy)
window.addEventListener('scroll', throttle(handleScroll, 200));
```

❌ **Mistake 3:** Poor UX - Loading too early or too late
```javascript
// Loads when already at bottom - janky UX
rootMargin: '0px'
```

✅ **Correct:** Load before user reaches end
```javascript
// Load 200px before bottom - smooth UX
rootMargin: '200px'
```

❌ **Mistake 4:** Not handling errors
```javascript
async loadMore() {
  const data = await this.fetchData(this.state.page);
  this.renderItems(data);  // No try/catch
}
```

✅ **Correct:** Error handling with retry option
```javascript
async loadMore() {
  try {
    const data = await this.fetchData(this.state.page);
    this.renderItems(data);
  } catch (error) {
    console.error('Failed to load:', error);
    this.showError(error);
    // Show retry button
  }
}
```

❌ **Mistake 5:** Images without lazy loading
```javascript
<img src="${item.image}" alt="${item.title}">
```

✅ **Correct:** Native lazy loading
```javascript
<img src="${item.image}" alt="${item.title}" loading="lazy">
```

## Accessibility Considerations

**1. ARIA Live Regions**
```html
<!-- Announce loading state to screen readers -->
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading ? 'Loading more items...' : ''}
</div>

<div role="status" aria-live="polite" aria-atomic="true">
  {!hasMore ? 'All items loaded' : ''}
</div>
```

**2. Focus Management**
```javascript
// Maintain focus when new items load
const lastFocusedIndex = getFocusedItemIndex();
loadMore().then(() => {
  if (lastFocusedIndex >= 0) {
    focusItemAtIndex(lastFocusedIndex);
  }
});
```

**3. Keyboard Navigation**
```javascript
// Allow keyboard users to skip to "Load More" button
<button
  onClick={loadMore}
  aria-label="Load more items"
  tabIndex={0}
>
  Load More
</button>
```

**4. Provide Manual Load Option**
```javascript
// Alternative to auto-loading - better for screen reader users
<button
  className="load-more-btn"
  onClick={loadMore}
  disabled={isLoading || !hasMore}
  aria-busy={isLoading}
>
  {isLoading ? 'Loading...' : hasMore ? 'Load More' : 'All loaded'}
</button>
```

**5. Semantic HTML**
```html
<main>
  <h1>Feed</h1>
  <section aria-label="Items list">
    <article>Item 1</article>
    <article>Item 2</article>
  </section>

  <!-- Loading indicator -->
  <div role="status" aria-label="Loading more items">
    <div class="spinner"></div>
  </div>
</main>
```

**6. Prefers Reduced Motion**
```css
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }

  .autocomplete-item {
    transition: none;
  }
}
```

## Performance Optimizations

**1. Use `loading="lazy"` on images**
```javascript
<img src="${post.image}" alt="${post.title}" loading="lazy">
```

**2. Implement virtual scrolling for 1000+ items**
- Only render visible items + buffer
- Reuse DOM elements
- Libraries: `react-window`, `react-virtualized`

**3. Optimize `rootMargin` and `threshold`**
```javascript
// Load 200px before end - smooth UX
{
  rootMargin: '200px',
  threshold: 0.8
}
```

**4. Use `requestIdleCallback` for non-critical rendering**
```javascript
requestIdleCallback(() => {
  this.renderLowPriorityItems();
});
```

**5. Batch DOM updates with `DocumentFragment`**
```javascript
const fragment = document.createDocumentFragment();
items.forEach(item => fragment.appendChild(createItem(item)));
container.appendChild(fragment); // Single reflow
```

**6. Consider bi-directional infinite scroll for feeds**
- Load older items at bottom
- Load newer items at top
- Maintain scroll position

## Real-World Applications

1. **Social media feeds** - Twitter, Instagram, Facebook, TikTok
2. **Image galleries** - Pinterest, Unsplash, Google Images
3. **E-commerce listings** - Amazon product pages, eBay search results
4. **Article feeds** - Medium, Reddit, LinkedIn feed
5. **Video platforms** - YouTube search, Netflix browse

## Follow-up Questions

**Basic:**
- "What's the difference between scroll events and Intersection Observer?"
- "Why do we need debouncing/throttling for scroll events?"
- "How do you prevent duplicate API requests?"

**Intermediate:**
- "How do you handle pagination with URL parameters?"
- "How do you preserve scroll position on navigation back/forward?"
- "What happens if items have dynamic heights?"
- "How would you implement a 'back to top' button?"

**Advanced:**
- "How would you implement bidirectional infinite scroll (load top + bottom)?"
- "How do you combine infinite scroll with virtual scrolling for 10,000+ items?"
- "How do you handle real-time updates (new items) in an infinite scroll feed?"
- "What are the accessibility concerns and how do you address them?"
- "How would you implement infinite scroll with server-side rendering (SSR)?"

## Resources

- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Web.dev: Infinite Scroll](https://web.dev/patterns/web-vitals-patterns/infinite-scroll/)
- [React Infinite Scroll Patterns](https://www.patterns.dev/posts/inifinite-scroll)

---

[← Back to DOM Manipulation Problems](../README.md)
