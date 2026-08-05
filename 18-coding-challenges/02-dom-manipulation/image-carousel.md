# Image Carousel

## Problem Statement

Implement a fully functional image carousel with auto-play, touch/swipe support, infinite loop, navigation controls, and accessibility features.

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Time to Solve:** 45-60 minutes
**Companies:** Airbnb, Pinterest, Amazon, Netflix, Instagram, Spotify

## Requirements

- [ ] Display images in a sliding carousel
- [ ] Auto-play with configurable interval
- [ ] Infinite loop (first → last, last → first)
- [ ] Previous/Next navigation buttons
- [ ] Dot indicators for current slide
- [ ] Touch/swipe support for mobile
- [ ] Keyboard navigation (←→ arrows)
- [ ] Pause on hover
- [ ] Accessible (ARIA attributes, screen reader support)
- [ ] Smooth transitions
- [ ] Lazy loading for images
- [ ] Thumbnail navigation (optional)

## Example Usage

```html
<div id="carousel-container"></div>

<script>
const carousel = new Carousel({
  container: '#carousel-container',
  images: [
    { src: '/images/1.jpg', alt: 'Mountain landscape' },
    { src: '/images/2.jpg', alt: 'Ocean sunset' },
    { src: '/images/3.jpg', alt: 'City skyline' },
  ],
  autoPlay: true,
  interval: 3000,
  loop: true,
  showDots: true,
  showArrows: true,
  onSlideChange: (index) => {
    console.log('Current slide:', index);
  },
});
</script>
```

## Solution 1: Vanilla JavaScript Implementation

```javascript
class Carousel {
  constructor(options) {
    this.options = {
      container: options.container,
      images: options.images || [],
      autoPlay: options.autoPlay !== false,
      interval: options.interval || 3000,
      loop: options.loop !== false,
      showDots: options.showDots !== false,
      showArrows: options.showArrows !== false,
      transitionDuration: options.transitionDuration || 500,
      onSlideChange: options.onSlideChange || (() => {}),
    };

    this.state = {
      currentIndex: 0,
      isTransitioning: false,
      isPaused: false,
      touchStartX: 0,
      touchEndX: 0,
    };

    this.autoPlayTimer = null;
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

    if (this.options.autoPlay) {
      this.startAutoPlay();
    }
  }

  render() {
    const { images, showDots, showArrows } = this.options;

    this.container.innerHTML = `
      <div class="carousel" role="region" aria-roledescription="carousel" aria-label="Image carousel">
        <div class="carousel-viewport">
          <div class="carousel-track">
            ${this.renderSlides()}
          </div>
        </div>

        ${
          showArrows
            ? `
          <button
            class="carousel-button carousel-button--prev"
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            class="carousel-button carousel-button--next"
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `
            : ''
        }

        ${
          showDots
            ? `
          <div class="carousel-dots" role="tablist" aria-label="Slide navigation">
            ${images
              .map(
                (_, index) => `
              <button
                class="carousel-dot ${index === 0 ? 'active' : ''}"
                role="tab"
                aria-label="Go to slide ${index + 1}"
                aria-selected="${index === 0}"
                data-index="${index}"
              ></button>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `;

    // Store references
    this.viewport = this.container.querySelector('.carousel-viewport');
    this.track = this.container.querySelector('.carousel-track');
    this.slides = this.container.querySelectorAll('.carousel-slide');
    this.prevButton = this.container.querySelector('.carousel-button--prev');
    this.nextButton = this.container.querySelector('.carousel-button--next');
    this.dots = this.container.querySelectorAll('.carousel-dot');
  }

  renderSlides() {
    return this.options.images
      .map(
        (image, index) => `
        <div
          class="carousel-slide ${index === 0 ? 'active' : ''}"
          role="tabpanel"
          aria-roledescription="slide"
          aria-label="Slide ${index + 1} of ${this.options.images.length}"
          aria-hidden="${index !== 0}"
        >
          <img
            src="${image.src}"
            alt="${image.alt || ''}"
            loading="${index === 0 ? 'eager' : 'lazy'}"
            class="carousel-image"
          />
        </div>
      `
      )
      .join('');
  }

  attachEventListeners() {
    // Button navigation
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.prev());
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.next());
    }

    // Dot navigation
    this.dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        this.goToSlide(index);
      });
    });

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    });

    // Touch/swipe support
    this.track.addEventListener('touchstart', (e) => {
      this.state.touchStartX = e.touches[0].clientX;
    });

    this.track.addEventListener('touchmove', (e) => {
      this.state.touchEndX = e.touches[0].clientX;
    });

    this.track.addEventListener('touchend', () => {
      this.handleSwipe();
    });

    // Mouse drag support (optional)
    let isDragging = false;
    let startX = 0;

    this.track.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      this.track.style.cursor = 'grabbing';
    });

    this.track.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      this.state.touchEndX = e.clientX;
    });

    this.track.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.track.style.cursor = 'grab';
      this.state.touchStartX = startX;
      this.state.touchEndX = e.clientX;
      this.handleSwipe();
    });

    this.track.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        this.track.style.cursor = 'grab';
      }
    });

    // Pause on hover
    this.container.addEventListener('mouseenter', () => {
      this.pauseAutoPlay();
    });

    this.container.addEventListener('mouseleave', () => {
      if (this.options.autoPlay && !this.state.isPaused) {
        this.startAutoPlay();
      }
    });

    // Pause/resume on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoPlay();
      } else if (this.options.autoPlay && !this.state.isPaused) {
        this.startAutoPlay();
      }
    });
  }

  handleSwipe() {
    const { touchStartX, touchEndX } = this.state;
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.next(); // Swipe left
      } else {
        this.prev(); // Swipe right
      }
    }

    // Reset touch positions
    this.state.touchStartX = 0;
    this.state.touchEndX = 0;
  }

  next() {
    if (this.state.isTransitioning) return;

    const nextIndex =
      this.state.currentIndex === this.options.images.length - 1
        ? this.options.loop
          ? 0
          : this.state.currentIndex
        : this.state.currentIndex + 1;

    this.goToSlide(nextIndex);
  }

  prev() {
    if (this.state.isTransitioning) return;

    const prevIndex =
      this.state.currentIndex === 0
        ? this.options.loop
          ? this.options.images.length - 1
          : 0
        : this.state.currentIndex - 1;

    this.goToSlide(prevIndex);
  }

  goToSlide(index) {
    if (
      index === this.state.currentIndex ||
      this.state.isTransitioning ||
      index < 0 ||
      index >= this.options.images.length
    ) {
      return;
    }

    this.state.isTransitioning = true;

    // Update slides
    const currentSlide = this.slides[this.state.currentIndex];
    const nextSlide = this.slides[index];

    currentSlide.classList.remove('active');
    currentSlide.setAttribute('aria-hidden', 'true');

    nextSlide.classList.add('active');
    nextSlide.setAttribute('aria-hidden', 'false');

    // Update dots
    if (this.dots.length > 0) {
      this.dots[this.state.currentIndex].classList.remove('active');
      this.dots[this.state.currentIndex].setAttribute('aria-selected', 'false');
      this.dots[index].classList.add('active');
      this.dots[index].setAttribute('aria-selected', 'true');
    }

    // Update track position
    const offset = -index * 100;
    this.track.style.transform = `translateX(${offset}%)`;

    // Update state
    this.state.currentIndex = index;

    // Callback
    this.options.onSlideChange(index);

    // Reset transition lock
    setTimeout(() => {
      this.state.isTransitioning = false;
    }, this.options.transitionDuration);

    // Restart auto-play timer
    if (this.options.autoPlay && !this.state.isPaused) {
      this.resetAutoPlay();
    }
  }

  startAutoPlay() {
    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, this.options.interval);
  }

  pauseAutoPlay() {
    clearInterval(this.autoPlayTimer);
  }

  resetAutoPlay() {
    this.pauseAutoPlay();
    this.startAutoPlay();
  }

  destroy() {
    clearInterval(this.autoPlayTimer);
    // Remove all event listeners (simplified)
    this.container.innerHTML = '';
  }
}
```

### CSS Styles

```css
.carousel {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.carousel-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease-in-out;
  cursor: grab;
  user-select: none;
}

.carousel-track:active {
  cursor: grabbing;
}

.carousel-slide {
  min-width: 100%;
  position: relative;
}

.carousel-slide:not(.active) {
  visibility: hidden;
}

.carousel-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  aspect-ratio: 16 / 9;
}

.carousel-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s, transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.carousel-button:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.carousel-button:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

.carousel-button--prev {
  left: 16px;
}

.carousel-button--next {
  right: 16px;
}

.carousel-button svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

.carousel-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.carousel-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

.carousel-dot:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.carousel-dot.active {
  background: white;
  width: 32px;
  border-radius: 6px;
}

.carousel-dot:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .carousel-button {
    width: 40px;
    height: 40px;
  }

  .carousel-button--prev {
    left: 8px;
  }

  .carousel-button--next {
    right: 8px;
  }

  .carousel-dots {
    bottom: 12px;
  }
}
```

## Solution 2: React Implementation

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function Carousel({
  images = [],
  autoPlay = true,
  interval = 3000,
  loop = true,
  showDots = true,
  showArrows = true,
  transitionDuration = 500,
  onSlideChange,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const autoPlayRef = useRef(null);
  const isPausedRef = useRef(false);

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || isPausedRef.current) return;

    autoPlayRef.current = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(autoPlayRef.current);
  }, [currentIndex, autoPlay, interval]);

  // Pause on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(autoPlayRef.current);
      } else if (autoPlay && !isPausedRef.current) {
        autoPlayRef.current = setInterval(goToNext, interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoPlay, interval]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;

    setCurrentIndex((prev) => {
      const isLast = prev === images.length - 1;
      return isLast ? (loop ? 0 : prev) : prev + 1;
    });
  }, [images.length, loop, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;

    setCurrentIndex((prev) => {
      const isFirst = prev === 0;
      return isFirst ? (loop ? images.length - 1 : 0) : prev - 1;
    });
  }, [images.length, loop, isTransitioning]);

  const goToSlide = useCallback(
    (index) => {
      if (index === currentIndex || isTransitioning) return;
      setCurrentIndex(index);
    },
    [currentIndex, isTransitioning]
  );

  // Handle transition state
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);

    return () => clearTimeout(timer);
  }, [currentIndex, transitionDuration]);

  // Notify parent of slide change
  useEffect(() => {
    onSlideChange?.(currentIndex);
  }, [currentIndex, onSlideChange]);

  // Touch handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const threshold = 50;

    if (distance > threshold) {
      goToNext();
    } else if (distance < -threshold) {
      goToPrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  // Pause/resume handlers
  const handleMouseEnter = () => {
    isPausedRef.current = true;
    clearInterval(autoPlayRef.current);
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    if (autoPlay) {
      autoPlayRef.current = setInterval(goToNext, interval);
    }
  };

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: `transform ${transitionDuration}ms ease-in-out`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className={`carousel-slide ${
                index === currentIndex ? 'active' : ''
              }`}
              role="tabpanel"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${images.length}`}
              aria-hidden={index !== currentIndex}
            >
              <img
                src={image.src}
                alt={image.alt || ''}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="carousel-image"
              />
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            className="carousel-button carousel-button--prev"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="carousel-button carousel-button--next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {showDots && (
        <div
          className="carousel-dots"
          role="tablist"
          aria-label="Slide navigation"
        >
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${
                index === currentIndex ? 'active' : ''
              }`}
              onClick={() => goToSlide(index)}
              role="tab"
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Carousel;
```

### React Usage Example

```jsx
function App() {
  const images = [
    { src: '/images/mountain.jpg', alt: 'Mountain landscape' },
    { src: '/images/ocean.jpg', alt: 'Ocean sunset' },
    { src: '/images/city.jpg', alt: 'City skyline' },
    { src: '/images/forest.jpg', alt: 'Forest path' },
  ];

  return (
    <div className="app">
      <Carousel
        images={images}
        autoPlay={true}
        interval={3000}
        loop={true}
        showDots={true}
        showArrows={true}
        onSlideChange={(index) => console.log('Slide:', index)}
      />
    </div>
  );
}
```

## Test Cases

```javascript
describe('Carousel', () => {
  const images = [
    { src: '/img1.jpg', alt: 'Image 1' },
    { src: '/img2.jpg', alt: 'Image 2' },
    { src: '/img3.jpg', alt: 'Image 3' },
  ];

  test('renders all images', () => {
    const { getAllByRole } = render(<Carousel images={images} />);
    const slides = getAllByRole('tabpanel');
    expect(slides).toHaveLength(3);
  });

  test('shows first slide by default', () => {
    const { getAllByRole } = render(<Carousel images={images} />);
    const slides = getAllByRole('tabpanel');
    expect(slides[0]).toHaveClass('active');
    expect(slides[0]).toHaveAttribute('aria-hidden', 'false');
  });

  test('navigates to next slide on button click', () => {
    const { getByLabelText, getAllByRole } = render(
      <Carousel images={images} autoPlay={false} />
    );

    const nextButton = getByLabelText('Next slide');
    fireEvent.click(nextButton);

    const slides = getAllByRole('tabpanel');
    expect(slides[1]).toHaveClass('active');
  });

  test('navigates to previous slide', () => {
    const { getByLabelText, getAllByRole } = render(
      <Carousel images={images} autoPlay={false} />
    );

    const prevButton = getByLabelText('Previous slide');
    fireEvent.click(prevButton);

    const slides = getAllByRole('tabpanel');
    expect(slides[2]).toHaveClass('active'); // Loops to last
  });

  test('navigates with keyboard arrows', () => {
    const { container, getAllByRole } = render(
      <Carousel images={images} autoPlay={false} />
    );

    fireEvent.keyDown(container.firstChild, { key: 'ArrowRight' });

    const slides = getAllByRole('tabpanel');
    expect(slides[1]).toHaveClass('active');
  });

  test('navigates to specific slide via dots', () => {
    const { getAllByRole } = render(
      <Carousel images={images} autoPlay={false} />
    );

    const dots = getAllByRole('tab');
    fireEvent.click(dots[2]);

    const slides = getAllByRole('tabpanel');
    expect(slides[2]).toHaveClass('active');
  });

  test('auto-plays slides', async () => {
    jest.useFakeTimers();

    const { getAllByRole } = render(
      <Carousel images={images} autoPlay={true} interval={1000} />
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const slides = getAllByRole('tabpanel');
    expect(slides[1]).toHaveClass('active');

    jest.useRealTimers();
  });

  test('pauses on hover', () => {
    jest.useFakeTimers();

    const { container, getAllByRole } = render(
      <Carousel images={images} autoPlay={true} interval={1000} />
    );

    fireEvent.mouseEnter(container.firstChild);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const slides = getAllByRole('tabpanel');
    expect(slides[0]).toHaveClass('active'); // Still on first slide

    jest.useRealTimers();
  });

  test('handles swipe gestures', () => {
    const { container, getAllByRole } = render(
      <Carousel images={images} autoPlay={false} />
    );

    const track = container.querySelector('.carousel-track');

    fireEvent.touchStart(track, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(track, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(track);

    const slides = getAllByRole('tabpanel');
    expect(slides[1]).toHaveClass('active');
  });

  test('calls onSlideChange callback', () => {
    const onSlideChange = jest.fn();

    const { getByLabelText } = render(
      <Carousel
        images={images}
        autoPlay={false}
        onSlideChange={onSlideChange}
      />
    );

    const nextButton = getByLabelText('Next slide');
    fireEvent.click(nextButton);

    expect(onSlideChange).toHaveBeenCalledWith(1);
  });
});
```

## Common Mistakes

❌ **Mistake:** Not handling infinite loop correctly
```javascript
// Breaks at boundaries
const nextIndex = currentIndex + 1;
if (nextIndex >= images.length) return;
```

✅ **Correct:** Proper loop logic
```javascript
const nextIndex =
  currentIndex === images.length - 1
    ? loop ? 0 : currentIndex
    : currentIndex + 1;
```

❌ **Mistake:** Not preventing transitions during animation
```javascript
// Can cause glitchy animations
function goToSlide(index) {
  setCurrentIndex(index);
}
```

✅ **Correct:** Lock transitions
```javascript
function goToSlide(index) {
  if (isTransitioning) return;
  setIsTransitioning(true);
  setCurrentIndex(index);
  setTimeout(() => setIsTransitioning(false), 500);
}
```

❌ **Mistake:** Not cleaning up auto-play timer
```javascript
// Memory leak
useEffect(() => {
  setInterval(() => next(), 3000);
}, []);
```

✅ **Correct:** Clean up intervals
```javascript
useEffect(() => {
  const timer = setInterval(() => next(), 3000);
  return () => clearInterval(timer);
}, []);
```

## Real-World Applications

1. **E-commerce** - Amazon, Shopify (product images)
2. **Social media** - Instagram, Pinterest (story/feed)
3. **News sites** - CNN, BBC (featured stories)
4. **Travel** - Airbnb, Booking.com (property photos)
5. **Portfolios** - Photography, design showcases

## Follow-up Questions

- "How would you implement thumbnail previews?"
- "How do you handle different image aspect ratios?"
- "What optimizations would you add for performance?"
- "How would you implement vertical carousels?"
- "How do you handle accessibility for screen readers?"
- "How would you add animations between slides (fade, slide, zoom)?"

## Resources

- [WAI-ARIA Authoring Practices: Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)

---

[← Back to DOM Manipulation Problems](../README.md)
