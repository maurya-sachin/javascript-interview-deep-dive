# Star Rating Component

## Problem Statement

Create an interactive star rating component with hover effects, keyboard accessibility, and customization options.

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time to Solve:** 25-35 minutes
**Companies:** Amazon, Airbnb, Yelp, TripAdvisor, Google

## Requirements

- [ ] Display N stars (default 5)
- [ ] Click to set rating
- [ ] Hover preview
- [ ] Half-star support (optional)
- [ ] Readonly mode
- [ ] Keyboard accessible
- [ ] Customizable size and colors
- [ ] Show rating value
- [ ] onChange callback

## Example Usage

```javascript
// Vanilla JS
const rating = new StarRating({
  container: '#rating',
  maxStars: 5,
  initialValue: 3.5,
  allowHalf: true,
  onChange: (value) => console.log('Rating:', value)
});

// React
<StarRating
  maxStars={5}
  value={3.5}
  allowHalf
  onChange={(value) => console.log('Rating:', value)}
/>
```

## Solution 1: React Implementation

```jsx
import { useState } from 'react';

function StarRating({
  maxStars = 5,
  value = 0,
  onChange,
  allowHalf = false,
  readonly = false,
  size = 24,
  color = '#ffc107',
  emptyColor = '#e0e0e0',
}) {
  const [hoverValue, setHoverValue] = useState(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (starIndex, isHalf) => {
    if (readonly || !onChange) return;

    const newValue = isHalf ? starIndex - 0.5 : starIndex;
    onChange(newValue);
  };

  const handleMouseMove = (starIndex, event) => {
    if (readonly) return;

    if (allowHalf) {
      const { left, width } = event.currentTarget.getBoundingClientRect();
      const percent = (event.clientX - left) / width;
      const isHalf = percent < 0.5;
      setHoverValue(isHalf ? starIndex - 0.5 : starIndex);
    } else {
      setHoverValue(starIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleKeyDown = (event, starIndex) => {
    if (readonly || !onChange) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(starIndex);
    } else if (event.key === 'ArrowLeft' && starIndex > 1) {
      event.preventDefault();
      onChange(starIndex - 1);
    } else if (event.key === 'ArrowRight' && starIndex < maxStars) {
      event.preventDefault();
      onChange(starIndex + 1);
    }
  };

  return (
    <div
      className="star-rating"
      onMouseLeave={handleMouseLeave}
      role="radiogroup"
      aria-label={`Rating: ${value} out of ${maxStars} stars`}
    >
      {[...Array(maxStars)].map((_, index) => {
        const starIndex = index + 1;
        const fillPercentage = Math.min(
          Math.max(displayValue - index, 0),
          1
        ) * 100;

        return (
          <button
            key={starIndex}
            className={`star ${readonly ? 'readonly' : ''}`}
            onClick={() => handleClick(starIndex, false)}
            onMouseMove={(e) => handleMouseMove(starIndex, e)}
            onKeyDown={(e) => handleKeyDown(e, starIndex)}
            disabled={readonly}
            role="radio"
            aria-checked={value === starIndex}
            aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
            tabIndex={value === starIndex ? 0 : -1}
            style={{
              width: size,
              height: size,
              cursor: readonly ? 'default' : 'pointer',
            }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`gradient-${starIndex}`}>
                  <stop offset={`${fillPercentage}%`} stopColor={color} />
                  <stop offset={`${fillPercentage}%`} stopColor={emptyColor} />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={`url(#gradient-${starIndex})`}
                stroke={color}
                strokeWidth="1"
              />
            </svg>
          </button>
        );
      })}
      {!readonly && (
        <span className="rating-value" aria-live="polite">
          {displayValue.toFixed(allowHalf ? 1 : 0)} / {maxStars}
        </span>
      )}
    </div>
  );
}

export default StarRating;
```

## Solution 2: Vanilla JavaScript

```javascript
class StarRating {
  constructor(options) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    this.maxStars = options.maxStars || 5;
    this.value = options.initialValue || 0;
    this.allowHalf = options.allowHalf || false;
    this.readonly = options.readonly || false;
    this.size = options.size || 24;
    this.color = options.color || '#ffc107';
    this.emptyColor = options.emptyColor || '#e0e0e0';
    this.onChange = options.onChange || (() => {});

    this.hoverValue = null;

    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.className = 'star-rating';
    this.container.setAttribute('role', 'radiogroup');
    this.container.setAttribute(
      'aria-label',
      `Rating: ${this.value} out of ${this.maxStars} stars`
    );

    const stars = Array.from({ length: this.maxStars }, (_, i) =>
      this.createStar(i + 1)
    ).join('');

    const valueDisplay = this.readonly
      ? ''
      : `<span class="rating-value">${this.value.toFixed(
          this.allowHalf ? 1 : 0
        )} / ${this.maxStars}</span>`;

    this.container.innerHTML = stars + valueDisplay;
  }

  createStar(index) {
    const fillPercentage = Math.min(
      Math.max(
        (this.hoverValue !== null ? this.hoverValue : this.value) - (index - 1),
        0
      ),
      1
    ) * 100;

    return `
      <button
        class="star ${this.readonly ? 'readonly' : ''}"
        data-index="${index}"
        ${this.readonly ? 'disabled' : ''}
        role="radio"
        aria-checked="${this.value === index}"
        aria-label="${index} star${index > 1 ? 's' : ''}"
        tabindex="${this.value === index ? 0 : -1}"
        style="width: ${this.size}px; height: ${this.size}px;"
      >
        <svg width="${this.size}" height="${this.size}" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="gradient-${index}">
              <stop offset="${fillPercentage}%" stop-color="${this.color}" />
              <stop offset="${fillPercentage}%" stop-color="${this.emptyColor}" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="url(#gradient-${index})"
            stroke="${this.color}"
            stroke-width="1"
          />
        </svg>
      </button>
    `;
  }

  attachEventListeners() {
    this.container.addEventListener('click', (e) => this.handleClick(e));
    this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.container.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.container.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleClick(e) {
    if (this.readonly) return;

    const star = e.target.closest('.star');
    if (!star) return;

    const index = parseInt(star.dataset.index);
    let newValue = index;

    if (this.allowHalf) {
      const rect = star.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      newValue = percent < 0.5 ? index - 0.5 : index;
    }

    this.value = newValue;
    this.onChange(newValue);
    this.render();
  }

  handleMouseMove(e) {
    if (this.readonly) return;

    const star = e.target.closest('.star');
    if (!star) return;

    const index = parseInt(star.dataset.index);

    if (this.allowHalf) {
      const rect = star.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.hoverValue = percent < 0.5 ? index - 0.5 : index;
    } else {
      this.hoverValue = index;
    }

    this.updateStars();
    this.updateValueDisplay();
  }

  handleMouseLeave() {
    this.hoverValue = null;
    this.updateStars();
    this.updateValueDisplay();
  }

  handleKeyDown(e) {
    if (this.readonly) return;

    const star = e.target.closest('.star');
    if (!star) return;

    const index = parseInt(star.dataset.index);

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.value = index;
      this.onChange(index);
      this.render();
    } else if (e.key === 'ArrowLeft' && index > 1) {
      e.preventDefault();
      const prevStar = this.container.querySelector(
        `.star[data-index="${index - 1}"]`
      );
      prevStar?.focus();
    } else if (e.key === 'ArrowRight' && index < this.maxStars) {
      e.preventDefault();
      const nextStar = this.container.querySelector(
        `.star[data-index="${index + 1}"]`
      );
      nextStar?.focus();
    }
  }

  updateStars() {
    const stars = this.container.querySelectorAll('.star');
    stars.forEach((star, i) => {
      const index = i + 1;
      const fillPercentage = Math.min(
        Math.max(
          (this.hoverValue !== null ? this.hoverValue : this.value) - (index - 1),
          0
        ),
        1
      ) * 100;

      const gradient = star.querySelector(`#gradient-${index}`);
      const stops = gradient.querySelectorAll('stop');
      stops[0].setAttribute('offset', `${fillPercentage}%`);
      stops[1].setAttribute('offset', `${fillPercentage}%`);
    });
  }

  updateValueDisplay() {
    const valueSpan = this.container.querySelector('.rating-value');
    if (valueSpan) {
      const displayValue = this.hoverValue !== null ? this.hoverValue : this.value;
      valueSpan.textContent = `${displayValue.toFixed(
        this.allowHalf ? 1 : 0
      )} / ${this.maxStars}`;
    }
  }

  setValue(newValue) {
    this.value = newValue;
    this.render();
  }

  getValue() {
    return this.value;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
```

## CSS Styles

```css
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.star {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.star:not(.readonly):hover {
  transform: scale(1.1);
}

.star:not(.readonly):focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
  border-radius: 4px;
}

.star.readonly {
  cursor: default;
}

.rating-value {
  margin-left: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
```

## Test Cases

```javascript
describe('StarRating', () => {
  test('renders correct number of stars', () => {
    const { container } = render(<StarRating maxStars={5} />);
    const stars = container.querySelectorAll('.star');
    expect(stars).toHaveLength(5);
  });

  test('sets initial value', () => {
    const { container } = render(<StarRating value={3} />);
    expect(container).toHaveTextContent('3 / 5');
  });

  test('calls onChange when star is clicked', () => {
    const onChange = jest.fn();
    const { container } = render(<StarRating onChange={onChange} />);

    const thirdStar = container.querySelectorAll('.star')[2];
    fireEvent.click(thirdStar);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  test('supports half stars', () => {
    const onChange = jest.fn();
    const { container } = render(<StarRating allowHalf onChange={onChange} />);

    const secondStar = container.querySelectorAll('.star')[1];
    const rect = secondStar.getBoundingClientRect();

    // Click left half
    fireEvent.click(secondStar, {
      clientX: rect.left + rect.width * 0.25,
    });

    expect(onChange).toHaveBeenCalledWith(1.5);
  });

  test('readonly mode prevents changes', () => {
    const onChange = jest.fn();
    const { container } = render(<StarRating readonly onChange={onChange} />);

    const star = container.querySelector('.star');
    fireEvent.click(star);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('keyboard navigation works', () => {
    const onChange = jest.fn();
    const { container } = render(<StarRating onChange={onChange} />);

    const firstStar = container.querySelector('.star');
    firstStar.focus();

    fireEvent.keyDown(firstStar, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(1);

    fireEvent.keyDown(firstStar, { key: 'ArrowRight' });
    const secondStar = container.querySelectorAll('.star')[1];
    expect(document.activeElement).toBe(secondStar);
  });
});
```

## Common Mistakes

❌ **Mistake:** Not handling half-stars correctly
```javascript
// Always rounds to full stars
const value = Math.round(clickPosition);
```

✅ **Correct:** Calculate half-star based on click position
```javascript
const rect = star.getBoundingClientRect();
const percent = (event.clientX - rect.left) / rect.width;
const value = percent < 0.5 ? index - 0.5 : index;
```

❌ **Mistake:** Missing keyboard accessibility
```html
<div onclick="setRating(3)">★</div>
```

✅ **Correct:** Use button with keyboard support
```html
<button role="radio" onKeyDown={handleKeyDown}>★</button>
```

## Real-World Applications

1. **E-commerce** - Amazon product reviews
2. **Restaurants** - Yelp, Google Maps ratings
3. **Hotels** - Booking.com, TripAdvisor
4. **Apps** - App Store ratings
5. **Media** - Netflix, Spotify likes

## Follow-up Questions

- "How would you implement a readonly rating display?"
- "How do you handle decimal ratings (e.g., 3.7)?"
- "What accessibility considerations are important?"
- "How would you add animations?"
- "How do you optimize for mobile touch events?"

## Resources

- [WAI-ARIA: Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton/)
- [Accessible Star Rating](https://css-tricks.com/accessible-star-rating-widget/)

---

[← Back to UI Components](../README.md)
