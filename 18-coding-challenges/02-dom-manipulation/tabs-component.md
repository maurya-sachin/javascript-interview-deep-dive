# Tabs Component

## Problem Statement

Implement a fully accessible tabs component with keyboard navigation, dynamic content loading, URL routing, and proper ARIA attributes for screen reader support.

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time to Solve:** 30-45 minutes
**Companies:** Google, Microsoft, Amazon, Atlassian, Dropbox, Adobe

## Requirements

- [ ] Display multiple tabs with associated content panels
- [ ] Only one tab active at a time
- [ ] Switch tabs on click
- [ ] Keyboard navigation (←→ arrows, Home, End)
- [ ] Focus management
- [ ] Accessible (ARIA roles, labels, states)
- [ ] Support dynamic tab addition/removal
- [ ] Lazy loading of tab content
- [ ] URL routing (optional hash-based)
- [ ] Animation transitions
- [ ] Support vertical orientation
- [ ] Mobile-responsive (scrollable tabs)

## Example Usage

```html
<div id="tabs-container"></div>

<script>
const tabs = new Tabs({
  container: '#tabs-container',
  tabs: [
    {
      id: 'overview',
      label: 'Overview',
      content: '<h2>Overview Content</h2><p>Details here...</p>',
    },
    {
      id: 'features',
      label: 'Features',
      content: '<h2>Features</h2><ul><li>Feature 1</li></ul>',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      content: () => fetchPricingContent(), // Lazy load
    },
  ],
  defaultTab: 'overview',
  orientation: 'horizontal', // or 'vertical'
  urlRouting: true,
  onTabChange: (tabId) => {
    console.log('Active tab:', tabId);
  },
});
</script>
```

## Solution 1: Vanilla JavaScript Implementation

```javascript
class Tabs {
  constructor(options) {
    this.options = {
      container: options.container,
      tabs: options.tabs || [],
      defaultTab: options.defaultTab || (options.tabs[0]?.id || null),
      orientation: options.orientation || 'horizontal',
      urlRouting: options.urlRouting !== false,
      lazyLoad: options.lazyLoad !== false,
      animationDuration: options.animationDuration || 300,
      onTabChange: options.onTabChange || (() => {}),
    };

    this.state = {
      activeTabId: null,
      loadedTabs: new Set(),
    };

    this.init();
  }

  init() {
    const container =
      typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container;

    this.container = container;

    // Check URL hash for initial tab
    if (this.options.urlRouting) {
      const hash = window.location.hash.slice(1);
      const hashTab = this.options.tabs.find((tab) => tab.id === hash);
      if (hashTab) {
        this.options.defaultTab = hash;
      }
    }

    this.state.activeTabId = this.options.defaultTab;
    this.render();
    this.attachEventListeners();
    this.loadTabContent(this.state.activeTabId);
  }

  render() {
    const { tabs, orientation } = this.options;
    const { activeTabId } = this.state;

    this.container.innerHTML = `
      <div class="tabs tabs--${orientation}">
        <div
          class="tabs-list"
          role="tablist"
          aria-label="Content tabs"
          aria-orientation="${orientation}"
        >
          ${tabs
            .map(
              (tab) => `
            <button
              id="tab-${tab.id}"
              class="tab ${tab.id === activeTabId ? 'active' : ''}"
              role="tab"
              aria-selected="${tab.id === activeTabId}"
              aria-controls="panel-${tab.id}"
              tabindex="${tab.id === activeTabId ? '0' : '-1'}"
              data-tab-id="${tab.id}"
            >
              ${tab.label}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="tabs-panels">
          ${tabs
            .map(
              (tab) => `
            <div
              id="panel-${tab.id}"
              class="tab-panel ${tab.id === activeTabId ? 'active' : ''}"
              role="tabpanel"
              aria-labelledby="tab-${tab.id}"
              tabindex="0"
              ${tab.id !== activeTabId ? 'hidden' : ''}
            >
              <div class="tab-panel-content" data-panel-id="${tab.id}">
                ${tab.id === activeTabId ? this.getTabContent(tab) : ''}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    // Store references
    this.tabList = this.container.querySelector('.tabs-list');
    this.tabButtons = this.container.querySelectorAll('.tab');
    this.panels = this.container.querySelectorAll('.tab-panel');
  }

  getTabContent(tab) {
    if (typeof tab.content === 'function') {
      return '<div class="loading">Loading...</div>';
    }
    return tab.content;
  }

  attachEventListeners() {
    // Tab click
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tabId;
        this.activateTab(tabId);
      });
    });

    // Keyboard navigation
    this.tabList.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // URL hash change
    if (this.options.urlRouting) {
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash && this.options.tabs.find((tab) => tab.id === hash)) {
          this.activateTab(hash, false); // Don't update URL again
        }
      });
    }
  }

  handleKeyDown(e) {
    const currentIndex = Array.from(this.tabButtons).findIndex(
      (btn) => btn.dataset.tabId === this.state.activeTabId
    );

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabButtons.length - 1;
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < this.tabButtons.length - 1 ? currentIndex + 1 : 0;
        break;

      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        newIndex = this.tabButtons.length - 1;
        break;

      default:
        return;
    }

    const newTabId = this.tabButtons[newIndex].dataset.tabId;
    this.activateTab(newTabId);
    this.tabButtons[newIndex].focus();
  }

  async activateTab(tabId, updateUrl = true) {
    if (tabId === this.state.activeTabId) return;

    const tab = this.options.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Deactivate current tab
    const currentButton = this.container.querySelector(
      `[data-tab-id="${this.state.activeTabId}"]`
    );
    const currentPanel = this.container.querySelector(
      `#panel-${this.state.activeTabId}`
    );

    if (currentButton) {
      currentButton.classList.remove('active');
      currentButton.setAttribute('aria-selected', 'false');
      currentButton.setAttribute('tabindex', '-1');
    }

    if (currentPanel) {
      currentPanel.classList.remove('active');
      currentPanel.setAttribute('hidden', '');
    }

    // Activate new tab
    const newButton = this.container.querySelector(`[data-tab-id="${tabId}"]`);
    const newPanel = this.container.querySelector(`#panel-${tabId}`);

    if (newButton) {
      newButton.classList.add('active');
      newButton.setAttribute('aria-selected', 'true');
      newButton.setAttribute('tabindex', '0');
    }

    if (newPanel) {
      newPanel.classList.add('active');
      newPanel.removeAttribute('hidden');
    }

    // Update state
    this.state.activeTabId = tabId;

    // Load content if needed
    await this.loadTabContent(tabId);

    // Update URL
    if (this.options.urlRouting && updateUrl) {
      window.location.hash = tabId;
    }

    // Callback
    this.options.onTabChange(tabId);
  }

  async loadTabContent(tabId) {
    if (this.state.loadedTabs.has(tabId)) return;

    const tab = this.options.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Check if content is a function (lazy load)
    if (typeof tab.content === 'function') {
      const panelContent = this.container.querySelector(
        `[data-panel-id="${tabId}"]`
      );

      try {
        const content = await tab.content();
        panelContent.innerHTML = content;
        this.state.loadedTabs.add(tabId);
      } catch (error) {
        console.error('Error loading tab content:', error);
        panelContent.innerHTML =
          '<div class="error">Failed to load content</div>';
      }
    } else {
      this.state.loadedTabs.add(tabId);
    }
  }

  addTab(tab) {
    this.options.tabs.push(tab);
    this.render();
    this.attachEventListeners();
  }

  removeTab(tabId) {
    const index = this.options.tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    this.options.tabs.splice(index, 1);

    // If removing active tab, activate another
    if (this.state.activeTabId === tabId) {
      const newActiveTab = this.options.tabs[0];
      if (newActiveTab) {
        this.state.activeTabId = newActiveTab.id;
      }
    }

    this.render();
    this.attachEventListeners();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
```

### CSS Styles

```css
.tabs {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Horizontal tabs (default) */
.tabs--horizontal .tabs-list {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tabs--horizontal .tab {
  flex: 0 0 auto;
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tabs--horizontal .tab:hover {
  color: #333;
  background: #f5f5f5;
}

.tabs--horizontal .tab:focus {
  outline: 2px solid #4A90E2;
  outline-offset: -2px;
}

.tabs--horizontal .tab.active {
  color: #4A90E2;
  border-bottom-color: #4A90E2;
  background: #fff;
}

/* Vertical tabs */
.tabs--vertical {
  display: flex;
}

.tabs--vertical .tabs-list {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #e0e0e0;
}

.tabs--vertical .tab {
  padding: 12px 16px;
  background: none;
  border: none;
  border-right: 3px solid transparent;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.tabs--vertical .tab:hover {
  color: #333;
  background: #f5f5f5;
}

.tabs--vertical .tab:focus {
  outline: 2px solid #4A90E2;
  outline-offset: -2px;
}

.tabs--vertical .tab.active {
  color: #4A90E2;
  border-right-color: #4A90E2;
  background: #fff;
}

.tabs--vertical .tabs-panels {
  flex: 1;
  padding-left: 24px;
}

/* Tab panels */
.tabs-panels {
  position: relative;
  padding: 24px 0;
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
  animation: fadeIn 0.3s ease-in-out;
}

.tab-panel:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-panel-content {
  min-height: 200px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
  font-size: 16px;
}

.loading::before {
  content: '';
  width: 20px;
  height: 20px;
  margin-right: 12px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4A90E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  padding: 16px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .tabs--horizontal .tabs-list {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }

  .tabs--horizontal .tab {
    padding: 12px 16px;
    font-size: 14px;
  }

  .tabs--vertical {
    flex-direction: column;
  }

  .tabs--vertical .tabs-list {
    flex: none;
    flex-direction: row;
    border-right: none;
    border-bottom: 2px solid #e0e0e0;
    overflow-x: auto;
  }

  .tabs--vertical .tab {
    border-right: none;
    border-bottom: 3px solid transparent;
  }

  .tabs--vertical .tab.active {
    border-right-color: transparent;
    border-bottom-color: #4A90E2;
  }

  .tabs--vertical .tabs-panels {
    padding-left: 0;
    padding-top: 16px;
  }
}
```

## Solution 2: React Implementation

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';

function Tabs({
  tabs = [],
  defaultTab,
  orientation = 'horizontal',
  urlRouting = false,
  lazyLoad = true,
  onTabChange,
}) {
  const [activeTabId, setActiveTabId] = useState(
    defaultTab || tabs[0]?.id || null
  );
  const [loadedTabs, setLoadedTabs] = useState(new Set([activeTabId]));
  const tabRefs = useRef([]);

  // Initialize from URL hash
  useEffect(() => {
    if (urlRouting) {
      const hash = window.location.hash.slice(1);
      const hashTab = tabs.find((tab) => tab.id === hash);
      if (hashTab) {
        setActiveTabId(hash);
      }
    }
  }, [urlRouting, tabs]);

  // Handle URL hash changes
  useEffect(() => {
    if (!urlRouting) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && tabs.find((tab) => tab.id === hash)) {
        setActiveTabId(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [urlRouting, tabs]);

  // Load tab content on activation
  useEffect(() => {
    if (lazyLoad && activeTabId && !loadedTabs.has(activeTabId)) {
      const tab = tabs.find((t) => t.id === activeTabId);
      if (tab && typeof tab.content === 'function') {
        setLoadedTabs((prev) => new Set([...prev, activeTabId]));
      }
    }
  }, [activeTabId, lazyLoad, loadedTabs, tabs]);

  // Notify parent of tab change
  useEffect(() => {
    onTabChange?.(activeTabId);
  }, [activeTabId, onTabChange]);

  const activateTab = useCallback(
    (tabId) => {
      if (tabId === activeTabId) return;

      setActiveTabId(tabId);

      if (urlRouting) {
        window.location.hash = tabId;
      }
    },
    [activeTabId, urlRouting]
  );

  const handleKeyDown = (e, currentIndex) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;

      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;

      default:
        return;
    }

    activateTab(tabs[newIndex].id);
    tabRefs.current[newIndex]?.focus();
  };

  return (
    <div className={`tabs tabs--${orientation}`}>
      <div
        className="tabs-list"
        role="tablist"
        aria-label="Content tabs"
        aria-orientation={orientation}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            ref={(el) => (tabRefs.current[index] = el)}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            role="tab"
            aria-selected={tab.id === activeTabId}
            aria-controls={`panel-${tab.id}`}
            tabIndex={tab.id === activeTabId ? 0 : -1}
            onClick={() => activateTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tabs-panels">
        {tabs.map((tab) => (
          <TabPanel
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            isLoaded={loadedTabs.has(tab.id)}
            lazyLoad={lazyLoad}
          />
        ))}
      </div>
    </div>
  );
}

function TabPanel({ tab, isActive, isLoaded, lazyLoad }) {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isActive || !lazyLoad) return;
    if (typeof tab.content !== 'function') return;
    if (isLoaded && content) return;

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const result = await tab.content();
        setContent(result);
        setError(null);
      } catch (err) {
        console.error('Error loading tab content:', err);
        setError('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [isActive, tab, isLoaded, lazyLoad, content]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading">Loading...</div>;
    }

    if (error) {
      return <div className="error">{error}</div>;
    }

    if (typeof tab.content === 'function') {
      return content || '';
    }

    return <div dangerouslySetInnerHTML={{ __html: tab.content }} />;
  };

  return (
    <div
      id={`panel-${tab.id}`}
      className={`tab-panel ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      tabIndex={0}
      hidden={!isActive}
    >
      <div className="tab-panel-content">{renderContent()}</div>
    </div>
  );
}

export default Tabs;
```

### React Usage Example

```jsx
function App() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: '<h2>Overview</h2><p>Product overview content...</p>',
    },
    {
      id: 'features',
      label: 'Features',
      content: '<h2>Features</h2><ul><li>Feature 1</li><li>Feature 2</li></ul>',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      content: async () => {
        const response = await fetch('/api/pricing');
        const data = await response.json();
        return `<h2>Pricing</h2><pre>${JSON.stringify(data, null, 2)}</pre>`;
      },
    },
  ];

  return (
    <Tabs
      tabs={tabs}
      defaultTab="overview"
      orientation="horizontal"
      urlRouting={true}
      onTabChange={(tabId) => console.log('Active:', tabId)}
    />
  );
}
```

## Test Cases

```javascript
describe('Tabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
  ];

  test('renders all tabs', () => {
    const { getAllByRole } = render(<Tabs tabs={tabs} />);
    const tabButtons = getAllByRole('tab');
    expect(tabButtons).toHaveLength(3);
  });

  test('activates first tab by default', () => {
    const { getByRole } = render(<Tabs tabs={tabs} />);
    const firstTab = getByRole('tab', { name: 'Tab 1' });
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  test('switches tab on click', () => {
    const { getByRole } = render(<Tabs tabs={tabs} />);

    const tab2 = getByRole('tab', { name: 'Tab 2' });
    fireEvent.click(tab2);

    expect(tab2).toHaveAttribute('aria-selected', 'true');
    expect(getByRole('tabpanel', { hidden: false })).toHaveTextContent(
      'Content 2'
    );
  });

  test('navigates with arrow keys', () => {
    const { getAllByRole } = render(<Tabs tabs={tabs} />);

    const tabButtons = getAllByRole('tab');
    tabButtons[0].focus();

    fireEvent.keyDown(tabButtons[0], { key: 'ArrowRight' });
    expect(tabButtons[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tabButtons[1], { key: 'ArrowLeft' });
    expect(tabButtons[0]).toHaveAttribute('aria-selected', 'true');
  });

  test('navigates to first tab with Home key', () => {
    const { getAllByRole } = render(<Tabs tabs={tabs} defaultTab="tab2" />);

    const tabButtons = getAllByRole('tab');
    fireEvent.keyDown(tabButtons[1], { key: 'Home' });

    expect(tabButtons[0]).toHaveAttribute('aria-selected', 'true');
  });

  test('navigates to last tab with End key', () => {
    const { getAllByRole } = render(<Tabs tabs={tabs} />);

    const tabButtons = getAllByRole('tab');
    fireEvent.keyDown(tabButtons[0], { key: 'End' });

    expect(tabButtons[2]).toHaveAttribute('aria-selected', 'true');
  });

  test('lazy loads content', async () => {
    const lazyContent = jest
      .fn()
      .mockResolvedValue('<p>Lazy loaded content</p>');

    const lazyTabs = [
      ...tabs,
      { id: 'lazy', label: 'Lazy Tab', content: lazyContent },
    ];

    const { getByRole, findByText } = render(<Tabs tabs={lazyTabs} />);

    expect(lazyContent).not.toHaveBeenCalled();

    const lazyTab = getByRole('tab', { name: 'Lazy Tab' });
    fireEvent.click(lazyTab);

    await findByText('Lazy loaded content');
    expect(lazyContent).toHaveBeenCalledTimes(1);
  });

  test('calls onTabChange callback', () => {
    const onTabChange = jest.fn();

    const { getByRole } = render(
      <Tabs tabs={tabs} onTabChange={onTabChange} />
    );

    const tab2 = getByRole('tab', { name: 'Tab 2' });
    fireEvent.click(tab2);

    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });

  test('updates URL hash when urlRouting enabled', () => {
    const { getByRole } = render(<Tabs tabs={tabs} urlRouting={true} />);

    const tab2 = getByRole('tab', { name: 'Tab 2' });
    fireEvent.click(tab2);

    expect(window.location.hash).toBe('#tab2');
  });
});
```

## Common Mistakes

❌ **Mistake:** Not managing focus correctly
```javascript
// Leaves focus on clicked tab even when using keyboard
onClick={() => setActiveTab(id)}
```

✅ **Correct:** Proper focus management
```javascript
const handleKeyNav = (newIndex) => {
  setActiveTab(tabs[newIndex].id);
  tabRefs.current[newIndex]?.focus();
};
```

❌ **Mistake:** Missing ARIA attributes
```html
<!-- Inaccessible tabs -->
<div class="tab">Tab 1</div>
<div class="panel">Content 1</div>
```

✅ **Correct:** Complete ARIA implementation
```html
<button
  role="tab"
  aria-selected="true"
  aria-controls="panel-1"
  id="tab-1"
>
  Tab 1
</button>
<div role="tabpanel" aria-labelledby="tab-1" id="panel-1">
  Content 1
</div>
```

❌ **Mistake:** Loading all content upfront
```javascript
// Loads all panels immediately
{tabs.map(tab => <div>{tab.content()}</div>)}
```

✅ **Correct:** Lazy load on activation
```javascript
useEffect(() => {
  if (isActive && !isLoaded) {
    loadContent();
  }
}, [isActive]);
```

## Real-World Applications

1. **Documentation sites** - React Docs, MDN, API references
2. **Dashboards** - Analytics, admin panels
3. **Product pages** - E-commerce (description, reviews, specs)
4. **Settings panels** - User preferences, account settings
5. **Multi-step forms** - Checkout, onboarding flows

## Follow-up Questions

- "How would you implement vertical tabs?"
- "How do you handle dynamically adding/removing tabs?"
- "What accessibility improvements are needed?"
- "How would you add animation between tab transitions?"
- "How do you handle nested tabs?"
- "How would you implement tab scrolling for overflow?"

## Resources

- [WAI-ARIA Authoring Practices: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/)
- [Inclusive Components: Tabbed Interfaces](https://inclusive-components.design/tabbed-interfaces/)
- [ARIA Tabs Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/tabs/tabs-1/tabs.html)

---

[← Back to DOM Manipulation Problems](../README.md)
