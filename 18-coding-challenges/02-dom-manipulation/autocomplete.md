# Autocomplete Component

## Problem Statement

Implement a functional autocomplete/typeahead component that suggests results as the user types. Include debouncing, keyboard navigation, and accessibility features.

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Time to Solve:** 45-60 minutes
**Companies:** Google, Meta, Amazon, Airbnb, Uber, Netflix

## Requirements

- [ ] Display suggestions as user types
- [ ] Debounce API calls (300ms)
- [ ] Keyboard navigation (↑↓ arrows, Enter, Escape)
- [ ] Highlight matching text
- [ ] Handle loading and error states
- [ ] Click outside to close
- [ ] Accessible (ARIA attributes, screen reader support)
- [ ] Cancel previous requests on new input
- [ ] Handle empty results
- [ ] Support custom rendering

## Example Usage

```html
<div id="search-container"></div>

<script>
const autocomplete = new Autocomplete({
  container: '#search-container',
  placeholder: 'Search cities...',
  fetchSuggestions: async (query) => {
    const response = await fetch(`/api/cities?q=${query}`);
    return response.json();
  },
  onSelect: (item) => {
    console.log('Selected:', item);
  },
  renderItem: (item, query) => {
    return `<strong>${item.name}</strong> - ${item.country}`;
  },
});
</script>
```

## Solution 1: Vanilla JavaScript Implementation

```javascript
class Autocomplete {
  constructor(options) {
    this.options = {
      container: options.container,
      placeholder: options.placeholder || 'Search...',
      fetchSuggestions: options.fetchSuggestions,
      onSelect: options.onSelect || (() => {}),
      renderItem: options.renderItem || ((item) => item),
      debounceTime: options.debounceTime || 300,
      minChars: options.minChars || 2,
    };

    this.state = {
      suggestions: [],
      selectedIndex: -1,
      isLoading: false,
      query: '',
      isOpen: false,
    };

    this.abortController = null;
    this.debounceTimer = null;

    this.init();
  }

  init() {
    const container =
      typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container;

    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="autocomplete">
        <div class="autocomplete-input-wrapper">
          <input
            type="text"
            class="autocomplete-input"
            placeholder="${this.options.placeholder}"
            autocomplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="${this.state.isOpen}"
            aria-controls="autocomplete-listbox"
            aria-activedescendant="${
              this.state.selectedIndex >= 0
                ? `autocomplete-item-${this.state.selectedIndex}`
                : ''
            }"
          />
          ${
            this.state.isLoading
              ? '<span class="autocomplete-spinner" aria-label="Loading"></span>'
              : ''
          }
        </div>
        <ul
          id="autocomplete-listbox"
          class="autocomplete-list ${this.state.isOpen ? 'open' : ''}"
          role="listbox"
        >
          ${this.renderSuggestions()}
        </ul>
      </div>
    `;

    // Store references
    this.input = this.container.querySelector('.autocomplete-input');
    this.list = this.container.querySelector('.autocomplete-list');
  }

  renderSuggestions() {
    if (this.state.isLoading) {
      return '<li class="autocomplete-loading">Loading...</li>';
    }

    if (this.state.query && this.state.suggestions.length === 0) {
      return '<li class="autocomplete-empty">No results found</li>';
    }

    return this.state.suggestions
      .map((item, index) => {
        const content = this.options.renderItem(item, this.state.query);
        const isSelected = index === this.state.selectedIndex;

        return `
          <li
            id="autocomplete-item-${index}"
            class="autocomplete-item ${isSelected ? 'selected' : ''}"
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

    // List events
    this.list.addEventListener('click', this.handleListClick.bind(this));

    // Click outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  handleInput(e) {
    const query = e.target.value;
    this.state.query = query;

    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Close if below minimum characters
    if (query.length < this.options.minChars) {
      this.state.isOpen = false;
      this.state.suggestions = [];
      this.updateUI();
      return;
    }

    // Debounced fetch
    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(query);
    }, this.options.debounceTime);
  }

  async fetchSuggestions(query) {
    this.state.isLoading = true;
    this.state.isOpen = true;
    this.updateUI();

    try {
      // Create new AbortController for this request
      this.abortController = new AbortController();

      const suggestions = await this.options.fetchSuggestions(query, {
        signal: this.abortController.signal,
      });

      this.state.suggestions = suggestions;
      this.state.selectedIndex = -1;
      this.state.isLoading = false;
      this.updateUI();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error('Error fetching suggestions:', error);
      this.state.isLoading = false;
      this.state.suggestions = [];
      this.updateUI();
    }
  }

  handleKeyDown(e) {
    if (!this.state.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.state.selectedIndex = Math.min(
          this.state.selectedIndex + 1,
          this.state.suggestions.length - 1
        );
        this.updateUI();
        this.scrollToSelected();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.state.selectedIndex = Math.max(this.state.selectedIndex - 1, -1);
        this.updateUI();
        this.scrollToSelected();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.state.selectedIndex >= 0) {
          this.selectItem(this.state.suggestions[this.state.selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  handleFocus() {
    if (this.state.query.length >= this.options.minChars) {
      this.state.isOpen = true;
      this.updateUI();
    }
  }

  handleListClick(e) {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);
    const suggestion = this.state.suggestions[index];
    this.selectItem(suggestion);
  }

  handleClickOutside(e) {
    if (!this.container.contains(e.target)) {
      this.close();
    }
  }

  selectItem(item) {
    this.input.value = typeof item === 'string' ? item : item.name || item;
    this.close();
    this.options.onSelect(item);
  }

  close() {
    this.state.isOpen = false;
    this.state.selectedIndex = -1;
    this.updateUI();
  }

  scrollToSelected() {
    if (this.state.selectedIndex < 0) return;

    const selectedElement = this.list.querySelector(
      `[data-index="${this.state.selectedIndex}"]`
    );

    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }

  updateUI() {
    // Update ARIA attributes
    this.input.setAttribute('aria-expanded', this.state.isOpen);
    this.input.setAttribute(
      'aria-activedescendant',
      this.state.selectedIndex >= 0
        ? `autocomplete-item-${this.state.selectedIndex}`
        : ''
    );

    // Re-render list
    this.list.innerHTML = this.renderSuggestions();
    this.list.classList.toggle('open', this.state.isOpen);

    // Update spinner
    const spinner = this.container.querySelector('.autocomplete-spinner');
    if (spinner) {
      spinner.style.display = this.state.isLoading ? 'block' : 'none';
    }
  }

  destroy() {
    clearTimeout(this.debounceTimer);
    if (this.abortController) {
      this.abortController.abort();
    }
    document.removeEventListener('click', this.handleClickOutside);
  }
}

// Helper function to highlight matching text
function highlightMatch(text, query) {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### CSS Styles

```css
.autocomplete {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.autocomplete-input-wrapper {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.autocomplete-input:focus {
  outline: none;
  border-color: #4A90E2;
}

.autocomplete-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4A90E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.autocomplete-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  list-style: none;
  margin: 0;
  padding: 0;
  display: none;
  z-index: 1000;
}

.autocomplete-list.open {
  display: block;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
  background-color: #f5f5f5;
}

.autocomplete-item.selected {
  background-color: #e3f2fd;
}

.autocomplete-item mark {
  background-color: #ffeb3b;
  font-weight: bold;
  padding: 0 2px;
}

.autocomplete-loading,
.autocomplete-empty {
  padding: 12px 16px;
  color: #666;
  text-align: center;
}
```

## Solution 2: React Implementation

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function Autocomplete({
  placeholder = 'Search...',
  fetchSuggestions,
  onSelect,
  renderItem = (item) => item,
  debounceTime = 300,
  minChars = 2,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced fetch
  useEffect(() => {
    if (query.length < minChars) {
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchData(query);
    }, debounceTime);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, minChars, debounceTime]);

  const fetchData = async (searchQuery) => {
    setIsLoading(true);
    setIsOpen(true);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const results = await fetchSuggestions(searchQuery, {
        signal: abortControllerRef.current.signal,
      });

      setSuggestions(results);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

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
          if (selectedIndex >= 0) {
            selectItem(suggestions[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, selectedIndex, suggestions]
  );

  const selectItem = (item) => {
    setQuery(typeof item === 'string' ? item : item.name || item);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect?.(item);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
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
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="autocomplete">
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= minChars && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="autocomplete-listbox"
          aria-activedescendant={
            selectedIndex >= 0 ? `autocomplete-item-${selectedIndex}` : ''
          }
          className="autocomplete-input"
        />
        {isLoading && (
          <span className="autocomplete-spinner" aria-label="Loading" />
        )}
      </div>

      {isOpen && (
        <ul
          id="autocomplete-listbox"
          ref={listRef}
          className="autocomplete-list"
          role="listbox"
        >
          {isLoading ? (
            <li className="autocomplete-loading">Loading...</li>
          ) : suggestions.length === 0 ? (
            <li className="autocomplete-empty">No results found</li>
          ) : (
            suggestions.map((item, index) => (
              <li
                key={index}
                id={`autocomplete-item-${index}`}
                className={`autocomplete-item ${
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

export default Autocomplete;
```

### React Usage Example

```jsx
function App() {
  const fetchCities = async (query, { signal }) => {
    const response = await fetch(`/api/cities?q=${query}`, { signal });
    return response.json();
  };

  const renderCity = (city, query) => {
    const highlightedName = city.name.replace(
      new RegExp(`(${query})`, 'gi'),
      '<mark>$1</mark>'
    );

    return (
      <div>
        <strong dangerouslySetInnerHTML={{ __html: highlightedName }} />
        <span> - {city.country}</span>
      </div>
    );
  };

  return (
    <Autocomplete
      placeholder="Search cities..."
      fetchSuggestions={fetchCities}
      onSelect={(city) => console.log('Selected:', city)}
      renderItem={renderCity}
    />
  );
}
```

## Test Cases

```javascript
describe('Autocomplete', () => {
  test('renders input with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Autocomplete placeholder="Search..." fetchSuggestions={jest.fn()} />
    );

    expect(getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('fetches suggestions on input', async () => {
    const fetchSuggestions = jest.fn().mockResolvedValue([
      { name: 'Apple' },
      { name: 'Apricot' },
    ]);

    const { getByRole, findAllByRole } = render(
      <Autocomplete fetchSuggestions={fetchSuggestions} />
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'app' } });

    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledWith('app'));

    const items = await findAllByRole('option');
    expect(items).toHaveLength(2);
  });

  test('navigates with keyboard', async () => {
    const { getByRole, findAllByRole } = render(
      <Autocomplete
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
      <Autocomplete
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
  });

  test('closes on Escape', async () => {
    const { getByRole, findAllByRole, queryAllByRole } = render(
      <Autocomplete fetchSuggestions={async () => ['Apple']} minChars={1} />
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'a' } });

    await findAllByRole('option');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(queryAllByRole('option')).toHaveLength(0);
  });
});
```

## Common Mistakes

❌ **Mistake:** Not debouncing input
```javascript
// Fetches on every keystroke
onChange={(e) => fetchSuggestions(e.target.value)}
```

✅ **Correct:** Debounce API calls
```javascript
useEffect(() => {
  const timer = setTimeout(() => fetchData(query), 300);
  return () => clearTimeout(timer);
}, [query]);
```

❌ **Mistake:** Not canceling previous requests
```javascript
// Multiple concurrent requests
async function fetchData(query) {
  const data = await fetch(`/api?q=${query}`);
  setSuggestions(data);
}
```

✅ **Correct:** Use AbortController
```javascript
const abortController = new AbortController();
const data = await fetch(`/api?q=${query}`, {
  signal: abortController.signal
});
```

## Real-World Applications

1. **Search bars** - Google, Amazon, YouTube
2. **Address lookup** - Google Maps, checkout forms
3. **User mentions** - Twitter, Slack (@mentions)
4. **Tag selection** - Stack Overflow, GitHub
5. **Command palettes** - VS Code (Ctrl+P), Linear (Cmd+K)

## Follow-up Questions

- "How would you implement caching for suggestions?"
- "How do you handle network errors?"
- "What optimizations would you add for mobile?"
- "How would you implement infinite scroll for results?"
- "How do you test accessibility?"

## Resources

- [WAI-ARIA Authoring Practices: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Debounce vs Throttle](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

[← Back to DOM Manipulation Problems](../README.md)
