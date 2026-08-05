# Typeahead Search Component

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Companies:** Google, Meta, Amazon, Airbnb, Uber, Netflix, Twitter
**Time:** 45-60 minutes

---

## Problem Statement

Build a typeahead/autocomplete search component with debouncing, keyboard navigation, and accessibility features. The component should provide real-time suggestions as users type, similar to Google Search or Amazon product search.

### Requirements

- ✅ Display suggestions as user types
- ✅ Debounce API calls (300ms default)
- ✅ Keyboard navigation (↑↓ arrows, Enter, Escape, Tab)
- ✅ Highlight matching text in suggestions
- ✅ Handle loading and error states
- ✅ Click outside to close dropdown
- ✅ Accessible (ARIA attributes, screen reader support)
- ✅ Cancel previous requests on new input
- ✅ Handle empty results gracefully
- ✅ Support custom rendering
- ✅ Mobile-friendly (touch events)

---

## Example Usage

```html
<div id="search-container"></div>

<script>
const typeahead = new Typeahead({
  container: '#search-container',
  placeholder: 'Search for movies...',
  fetchSuggestions: async (query) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  },
  onSelect: (item) => {
    console.log('Selected:', item);
    window.location.href = `/movie/${item.id}`;
  },
  renderItem: (item, query) => {
    return `
      <div class="movie-result">
        <img src="${item.poster}" alt="${item.title}">
        <div>
          <strong>${highlightMatch(item.title, query)}</strong>
          <span>${item.year}</span>
        </div>
      </div>
    `;
  },
  minChars: 2,
  debounceTime: 300,
});
</script>
```

---

## Solution 1: Complete Vanilla JavaScript Implementation

```javascript
class Typeahead {
  constructor(options) {
    // Configuration
    this.options = {
      container: options.container,
      placeholder: options.placeholder || 'Search...',
      fetchSuggestions: options.fetchSuggestions,
      onSelect: options.onSelect || (() => {}),
      renderItem: options.renderItem || ((item) => String(item)),
      debounceTime: options.debounceTime || 300,
      minChars: options.minChars || 2,
      maxResults: options.maxResults || 10,
      cache: options.cache !== false, // Default true
      highlightMatch: options.highlightMatch !== false, // Default true
    };

    // State
    this.state = {
      suggestions: [],
      selectedIndex: -1,
      isLoading: false,
      query: '',
      isOpen: false,
      error: null,
    };

    // Internal references
    this.abortController = null;
    this.debounceTimer = null;
    this.cache = new Map();

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

    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="typeahead" role="search">
        <div class="typeahead-input-wrapper">
          <input
            type="text"
            class="typeahead-input"
            placeholder="${this.options.placeholder}"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="${this.state.isOpen}"
            aria-controls="typeahead-listbox"
            aria-owns="typeahead-listbox"
            aria-activedescendant="${
              this.state.selectedIndex >= 0
                ? `typeahead-item-${this.state.selectedIndex}`
                : ''
            }"
          />
          <div class="typeahead-icons">
            ${this.renderStatusIcon()}
          </div>
        </div>
        <ul
          id="typeahead-listbox"
          class="typeahead-dropdown ${this.state.isOpen ? 'open' : ''}"
          role="listbox"
          aria-label="Search suggestions"
        >
          ${this.renderDropdown()}
        </ul>
      </div>
    `;

    // Cache DOM references
    this.input = this.container.querySelector('.typeahead-input');
    this.dropdown = this.container.querySelector('.typeahead-dropdown');
    this.iconsContainer = this.container.querySelector('.typeahead-icons');
  }

  renderStatusIcon() {
    if (this.state.isLoading) {
      return `
        <div class="typeahead-spinner" aria-label="Loading" role="status">
          <div class="spinner"></div>
        </div>
      `;
    }
    if (this.state.error) {
      return `
        <div class="typeahead-error-icon" aria-label="Error" role="alert">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
      `;
    }
    if (this.state.query.length > 0) {
      return `
        <button class="typeahead-clear" aria-label="Clear search" type="button">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      `;
    }
    return `
      <div class="typeahead-search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>
    `;
  }

  renderDropdown() {
    if (this.state.isLoading) {
      return `
        <li class="typeahead-loading" role="status">
          <div class="loading-content">
            <div class="spinner small"></div>
            <span>Searching...</span>
          </div>
        </li>
      `;
    }

    if (this.state.error) {
      return `
        <li class="typeahead-error" role="alert">
          <div class="error-content">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>${this.state.error}</span>
          </div>
        </li>
      `;
    }

    if (this.state.query && this.state.suggestions.length === 0) {
      return `
        <li class="typeahead-empty" role="status">
          <div class="empty-content">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span>No results for "${this.state.query}"</span>
          </div>
        </li>
      `;
    }

    return this.state.suggestions
      .map((item, index) => {
        const isSelected = index === this.state.selectedIndex;
        const content = this.options.renderItem(item, this.state.query);

        return `
          <li
            id="typeahead-item-${index}"
            class="typeahead-item ${isSelected ? 'selected' : ''}"
            role="option"
            aria-selected="${isSelected}"
            data-index="${index}"
          >
            ${content}
          </li>
        `;
      })
      .join('');
  }

  attachEventListeners() {
    // Input events
    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.input.addEventListener('focus', this.handleFocus.bind(this));
    this.input.addEventListener('blur', this.handleBlur.bind(this));

    // Dropdown events
    this.dropdown.addEventListener('click', this.handleDropdownClick.bind(this));
    this.dropdown.addEventListener('mousedown', this.handleDropdownMouseDown.bind(this));

    // Document events
    document.addEventListener('click', this.handleClickOutside.bind(this));

    // Window events
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  handleInput(e) {
    const query = e.target.value.trim();
    this.state.query = query;
    this.state.error = null;

    // Update UI immediately for clear button
    this.updateStatusIcon();

    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Close if below minimum characters
    if (query.length < this.options.minChars) {
      this.close();
      return;
    }

    // Check cache first
    if (this.options.cache && this.cache.has(query)) {
      this.state.suggestions = this.cache.get(query);
      this.state.selectedIndex = -1;
      this.state.isOpen = true;
      this.updateDropdown();
      return;
    }

    // Debounced fetch
    this.state.isLoading = true;
    this.updateStatusIcon();

    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(query);
    }, this.options.debounceTime);
  }

  async fetchSuggestions(query) {
    try {
      // Create new AbortController
      this.abortController = new AbortController();

      const results = await this.options.fetchSuggestions(query, {
        signal: this.abortController.signal,
      });

      // Validate results
      if (!Array.isArray(results)) {
        throw new Error('fetchSuggestions must return an array');
      }

      // Limit results
      const suggestions = results.slice(0, this.options.maxResults);

      // Cache results
      if (this.options.cache) {
        this.cache.set(query, suggestions);
      }

      this.state.suggestions = suggestions;
      this.state.selectedIndex = -1;
      this.state.isLoading = false;
      this.state.isOpen = true;
      this.state.error = null;

      this.updateDropdown();
      this.updateStatusIcon();
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      console.error('Error fetching suggestions:', error);

      this.state.isLoading = false;
      this.state.suggestions = [];
      this.state.error = 'Failed to load suggestions';

      this.updateDropdown();
      this.updateStatusIcon();
    }
  }

  handleKeyDown(e) {
    if (!this.state.isOpen && e.key !== 'Enter') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveSelection(1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.moveSelection(-1);
        break;

      case 'Enter':
        e.preventDefault();
        if (this.state.isOpen && this.state.selectedIndex >= 0) {
          this.selectItem(this.state.suggestions[this.state.selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        this.input.blur();
        break;

      case 'Tab':
        // Allow tab but close dropdown
        if (this.state.isOpen) {
          this.close();
        }
        break;
    }
  }

  moveSelection(direction) {
    const maxIndex = this.state.suggestions.length - 1;

    if (direction > 0) {
      // Move down
      this.state.selectedIndex = Math.min(
        this.state.selectedIndex + 1,
        maxIndex
      );
    } else {
      // Move up
      this.state.selectedIndex = Math.max(
        this.state.selectedIndex - 1,
        -1
      );
    }

    this.updateDropdown();
    this.scrollToSelected();
    this.updateAriaAttributes();
  }

  handleFocus() {
    if (
      this.state.query.length >= this.options.minChars &&
      this.state.suggestions.length > 0
    ) {
      this.state.isOpen = true;
      this.updateDropdown();
    }
  }

  handleBlur() {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      if (!this.container.contains(document.activeElement)) {
        this.close();
      }
    }, 200);
  }

  handleDropdownClick(e) {
    const item = e.target.closest('.typeahead-item');
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);
    const suggestion = this.state.suggestions[index];
    this.selectItem(suggestion);
  }

  handleDropdownMouseDown(e) {
    // Prevent input blur when clicking dropdown
    e.preventDefault();
  }

  handleClickOutside(e) {
    // Check if clicked on clear button
    const clearButton = e.target.closest('.typeahead-clear');
    if (clearButton && this.container.contains(clearButton)) {
      this.clearSearch();
      return;
    }

    if (!this.container.contains(e.target)) {
      this.close();
    }
  }

  handleResize() {
    if (this.state.isOpen) {
      this.positionDropdown();
    }
  }

  selectItem(item) {
    const value = typeof item === 'string' ? item : item.name || item.title || String(item);

    this.input.value = value;
    this.state.query = value;
    this.close();

    // Call onSelect callback
    this.options.onSelect(item);

    // Emit custom event
    this.container.dispatchEvent(
      new CustomEvent('typeahead:select', {
        detail: { item },
        bubbles: true,
      })
    );
  }

  clearSearch() {
    this.input.value = '';
    this.state.query = '';
    this.state.suggestions = [];
    this.state.selectedIndex = -1;
    this.close();
    this.updateStatusIcon();
    this.input.focus();

    // Emit custom event
    this.container.dispatchEvent(
      new CustomEvent('typeahead:clear', {
        bubbles: true,
      })
    );
  }

  close() {
    this.state.isOpen = false;
    this.state.selectedIndex = -1;
    this.updateDropdown();
    this.updateAriaAttributes();
  }

  scrollToSelected() {
    if (this.state.selectedIndex < 0) return;

    const selectedElement = this.dropdown.querySelector(
      `[data-index="${this.state.selectedIndex}"]`
    );

    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }

  updateDropdown() {
    this.dropdown.innerHTML = this.renderDropdown();
    this.dropdown.classList.toggle('open', this.state.isOpen);

    if (this.state.isOpen) {
      this.positionDropdown();
    }
  }

  updateStatusIcon() {
    this.iconsContainer.innerHTML = this.renderStatusIcon();

    // Re-attach clear button listener
    const clearButton = this.iconsContainer.querySelector('.typeahead-clear');
    if (clearButton) {
      clearButton.addEventListener('click', this.clearSearch.bind(this));
    }
  }

  updateAriaAttributes() {
    this.input.setAttribute('aria-expanded', this.state.isOpen);
    this.input.setAttribute(
      'aria-activedescendant',
      this.state.selectedIndex >= 0
        ? `typeahead-item-${this.state.selectedIndex}`
        : ''
    );
  }

  positionDropdown() {
    const inputRect = this.input.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    // Open upward if not enough space below
    if (spaceBelow < 300 && spaceAbove > spaceBelow) {
      this.dropdown.classList.add('dropup');
    } else {
      this.dropdown.classList.remove('dropup');
    }
  }

  // Public API
  getValue() {
    return this.state.query;
  }

  setValue(value) {
    this.input.value = value;
    this.state.query = value;
    this.updateStatusIcon();
  }

  clearCache() {
    this.cache.clear();
  }

  destroy() {
    // Clear timers
    clearTimeout(this.debounceTimer);

    // Abort pending requests
    if (this.abortController) {
      this.abortController.abort();
    }

    // Remove event listeners
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);

    // Clear cache
    this.cache.clear();

    // Remove DOM
    this.container.innerHTML = '';
  }
}

// Utility: Highlight matching text
function highlightMatch(text, query) {
  if (!query || typeof text !== 'string') return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Typeahead, highlightMatch };
}
```

---

## Complete CSS Styles

```css
/* Container */
.typeahead {
  position: relative;
  width: 100%;
  max-width: 600px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Input wrapper */
.typeahead-input-wrapper {
  position: relative;
  width: 100%;
}

/* Input field */
.typeahead-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  background-color: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  transition: all 0.2s ease;
  outline: none;
}

.typeahead-input:focus {
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.typeahead-input::placeholder {
  color: #999;
}

/* Icons container */
.typeahead-icons {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.typeahead-search-icon,
.typeahead-error-icon {
  color: #999;
  display: flex;
  align-items: center;
}

.typeahead-clear {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.typeahead-clear:hover {
  background-color: #f5f5f5;
  color: #333;
}

/* Spinner */
.typeahead-spinner {
  display: flex;
  align-items: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4A90E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.small {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dropdown */
.typeahead-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  list-style: none;
  margin: 0;
  padding: 8px 0;
  display: none;
  z-index: 1000;
}

.typeahead-dropdown.open {
  display: block;
}

.typeahead-dropdown.dropup {
  top: auto;
  bottom: calc(100% + 8px);
}

/* Custom scrollbar */
.typeahead-dropdown::-webkit-scrollbar {
  width: 8px;
}

.typeahead-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.typeahead-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.typeahead-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Dropdown items */
.typeahead-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: #333;
}

.typeahead-item:hover {
  background-color: #f5f5f5;
}

.typeahead-item.selected {
  background-color: #e3f2fd;
}

.typeahead-item mark {
  background-color: #ffeb3b;
  color: #333;
  font-weight: 600;
  padding: 2px 0;
}

/* Loading state */
.typeahead-loading {
  padding: 20px 16px;
  text-align: center;
  color: #666;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* Empty state */
.typeahead-empty {
  padding: 24px 16px;
  text-align: center;
  color: #666;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-content svg {
  color: #bbb;
}

/* Error state */
.typeahead-error {
  padding: 16px;
  text-align: center;
  color: #d32f2f;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .typeahead-input {
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 12px 44px 12px 12px;
  }

  .typeahead-dropdown {
    max-height: 60vh;
  }

  .typeahead-item {
    padding: 14px 12px;
  }
}

/* Focus visible for accessibility */
.typeahead-item:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: -2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .typeahead-input {
    border-width: 3px;
  }

  .typeahead-item.selected {
    outline: 2px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .typeahead-input,
  .typeahead-item,
  .typeahead-clear {
    transition: none;
  }

  .spinner {
    animation: none;
  }

  .typeahead-item {
    scroll-behavior: auto;
  }
}
```

---

## Solution 2: React Implementation

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function Typeahead({
  placeholder = 'Search...',
  fetchSuggestions,
  onSelect,
  renderItem = (item) => String(item),
  debounceTime = 300,
  minChars = 2,
  maxResults = 10,
  cache = true,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Debounced fetch
  useEffect(() => {
    if (query.length < minChars) {
      setIsOpen(false);
      setSuggestions([]);
      setError(null);
      return;
    }

    // Check cache
    if (cache && cacheRef.current.has(query)) {
      setSuggestions(cacheRef.current.get(query));
      setSelectedIndex(-1);
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetchData(query);
    }, debounceTime);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, minChars, debounceTime, cache]);

  const fetchData = async (searchQuery) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const results = await fetchSuggestions(searchQuery, {
        signal: abortControllerRef.current.signal,
      });

      const limitedResults = results.slice(0, maxResults);

      // Cache results
      if (cache) {
        cacheRef.current.set(searchQuery, limitedResults);
      }

      setSuggestions(limitedResults);
      setSelectedIndex(-1);
      setIsOpen(true);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching suggestions:', err);
        setError('Failed to load suggestions');
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen && e.key !== 'Enter') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, suggestions.length - 1)
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (isOpen && selectedIndex >= 0) {
            selectItem(suggestions[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;

        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, selectedIndex, suggestions]
  );

  const selectItem = (item) => {
    const value =
      typeof item === 'string'
        ? item
        : item.name || item.title || String(item);

    setQuery(value);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect?.(item);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    setIsOpen(false);
    setError(null);
    inputRef.current?.focus();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex];
      selectedElement?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="typeahead">
      <div className="typeahead-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= minChars && suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="typeahead-listbox"
          aria-activedescendant={
            selectedIndex >= 0 ? `typeahead-item-${selectedIndex}` : ''
          }
          className="typeahead-input"
        />
        <div className="typeahead-icons">
          {isLoading && (
            <div className="typeahead-spinner">
              <div className="spinner" />
            </div>
          )}
          {!isLoading && query && (
            <button
              className="typeahead-clear"
              onClick={clearSearch}
              aria-label="Clear search"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <ul
          id="typeahead-listbox"
          ref={dropdownRef}
          className="typeahead-dropdown open"
          role="listbox"
        >
          {isLoading ? (
            <li className="typeahead-loading">
              <div className="loading-content">
                <div className="spinner small" />
                <span>Searching...</span>
              </div>
            </li>
          ) : error ? (
            <li className="typeahead-error">
              <div className="error-content">
                <span>{error}</span>
              </div>
            </li>
          ) : suggestions.length === 0 ? (
            <li className="typeahead-empty">
              <div className="empty-content">
                <span>No results for "{query}"</span>
              </div>
            </li>
          ) : (
            suggestions.map((item, index) => (
              <li
                key={index}
                id={`typeahead-item-${index}`}
                className={`typeahead-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {renderItem(item, query)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default Typeahead;
```

---

## Test Cases

```javascript
describe('Typeahead', () => {
  test('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Typeahead
        placeholder="Search movies..."
        fetchSuggestions={jest.fn()}
      />
    );

    expect(getByPlaceholderText('Search movies...')).toBeInTheDocument();
  });

  test('debounces API calls', async () => {
    jest.useFakeTimers();
    const fetchSuggestions = jest.fn().mockResolvedValue([]);

    const { getByRole } = render(
      <Typeahead
        fetchSuggestions={fetchSuggestions}
        debounceTime={300}
        minChars={1}
      />
    );

    const input = getByRole('combobox');

    fireEvent.change(input, { target: { value: 'a' } });
    expect(fetchSuggestions).not.toHaveBeenCalled();

    jest.advanceTimersByTime(150);
    expect(fetchSuggestions).not.toHaveBeenCalled();

    jest.advanceTimersByTime(150);
    expect(fetchSuggestions).toHaveBeenCalledWith('a', expect.any(Object));

    jest.useRealTimers();
  });

  test('cancels previous requests', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    const fetchSuggestions = jest.fn().mockResolvedValue([]);

    const { getByRole } = render(
      <Typeahead
        fetchSuggestions={fetchSuggestions}
        debounceTime={100}
        minChars={1}
      />
    );

    const input = getByRole('combobox');

    fireEvent.change(input, { target: { value: 'a' } });
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledTimes(1));

    fireEvent.change(input, { target: { value: 'ab' } });
    await waitFor(() => expect(abortSpy).toHaveBeenCalled());

    abortSpy.mockRestore();
  });

  test('shows suggestions', async () => {
    const { getByRole, findAllByRole } = render(
      <Typeahead
        fetchSuggestions={async () => ['Apple', 'Apricot', 'Avocado']}
        minChars={1}
      />
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'a' } });

    const items = await findAllByRole('option');
    expect(items).toHaveLength(3);
  });

  test('navigates with keyboard', async () => {
    const { getByRole, findAllByRole } = render(
      <Typeahead
        fetchSuggestions={async () => ['Apple', 'Apricot']}
        minChars={1}
      />
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'a' } });

    const items = await findAllByRole('option');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(items[0]).toHaveClass('selected');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(items[1]).toHaveClass('selected');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(items[0]).toHaveClass('selected');
  });

  test('selects item on Enter', async () => {
    const onSelect = jest.fn();

    const { getByRole, findAllByRole } = render(
      <Typeahead
        fetchSuggestions={async () => ['Apple']}
        onSelect={onSelect}
        minChars={1}
      />
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'a' } });

    await findAllByRole('option');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('Apple');
    expect(input.value).toBe('Apple');
  });

  test('clears search', async () => {
    const { getByRole, getByLabelText } = render(
      <Typeahead fetchSuggestions={async () => []} minChars={1} />
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'test' } });

    const clearButton = getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
  });

  test('caches results', async () => {
    const fetchSuggestions = jest.fn().mockResolvedValue(['Apple']);

    const { getByRole } = render(
      <Typeahead
        fetchSuggestions={fetchSuggestions}
        cache={true}
        minChars={1}
      />
    );

    const input = getByRole('combobox');

    // First search
    fireEvent.change(input, { target: { value: 'app' } });
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledTimes(1));

    // Clear and search again
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: 'app' } });

    // Should use cache, not call API again
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledTimes(1));
  });
});
```

---

## Common Mistakes

### ❌ Mistake 1: Not Debouncing

```javascript
// Fetches on every keystroke - BAD!
onChange={(e) => fetchSuggestions(e.target.value)}
```

✅ **Correct:**

```javascript
useEffect(() => {
  const timer = setTimeout(() => fetch(query), 300);
  return () => clearTimeout(timer);
}, [query]);
```

### ❌ Mistake 2: Not Canceling Previous Requests

```javascript
// Multiple concurrent requests cause race conditions
async function fetch(query) {
  const data = await api.search(query);
  setSuggestions(data); // Wrong results if out of order!
}
```

✅ **Correct:**

```javascript
const controller = new AbortController();
const data = await api.search(query, { signal: controller.signal });
```

### ❌ Mistake 3: Poor Accessibility

```javascript
// Missing ARIA attributes
<input type="text" />
<ul>
  <li>Item</li>
</ul>
```

✅ **Correct:**

```javascript
<input
  role="combobox"
  aria-autocomplete="list"
  aria-expanded="true"
  aria-controls="listbox-id"
/>
<ul id="listbox-id" role="listbox">
  <li role="option" aria-selected="false">Item</li>
</ul>
```

---

## Real-World Applications

1. **E-commerce Product Search** - Amazon, eBay
2. **Location Autocomplete** - Google Maps, Uber
3. **User Mentions** - Twitter, Slack (@mentions)
4. **Command Palette** - VS Code (Cmd+P), GitHub (/)
5. **Email Recipients** - Gmail, Outlook
6. **Tag Selection** - Stack Overflow, Medium

---

## Follow-up Questions

- "How would you add infinite scrolling to results?"
- "How do you handle mobile touch events?"
- "What if the API is very slow?"
- "How would you implement fuzzy matching?"
- "How do you test this component?"

---

## Resources

- [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Debouncing and Throttling](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [AbortController API](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

[← Back to DOM Manipulation Problems](../README.md)
