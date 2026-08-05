# Timers - Cleanup & Animation

> **Focus**: Timer cleanup patterns, memory leaks, and requestAnimationFrame for animations

---

## Question 1: How do you properly clear timers and what is requestAnimationFrame?

**Difficulty:** 🟡 Medium
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 12-15 minutes
**Companies:** Google, Meta, Netflix, Airbnb, Uber

### Question

How do you properly clear timers in JavaScript and React/Vue applications? What is requestAnimationFrame and when should you use it instead of setTimeout/setInterval? Cover:

- `clearTimeout()` and `clearInterval()` syntax and usage
- Timer cleanup patterns and best practices
- Memory leaks from unclosed timers
- React/Vue cleanup in useEffect/lifecycle hooks
- `requestAnimationFrame()` for smooth animations
- `cancelAnimationFrame()` for cleanup
- RAF timing and browser rendering pipeline
- Performance comparison: RAF vs setTimeout for animations
- When to use RAF vs timers vs CSS animations

### Answer

**Timer Cleanup Basics:**

1. **clearTimeout() and clearInterval()**: Use these methods to stop timers and prevent memory leaks
2. **Timer ID management**: Always save the timer ID when creating a timer
3. **Component lifecycle**: Clear timers when components unmount
4. **Memory leak prevention**: Unclosed timers keep closures and references alive

**requestAnimationFrame (RAF):**

1. **Purpose**: Browser API for smooth, 60fps animations synchronized with screen refresh
2. **Timing**: Callback runs before next browser repaint (optimal for visual updates)
3. **Advantages**: 60fps sync, battery efficient, auto-pauses in background tabs
4. **Use cases**: Animations, smooth scrolling, game loops, progress indicators
5. **cancelAnimationFrame()**: Cleanup method to stop RAF animations

**Key Differences:**

- **setTimeout/setInterval**: For delays, polling, scheduled tasks (not animations)
- **requestAnimationFrame**: For smooth visual animations (16.67ms per frame at 60fps)
- **CSS animations/transitions**: For simple declarative animations (GPU-accelerated)

**Cleanup is critical because:**
- Timers create closures that keep variables in memory
- Component unmounting doesn't automatically stop timers
- Accumulation leads to memory leaks and performance degradation
- Background timers waste CPU and battery

### Code Example

#### 1. Basic Timer Cleanup

```javascript
// ❌ NO CLEANUP - Memory leak
function startPolling() {
  setInterval(() => {
    fetchData();
  }, 5000);
  // Timer never stops, keeps running forever
}

// ✅ PROPER CLEANUP - Save ID and clear
function startPolling() {
  const timerId = setInterval(() => {
    fetchData();
  }, 5000);

  return () => {
    clearInterval(timerId);
  };
}

const stopPolling = startPolling();
// Later...
stopPolling(); // Cleanup
```

#### 2. clearTimeout and clearInterval

```javascript
// clearTimeout
const timeoutId = setTimeout(() => {
  console.log('This will run after 3 seconds');
}, 3000);

// Cancel before execution
clearTimeout(timeoutId);

// clearInterval
const intervalId = setInterval(() => {
  console.log('This runs every 2 seconds');
}, 2000);

// Stop after some time
setTimeout(() => {
  clearInterval(intervalId);
}, 10000); // Stop after 10 seconds
```

#### 3. Memory Leak Demonstration

```javascript
// ❌ MEMORY LEAK - Component pattern
class ProductCarousel {
  constructor(element) {
    this.element = element;
    this.currentSlide = 0;

    // Timer created but NEVER cleared
    setInterval(() => {
      this.nextSlide();
      this.render();
    }, 3000);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  destroy() {
    // Cleanup not implemented - LEAK!
    this.element.remove();
  }
}

// Each instance creates a timer that never stops
const carousel1 = new ProductCarousel(elem1);
const carousel2 = new ProductCarousel(elem2);
carousel1.destroy(); // Timer still running! Memory leak.
carousel2.destroy(); // Another leak!

// ✅ PROPER CLEANUP
class ProductCarousel {
  constructor(element) {
    this.element = element;
    this.currentSlide = 0;
    this.timerId = null;

    this.start();
  }

  start() {
    this.timerId = setInterval(() => {
      this.nextSlide();
      this.render();
    }, 3000);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.element.remove();
  }
}
```

#### 4. React useEffect Cleanup

```javascript
import { useState, useEffect } from 'react';

// ❌ NO CLEANUP - Memory leak
function CountdownBad() {
  const [count, setCount] = useState(10);

  useEffect(() => {
    setInterval(() => {
      setCount(c => c - 1);
    }, 1000);
    // Missing cleanup - timer keeps running after unmount
  }, []);

  return <div>{count}</div>;
}

// ✅ PROPER CLEANUP with return function
function CountdownGood() {
  const [count, setCount] = useState(10);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(c => c - 1);
    }, 1000);

    // Cleanup function runs on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <div>{count}</div>;
}
```

#### 5. React Custom useTimeout Hook

```javascript
import { useEffect, useRef } from 'react';

// ✅ Reusable useTimeout hook with automatic cleanup
function useTimeout(callback, delay) {
  const savedCallback = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Don't schedule if no delay
    if (delay === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      savedCallback.current();
    }, delay);

    // Cleanup on unmount or delay change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay]);
}

// Usage
function NotificationComponent() {
  const [visible, setVisible] = useState(true);

  useTimeout(() => {
    setVisible(false);
  }, 5000); // Auto-hide after 5 seconds

  if (!visible) return null;

  return <div className="notification">Success!</div>;
}
```

#### 6. React Custom useInterval Hook

```javascript
import { useEffect, useRef } from 'react';

// ✅ Reusable useInterval hook with automatic cleanup
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const intervalId = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(intervalId);
    };
  }, [delay]);
}

// Usage
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

#### 7. React Class Component Cleanup

```javascript
class DataPolling extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null };
    this.intervalId = null;
  }

  componentDidMount() {
    // Start polling
    this.intervalId = setInterval(() => {
      this.fetchData();
    }, 5000);

    this.fetchData(); // Initial fetch
  }

  componentWillUnmount() {
    // ✅ CRITICAL: Clear timer on unmount
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  fetchData = async () => {
    const data = await fetch('/api/data').then(r => r.json());
    this.setState({ data });
  };

  render() {
    return <div>{JSON.stringify(this.state.data)}</div>;
  }
}
```

#### 8. Vue Composition API Cleanup

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    let intervalId = null;

    onMounted(() => {
      intervalId = setInterval(() => {
        count.value++;
      }, 1000);
    });

    onUnmounted(() => {
      // ✅ Cleanup on unmount
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    return { count };
  }
};
```

#### 9. Timer Registry Pattern

```javascript
// ✅ Centralized timer management
class TimerRegistry {
  constructor() {
    this.timers = new Map();
    this.nextId = 0;
  }

  setTimeout(callback, delay) {
    const id = this.nextId++;
    const timerId = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, { type: 'timeout', timerId });
    return id;
  }

  setInterval(callback, delay) {
    const id = this.nextId++;
    const timerId = setInterval(callback, delay);

    this.timers.set(id, { type: 'interval', timerId });
    return id;
  }

  clear(id) {
    const timer = this.timers.get(id);
    if (!timer) return;

    if (timer.type === 'timeout') {
      clearTimeout(timer.timerId);
    } else {
      clearInterval(timer.timerId);
    }

    this.timers.delete(id);
  }

  clearAll() {
    for (const [id] of this.timers) {
      this.clear(id);
    }
  }

  getActiveCount() {
    return this.timers.size;
  }
}

// Usage
const registry = new TimerRegistry();

const timer1 = registry.setTimeout(() => console.log('Done'), 5000);
const timer2 = registry.setInterval(() => console.log('Tick'), 1000);

console.log(registry.getActiveCount()); // 2

registry.clear(timer1);
registry.clear(timer2);
// Or clear all at once
registry.clearAll();
```

#### 10. Basic requestAnimationFrame

```javascript
// ❌ Using setTimeout for animation (janky, inconsistent)
function animateBoxBad() {
  let position = 0;

  function move() {
    position += 2;
    box.style.left = position + 'px';

    if (position < 500) {
      setTimeout(move, 16); // Trying to achieve 60fps
    }
  }

  move();
}

// ✅ Using requestAnimationFrame (smooth, 60fps)
function animateBoxGood() {
  let position = 0;

  function move() {
    position += 2;
    box.style.left = position + 'px';

    if (position < 500) {
      requestAnimationFrame(move);
    }
  }

  requestAnimationFrame(move);
}
```

#### 11. cancelAnimationFrame Usage

```javascript
let animationId = null;

function startAnimation() {
  let position = 0;

  function animate() {
    position += 2;
    element.style.left = position + 'px';

    if (position < 500) {
      animationId = requestAnimationFrame(animate);
    }
  }

  animationId = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Start/stop controls
startBtn.addEventListener('click', startAnimation);
stopBtn.addEventListener('click', stopAnimation);
```

#### 12. RAF Animation Loop (Recursive)

```javascript
// ✅ Continuous animation loop with RAF
function createAnimationLoop() {
  let isRunning = false;
  let animationId = null;

  function loop(timestamp) {
    if (!isRunning) return;

    // Update game state
    updateGame(timestamp);

    // Render frame
    renderGame();

    // Schedule next frame
    animationId = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      animationId = requestAnimationFrame(loop);
    },

    stop() {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
  };
}

const gameLoop = createAnimationLoop();
gameLoop.start();
// Later...
gameLoop.stop();
```

#### 13. RAF vs setTimeout Performance Comparison

```javascript
// Performance comparison
const iterations = 1000;

// setTimeout approach
console.time('setTimeout');
let setTimeoutCount = 0;
function setTimeoutLoop() {
  setTimeoutCount++;
  if (setTimeoutCount < iterations) {
    setTimeout(setTimeoutLoop, 0);
  } else {
    console.timeEnd('setTimeout'); // ~2000ms, janky
  }
}
setTimeout(setTimeoutLoop, 0);

// RAF approach
console.time('requestAnimationFrame');
let rafCount = 0;
function rafLoop() {
  rafCount++;
  if (rafCount < iterations) {
    requestAnimationFrame(rafLoop);
  } else {
    console.timeEnd('requestAnimationFrame'); // ~16ms per frame, smooth
  }
}
requestAnimationFrame(rafLoop);
```

#### 14. Smooth Scrolling with RAF

```javascript
// ✅ Smooth scroll to element using RAF
function smoothScrollTo(targetElement, duration = 1000) {
  const startPosition = window.pageYOffset;
  const targetPosition = targetElement.getBoundingClientRect().top + startPosition;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // Easing function (ease-in-out)
    const ease = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// Usage
const target = document.querySelector('#section-5');
smoothScrollTo(target, 800);
```

#### 15. Progress Bar Animation with RAF

```javascript
// ✅ Animated progress bar using RAF
function animateProgressBar(element, targetPercent, duration = 2000) {
  const startPercent = parseFloat(element.style.width) || 0;
  const distance = targetPercent - startPercent;
  let startTime = null;
  let animationId = null;

  function animate(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    const currentPercent = startPercent + distance * progress;
    element.style.width = currentPercent + '%';
    element.textContent = Math.round(currentPercent) + '%';

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  }

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}

// Usage
const progressBar = document.querySelector('.progress-bar');
const cancelAnimation = animateProgressBar(progressBar, 85, 3000);

// Cancel if needed
// cancelAnimation();
```

#### 16. Game Loop with RAF and Delta Time

```javascript
// ✅ Game loop with delta time for frame-rate independent animation
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = { x: 50, y: 50, speed: 100 }; // speed in pixels per second
    this.lastTime = 0;
    this.animationId = null;
    this.isRunning = false;
  }

  update(deltaTime) {
    // deltaTime in seconds
    // Move player (frame-rate independent)
    if (keys.right) {
      this.player.x += this.player.speed * deltaTime;
    }
    if (keys.left) {
      this.player.x -= this.player.speed * deltaTime;
    }
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw player
    this.ctx.fillStyle = 'blue';
    this.ctx.fillRect(this.player.x, this.player.y, 50, 50);
  }

  loop = (timestamp) => {
    if (!this.isRunning) return;

    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Update and render
    this.update(deltaTime);
    this.render();

    // Next frame
    this.animationId = requestAnimationFrame(this.loop);
  };

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

const game = new Game(document.querySelector('canvas'));
game.start();
```

#### 17. FPS Counter with RAF

```javascript
// ✅ FPS counter using requestAnimationFrame
class FPSCounter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
    this.animationId = null;
  }

  update = (timestamp) => {
    this.frames++;

    const deltaTime = timestamp - this.lastTime;

    // Update FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frames * 1000) / deltaTime);
      this.frames = 0;
      this.lastTime = timestamp;

      console.log(`FPS: ${this.fps}`);
    }

    this.animationId = requestAnimationFrame(this.update);
  };

  start() {
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.update);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

const fpsCounter = new FPSCounter();
fpsCounter.start();
```

#### 18. Throttled Scroll Listener with RAF

```javascript
// ✅ Throttle scroll updates using RAF
let scrollTicking = false;

function onScroll() {
  const scrollY = window.pageYOffset;

  // Update UI based on scroll position
  updateParallax(scrollY);
  updateProgressIndicator(scrollY);

  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(onScroll);
    scrollTicking = true;
  }
});
```

#### 19. React useRAF Hook

```javascript
import { useEffect, useRef, useState } from 'react';

// ✅ Custom React hook for requestAnimationFrame
function useRAF(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const callbackRef = useRef(callback);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
}

// Usage: Animated counter
function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);

  useRAF((deltaTime) => {
    setCount(prev => {
      const next = prev + deltaTime / 50; // Increment based on time
      return next >= target ? target : next;
    });
  });

  return <div>{Math.floor(count)}</div>;
}
```

#### 20. React Animated Box Component

```javascript
import { useState, useEffect, useRef } from 'react';

// ✅ Smooth animation using RAF in React
function AnimatedBox() {
  const [position, setPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef();

  const startAnimation = () => {
    setIsAnimating(true);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    if (!isAnimating) return;

    let start = null;
    const duration = 2000;
    const distance = 400;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      setPosition(distance * progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  return (
    <div>
      <div
        style={{
          width: 50,
          height: 50,
          backgroundColor: 'blue',
          transform: `translateX(${position}px)`,
        }}
      />
      <button onClick={startAnimation} disabled={isAnimating}>
        Start
      </button>
      <button onClick={stopAnimation} disabled={!isAnimating}>
        Stop
      </button>
    </div>
  );
}
```

#### 21. Vue Animated Component with RAF

```vue
<template>
  <div>
    <div :style="{ transform: `translateX(${position}px)` }" class="box"></div>
    <button @click="startAnimation">Start</button>
    <button @click="stopAnimation">Stop</button>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';

export default {
  setup() {
    const position = ref(0);
    let animationId = null;

    const startAnimation = () => {
      let start = null;
      const duration = 2000;
      const distance = 400;

      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);

        position.value = distance * progress;

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        }
      };

      animationId = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    // ✅ Cleanup on unmount
    onUnmounted(() => {
      stopAnimation();
    });

    return {
      position,
      startAnimation,
      stopAnimation
    };
  }
};
</script>

<style scoped>
.box {
  width: 50px;
  height: 50px;
  background-color: blue;
}
</style>
```

#### 22. Page Visibility API with RAF

```javascript
// ✅ Pause animations when tab is hidden
class AnimationManager {
  constructor() {
    this.animationId = null;
    this.isRunning = false;
    this.isPaused = false;

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  animate = (timestamp) => {
    if (this.isPaused) return;

    // Update animation
    updateScene(timestamp);
    renderScene();

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.animationId = requestAnimationFrame(this.animate);
  }

  pause() {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.animationId = requestAnimationFrame(this.animate);
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

const manager = new AnimationManager();
manager.start();
```

<details>
<summary><strong>🔍 Deep Dive: Memory Leak Mechanics and Browser Timer Implementation</strong></summary>

#### Memory Leak Mechanics

When timers are not properly cleared, they create memory leaks through closure references:

**How leaks occur:**

```javascript
function createLeak() {
  const largeData = new Array(1000000).fill('data');

  setInterval(() => {
    console.log(largeData.length); // Closure keeps largeData in memory
  }, 1000);

  // Timer never cleared → largeData never garbage collected
}

createLeak(); // Creates permanent memory leak
```

**Memory impact:**
- Each timer creates a closure
- Closure keeps all referenced variables alive
- Variables can't be garbage collected
- Memory usage grows indefinitely

**Real numbers:**
- Single timer closure: ~100KB - 1MB (depending on captured variables)
- 100 unclosed timers: 10MB - 100MB leaked
- 1000 timers after navigation spam: 100MB - 1GB leaked

#### Browser Timer Heap Management

Browsers maintain an internal timer heap (min-heap) for efficient timer management:

**Timer scheduling:**

1. **setTimeout(callback, delay)**:
   - Browser calculates: `executionTime = currentTime + delay`
   - Inserts timer into min-heap (sorted by execution time)
   - Heap maintains O(log n) insertion/removal

2. **Timer execution**:
   - Event loop checks heap: "Is top timer ready?"
   - If `currentTime >= executionTime`, execute callback
   - Remove from heap, continue checking

3. **setInterval persistence**:
   - After execution, re-insert into heap with new execution time
   - Repeats until `clearInterval()` called

**Heap structure:**
```
Timer Heap (sorted by execution time):
[
  { id: 5, time: 1000, callback: fn1 },
  { id: 2, time: 1500, callback: fn2 },
  { id: 8, time: 2000, callback: fn3 }
]
```

#### requestAnimationFrame Browser Implementation

**Rendering Pipeline:**

```
JavaScript → Style → Layout → Paint → Composite
     ↑                                    ↓
     └────── RAF callback runs here ──────┘
                  (before repaint)
```

**Timing details:**

1. **60fps target**: 16.67ms per frame
2. **RAF scheduling**: Browser calls RAF callbacks right before next repaint
3. **Synchronization**: RAF syncs with display refresh rate (60Hz, 120Hz, 144Hz)
4. **Background optimization**: 0fps when tab is hidden (battery saving)

**RAF execution flow:**

```javascript
// Browser internal pseudo-code
function browserRenderLoop() {
  while (true) {
    // 1. Execute all queued RAF callbacks
    executeRAFCallbacks();

    // 2. Calculate styles
    recalculateStyles();

    // 3. Layout (reflow)
    performLayout();

    // 4. Paint
    paint();

    // 5. Composite layers
    composite();

    // 6. Wait for next vsync (16.67ms at 60Hz)
    waitForVSync();
  }
}
```

**Display refresh rate sync:**

- **60Hz display**: RAF fires every 16.67ms (60fps)
- **120Hz display**: RAF fires every 8.33ms (120fps)
- **144Hz display**: RAF fires every 6.94ms (144fps)

RAF automatically matches the display's refresh rate!

#### Delta Time (Δt) for Frame-Rate Independent Animation

**Problem**: Different devices run at different frame rates (30fps, 60fps, 120fps)

**Solution**: Use delta time to normalize animation speed

```javascript
// ❌ Frame-rate dependent (bad)
function animate() {
  position += 2; // Moves 2px per frame
  // 60fps: 120px/sec
  // 30fps: 60px/sec (half speed!)
  requestAnimationFrame(animate);
}

// ✅ Frame-rate independent (good)
let lastTime = 0;
function animate(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  const speed = 120; // pixels per second
  position += speed * deltaTime;
  // 60fps: 120px/sec
  // 30fps: 120px/sec (same speed!)

  requestAnimationFrame(animate);
}
```

**Delta time calculation:**
- `deltaTime = (currentTime - lastTime) / 1000` (convert to seconds)
- `distance = speed * deltaTime` (pixels/second × seconds = pixels)

#### setTimeout vs RAF Performance Analysis

**Timing accuracy comparison:**

| Method | Target Interval | Actual Interval | Jitter |
|--------|----------------|-----------------|--------|
| setTimeout(fn, 16) | 16ms | 18-25ms | ±5-10ms |
| setInterval(fn, 16) | 16ms | 16-20ms | ±3-5ms |
| requestAnimationFrame | 16.67ms (60fps) | 16.67ms | <1ms |

**Power consumption benchmark:**

Test: Animate 100 boxes for 60 seconds

| Method | CPU Usage | Battery Drain | Frames Rendered |
|--------|-----------|---------------|-----------------|
| setTimeout(fn, 16) | 45-60% | 12% | ~2800 (46fps avg) |
| requestAnimationFrame | 8-15% | 3% | 3600 (60fps) |
| CSS animation | 2-5% | 1% | 3600 (60fps, GPU) |

**Background tab behavior:**

| Method | Active Tab | Background Tab | Battery Impact |
|--------|-----------|----------------|----------------|
| setTimeout | 60fps | 60fps | High (wasted) |
| setInterval | 60fps | 60fps | High (wasted) |
| requestAnimationFrame | 60fps | 0fps | Low (paused) |

#### V8 Timer Optimization

V8 (Chrome's JavaScript engine) optimizes timer execution:

**Timer coalescing:**
- Multiple timers with similar delays are batched together
- Reduces wake-ups, saves CPU

**Throttling:**
- Background tabs: setTimeout minimum delay = 1000ms (1 second)
- Nested setTimeout (depth > 5): minimum delay = 4ms
- Prevents infinite loops from freezing browser

**Priority queue:**
- V8 uses binary heap for O(log n) timer scheduling
- Fast insertion, fast next-timer lookup

#### Worker Threads and Timers

Timers work in Web Workers (background threads):

```javascript
// main.js
const worker = new Worker('worker.js');

// worker.js
setInterval(() => {
  postMessage('tick');
}, 1000);
// Runs in background thread, doesn't block main thread
```

**requestAnimationFrame in Workers:**
- **Not available** in Web Workers (no DOM access)
- Use `setTimeout` or `setInterval` instead
- For animations, keep RAF in main thread

#### setImmediate (Node.js) vs setTimeout(..., 0)

**setTimeout(fn, 0):**
- Minimum delay: 4ms (browser throttling)
- Not truly immediate

**setImmediate(fn)** (Node.js only):
- Executes after current I/O events
- Faster than setTimeout(fn, 0)

```javascript
// Node.js
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));

// Output order varies, but setImmediate is generally faster
```

#### Comparison Table: Animation Methods

| Method | FPS | CPU | GPU | Battery | Complexity | Background Behavior | Use Case |
|--------|-----|-----|-----|---------|------------|-------------------|----------|
| **setTimeout** | 30-45 | High | No | High | Low | Runs (waste) | Delays, polling |
| **setInterval** | 30-50 | High | No | High | Low | Runs (waste) | Polling, tickers |
| **requestAnimationFrame** | 60-120 | Med | No | Med | Med | Pauses (good) | JS animations, canvas, games |
| **CSS animations** | 60 | Low | Yes | Low | Low | Runs | Simple animations |
| **CSS transitions** | 60 | Low | Yes | Low | Low | Runs | State changes |
| **Web Animations API** | 60 | Med | Yes | Low | High | Controllable | Complex animations |
| **Canvas (RAF)** | 60-120 | High | Partial | Med | High | Pauses | Games, data viz |
| **WebGL (RAF)** | 60-120 | Med | Yes | Med | High | Pauses | 3D, complex graphics |

**FPS capabilities:**
- **setTimeout/setInterval**: Inconsistent, 30-50fps typical
- **RAF**: Matches display (60fps, 120fps, 144fps)
- **CSS**: Locked at 60fps (GPU accelerated)

**Battery efficiency ranking (best to worst):**
1. CSS animations (GPU, minimal JS)
2. CSS transitions (GPU, minimal JS)
3. Web Animations API (GPU, some JS)
4. requestAnimationFrame (CPU/partial GPU)
5. Canvas + RAF (CPU intensive)
6. setTimeout/setInterval (CPU, wasteful)

</details>

<details>
<summary><strong>🐛 Real-World Scenario: E-commerce Product Carousel Memory Leak</strong></summary>

#### Context: E-commerce Product Carousel Memory Leak

**Company**: MegaMart E-commerce (similar to Amazon)
**Component**: Product image carousel on homepage
**Tech Stack**: React 17, Webpack, deployed to AWS CloudFront
**Traffic**: 500,000+ daily users

#### Problem Discovery

**User complaints started pouring in:**
- "Laptop fan spinning like crazy after browsing for 10 minutes"
- "Browser tab using 100% CPU"
- "Laptop getting hot, battery draining in 1 hour instead of 8"
- "Page becomes sluggish after viewing 10-15 products"

**Metrics:**
- **Complaint tickets**: 2,340 users in 2 weeks
- **Bounce rate spike**: 12% → 18% (50% increase)
- **Avg session duration drop**: 8min → 4.5min (43% decrease)
- **Conversion rate drop**: 3.2% → 2.1% (34% decrease)
- **Revenue impact**: Estimated $180,000/week loss

#### Investigation & Debugging

**Step 1: Chrome DevTools Performance Profiling**

```javascript
// Record performance profile
// 1. Open DevTools → Performance tab
// 2. Click Record
// 3. Browse product pages for 2 minutes
// 4. Stop recording
```

**Findings:**
- **CPU usage**: Constantly at 95-100%
- **Main thread**: Saturated with timer callbacks
- **Function calls**: 47 `setInterval` callbacks firing every 3 seconds
- **Memory**: Growing from 50MB → 1.2GB over 5 minutes

**Step 2: Memory Profiler Timeline**

```javascript
// DevTools → Memory → Allocation timeline
// Record for 5 minutes of browsing
```

**Findings:**
- **Memory growth**: Linear, never decreasing (garbage collection not helping)
- **Retained size**: 1.2GB after viewing 20 products
- **Detached DOM nodes**: 940 carousel components still in memory
- **Timer closures**: Each keeping references to image data (5MB per carousel)

**Step 3: Heap Snapshot Comparison**

```javascript
// 1. Take snapshot after loading 1 product
// 2. Browse 20 more products
// 3. Take another snapshot
// 4. Compare
```

**Findings:**
```
Snapshot 1: 52MB (1 carousel)
Snapshot 2: 1.25GB (21 carousels)

Retained objects:
- ProductCarousel: 21 instances (should be 1)
- setInterval closures: 47 timers (should be 1)
- Image ArrayBuffers: 420MB (huge!)
```

**Step 4: React DevTools Profiler**

Profiler showed components unmounting but timers continuing to fire.

#### Root Cause Analysis

**Original problematic code:**

```javascript
// ❌ MEMORY LEAK CODE
function ProductCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Timer created on mount
    setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);

    // ❌ NO CLEANUP FUNCTION - CRITICAL BUG!
  }, [images.length]);

  return (
    <div className="carousel">
      <img src={images[currentIndex]} alt="Product" />
    </div>
  );
}
```

**What happened:**
1. User loads homepage → Carousel mounts → `setInterval` starts
2. User clicks product → Navigates to product page → Carousel unmounts
3. **Timer keeps running!** (not cleared)
4. User clicks another product → New carousel mounts → **Another timer starts**
5. After browsing 20 products: **20 timers running concurrently**
6. Each timer fires every 3 seconds → 20 × 1 = 20 callbacks every 3 seconds
7. Each callback has closure over `images` (5MB of image data)
8. Total memory: 20 carousels × 5MB = 100MB minimum
9. Additional React state updates causing re-renders
10. CPU maxed out from timer spam

**Memory leak breakdown:**
- **Timer closures**: 47 active timers (some nested)
- **Closure data**: Each timer captured 5MB of image references
- **Total leaked memory**: 47 × 5MB = 235MB minimum
- **React state overhead**: Additional re-render thrashing
- **Detached DOM**: 940 DOM nodes not garbage collected

#### Solution Implementation

**Fix #1: Add useEffect cleanup**

```javascript
// ✅ FIXED with cleanup
function ProductCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);

    // ✅ CLEANUP: Clear timer on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [images.length]);

  return (
    <div className="carousel">
      <img src={images[currentIndex]} alt="Product" />
    </div>
  );
}
```

**Fix #2: Migrate to requestAnimationFrame**

For even better performance, migrated to RAF:

```javascript
// ✅ OPTIMIZED with RAF
function ProductCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastUpdateRef = useRef(0);
  const rafIdRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    function animate(timestamp) {
      if (!isActive) return;

      // Update every 3 seconds
      if (timestamp - lastUpdateRef.current >= 3000) {
        setCurrentIndex(prev => (prev + 1) % images.length);
        lastUpdateRef.current = timestamp;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    }

    rafIdRef.current = requestAnimationFrame(animate);

    // ✅ Cleanup RAF on unmount
    return () => {
      isActive = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [images.length]);

  return (
    <div className="carousel">
      <img src={images[currentIndex]} alt="Product" />
    </div>
  );
}
```

**Fix #3: Add Page Visibility API (pause when tab hidden)**

```javascript
// ✅ FULLY OPTIMIZED with visibility pause
function ProductCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const lastUpdateRef = useRef(0);
  const rafIdRef = useRef(null);

  // Listen for visibility changes
  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(!document.hidden);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Animate only when visible
  useEffect(() => {
    if (!isVisible) return;

    let isActive = true;

    function animate(timestamp) {
      if (!isActive) return;

      if (timestamp - lastUpdateRef.current >= 3000) {
        setCurrentIndex(prev => (prev + 1) % images.length);
        lastUpdateRef.current = timestamp;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    }

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [images.length, isVisible]);

  return (
    <div className="carousel">
      <img src={images[currentIndex]} alt="Product" />
    </div>
  );
}
```

**Fix #4: Reusable useRAF hook**

```javascript
// ✅ Reusable hook for team-wide use
function useRAF(callback, interval, deps = []) {
  const lastUpdateRef = useRef(0);
  const rafIdRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let isActive = true;

    function animate(timestamp) {
      if (!isActive) return;

      if (timestamp - lastUpdateRef.current >= interval) {
        callbackRef.current(timestamp);
        lastUpdateRef.current = timestamp;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    }

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [interval, ...deps]);
}

// Usage
function ProductCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useRAF(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, 3000, [images.length]);

  return <img src={images[currentIndex]} alt="Product" />;
}
```

#### Results & Impact

**Performance improvements:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **CPU usage** | 95-100% | 3-8% | **92% reduction** |
| **Memory usage** | 1.25GB (growing) | 65MB (stable) | **95% reduction** |
| **Active timers** | 47 concurrent | 1 | **46 fewer leaks** |
| **Battery drain** | 1hr (100%/hr) | 8hr (12.5%/hr) | **+700% battery life** |
| **User complaints** | 2,340/2 weeks | 0 | **100% resolved** |
| **Bounce rate** | 18% | 9.5% | **47% improvement** |
| **Avg session** | 4.5min | 8.2min | **82% increase** |
| **Conversion rate** | 2.1% | 3.4% | **62% increase** |

**Business impact:**
- **Revenue recovery**: $180,000/week loss → $230,000/week gain (+28% vs baseline)
- **Customer satisfaction**: Support tickets down 100%
- **Performance monitoring**: Added Sentry tracking for timer cleanup

**Additional optimizations implemented:**
1. **Global timer registry** for monitoring
2. **ESLint rule** to enforce useEffect cleanup
3. **Code review checklist** for timer usage
4. **Performance budget** in CI/CD (max 5 active timers)
5. **User monitoring** with Sentry (track memory usage)

**Lessons learned:**
- Always clean up timers in component unmounts
- RAF is superior to timers for animations
- Page Visibility API saves battery
- Memory profiling should be part of QA
- Automated monitoring catches issues early

</details>

<details>
<summary><strong>⚖️ Trade-offs: Timer Cleanup and Animation Methods</strong></summary>

#### 1. Timer Cleanup Approaches

**A. Manual clearTimeout/clearInterval**

```javascript
let timerId = null;

function start() {
  timerId = setInterval(poll, 5000);
}

function stop() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}
```

**Pros:**
- Simple and straightforward
- Full control over timing
- Works in any environment

**Cons:**
- Easy to forget cleanup
- Requires manual ID management
- Error-prone in complex apps
- No automatic cleanup on scope exit

**Best for**: Simple scripts, one-off timers, small apps

---

**B. Registry Pattern**

```javascript
class TimerRegistry {
  constructor() {
    this.timers = new Map();
  }

  setTimeout(fn, delay) {
    const id = this.nextId++;
    const timerId = setTimeout(() => {
      fn();
      this.timers.delete(id);
    }, delay);
    this.timers.set(id, { type: 'timeout', timerId });
    return id;
  }

  clearAll() {
    for (const [id] of this.timers) {
      this.clear(id);
    }
  }
}
```

**Pros:**
- Centralized management
- Easy to clear all timers at once
- Debugging-friendly (track active timers)
- Prevents leaks in complex scenarios

**Cons:**
- Additional abstraction layer
- Small memory overhead (Map storage)
- Requires registry instance management
- Team must adopt pattern

**Best for**: Large apps, multiple components, debugging scenarios

---

**C. React Hooks (useEffect cleanup)**

```javascript
useEffect(() => {
  const id = setInterval(poll, 5000);
  return () => clearInterval(id);
}, []);
```

**Pros:**
- Automatic cleanup on unmount
- Framework-integrated
- Declarative and clear
- Hard to forget (linter warnings)

**Cons:**
- Framework-specific (React only)
- Requires understanding of useEffect
- Dependency array complexity
- Not reusable across frameworks

**Best for**: React applications, component-scoped timers

---

**D. WeakMap Tracking**

```javascript
const timers = new WeakMap();

function attachTimer(component) {
  const id = setInterval(() => component.update(), 1000);
  timers.set(component, id);
}

// When component is garbage collected, WeakMap entry is removed
```

**Pros:**
- Automatic memory management
- No manual cleanup needed
- Garbage collection friendly
- Memory efficient

**Cons:**
- Timers still run until GC (not immediate cleanup)
- Requires reference to component
- WeakMap limitations (no iteration)
- Unusual pattern (team learning curve)

**Best for**: Advanced use cases, automatic memory management

---

#### 2. Animation Methods Comparison

**A. setTimeout / setInterval**

```javascript
setInterval(() => {
  element.style.left = position++ + 'px';
}, 16);
```

**Pros:**
- Simple API
- Works everywhere
- Easy to understand
- Predictable intervals

**Cons:**
- Janky animations (30-45fps)
- High CPU usage
- Poor battery efficiency
- Runs in background tabs (waste)
- Not synchronized with display

**Best for**: Non-visual tasks (polling, delays), not animations

**Performance:**
- FPS: 30-45 (inconsistent)
- CPU: High (45-60%)
- Battery: High drain

---

**B. requestAnimationFrame**

```javascript
function animate() {
  element.style.left = position++ + 'px';
  requestAnimationFrame(animate);
}
```

**Pros:**
- Smooth 60fps animations
- Synced with display refresh
- Auto-pauses in background tabs
- Better battery efficiency
- Optimal timing for rendering

**Cons:**
- Only for visual updates
- Requires recursive pattern
- Need delta time for speed consistency
- More complex than setTimeout
- Not available in Web Workers

**Best for**: JavaScript animations, canvas, games, smooth updates

**Performance:**
- FPS: 60-120 (matches display)
- CPU: Medium (8-15%)
- Battery: Medium drain

---

**C. CSS Animations**

```css
@keyframes slide {
  from { left: 0; }
  to { left: 400px; }
}

.box {
  animation: slide 2s ease-in-out;
}
```

**Pros:**
- GPU-accelerated (very fast)
- Lowest CPU usage
- Declarative (no JS needed)
- Best battery efficiency
- Automatic 60fps
- Works in background

**Cons:**
- Limited interactivity
- Hard to control dynamically
- Complex keyframes difficult
- No access to animation state from JS
- Browser compatibility considerations

**Best for**: Simple, predefined animations

**Performance:**
- FPS: 60 (locked)
- CPU: Very low (2-5%)
- Battery: Very low drain

---

**D. CSS Transitions**

```css
.box {
  transition: left 2s ease-in-out;
}

.box.moved {
  left: 400px;
}
```

**Pros:**
- GPU-accelerated
- Perfect for state changes
- Declarative
- Very low CPU
- Smooth 60fps

**Cons:**
- Only for A→B transitions
- Limited to CSS properties
- No animation loop support
- Less control than JS

**Best for**: State-driven animations (hover, active, toggles)

**Performance:**
- FPS: 60
- CPU: Very low (2-5%)
- Battery: Very low drain

---

**E. Web Animations API**

```javascript
element.animate(
  [{ left: '0px' }, { left: '400px' }],
  { duration: 2000, easing: 'ease-in-out' }
);
```

**Pros:**
- Powerful JS control
- GPU-accelerated
- Better than RAF for simple animations
- Promise-based
- Playback control (pause, reverse, speed)

**Cons:**
- Newer API (browser support)
- Learning curve
- More complex than CSS
- Not as simple as RAF

**Best for**: Complex, interactive animations with programmatic control

**Performance:**
- FPS: 60
- CPU: Low-medium (5-10%)
- Battery: Low drain

---

**F. Canvas + RAF**

```javascript
function animate() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillRect(x, y, 50, 50);
  x += 2;
  requestAnimationFrame(animate);
}
```

**Pros:**
- Full pixel control
- Great for games
- Complex graphics
- Data visualization

**Cons:**
- High CPU usage
- No GPU acceleration (unless WebGL)
- Manual rendering
- Complex implementation

**Best for**: Games, data visualizations, particle systems

**Performance:**
- FPS: 60-120 (depends on complexity)
- CPU: High (30-60%)
- Battery: Medium-high drain

---

**G. WebGL + RAF**

```javascript
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(render);
}
```

**Pros:**
- GPU-accelerated
- 3D graphics
- High performance for complex scenes
- Best for games

**Cons:**
- Steep learning curve
- Complex setup
- Overkill for simple animations
- Requires shader knowledge

**Best for**: 3D graphics, complex games, GPU compute

**Performance:**
- FPS: 60-120
- CPU: Medium (10-25%)
- Battery: Medium drain

---

#### 3. Detailed Performance Comparison Table

| Method | FPS | CPU | GPU | Battery | BG Tabs | Complexity | Learning Curve | Use Case |
|--------|-----|-----|-----|---------|---------|------------|----------------|----------|
| **setTimeout** | 30-45 | 45-60% | ❌ No | High | Runs | Low | Easy | Delays, polling |
| **setInterval** | 30-50 | 40-55% | ❌ No | High | Runs | Low | Easy | Tickers, polling |
| **requestAnimationFrame** | 60-120 | 8-15% | Partial | Med | Pauses ✅ | Med | Medium | JS animations, canvas, games |
| **CSS animations** | 60 | 2-5% | ✅ Yes | Low | Runs | Low | Easy | Simple animations |
| **CSS transitions** | 60 | 2-5% | ✅ Yes | Low | Runs | Low | Easy | State changes |
| **Web Animations API** | 60 | 5-10% | ✅ Yes | Low | Controllable | Med | Medium | Interactive animations |
| **Canvas + RAF** | 60-120 | 30-60% | Partial | Med-High | Pauses ✅ | High | Hard | Games, data viz |
| **WebGL + RAF** | 60-120 | 10-25% | ✅ Yes | Med | Pauses ✅ | Very High | Very Hard | 3D, complex games |

**Key:**
- **FPS**: Frames per second capability
- **CPU**: Main thread CPU usage
- **GPU**: GPU acceleration
- **Battery**: Battery drain impact
- **BG Tabs**: Behavior in background tabs
- **Complexity**: Implementation complexity
- **Learning Curve**: Time to master

---

#### 4. Decision Matrix: When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANIMATION METHOD DECISION TREE                │
└─────────────────────────────────────────────────────────────────┘

Is it a visual animation?
├─ NO → Use setTimeout/setInterval (delays, polling, scheduling)
│
└─ YES → Is it simple A→B state change?
    ├─ YES → Use CSS transition (hover, active, toggle)
    │
    └─ NO → Is it a predefined keyframe animation?
        ├─ YES → Use CSS animation (loading spinners, simple loops)
        │
        └─ NO → Do you need JavaScript control?
            ├─ YES → Do you need pixel-level control?
            │   ├─ YES → Is it 3D or very complex?
            │   │   ├─ YES → Use WebGL + RAF (3D games, complex graphics)
            │   │   └─ NO → Use Canvas + RAF (2D games, data viz)
            │   │
            │   └─ NO → Do you need advanced playback control?
            │       ├─ YES → Use Web Animations API (pause, reverse, speed)
            │       └─ NO → Use requestAnimationFrame (smooth JS animations)
            │
            └─ NO → Use CSS animation (best performance)
```

**Specific scenarios:**

| Scenario | Best Method | Why |
|----------|-------------|-----|
| **Button hover effect** | CSS transition | GPU-accelerated, simple |
| **Loading spinner** | CSS animation | Declarative, efficient |
| **Smooth scroll** | RAF | JavaScript control, smooth |
| **Countdown timer** | setInterval | Not visual, simple |
| **API polling** | setInterval or recursive setTimeout | Scheduling task |
| **Progress bar** | RAF or Web Animations API | Smooth, controllable |
| **Particle system** | Canvas + RAF | Pixel control needed |
| **3D game** | WebGL + RAF | 3D graphics, GPU |
| **Image carousel** | RAF or CSS | Depends on complexity |
| **Modal fade in** | CSS transition | Simple state change |
| **Parallax scroll** | RAF | Smooth, scroll-synced |
| **Game loop** | RAF with delta time | 60fps, frame-independent |
| **Data visualization** | Canvas + RAF or D3 + RAF | Pixel control, interactivity |

---

#### 5. Cleanup Strategy Decision

**Choose cleanup strategy based on context:**

| Context | Best Strategy | Implementation |
|---------|---------------|----------------|
| **React app** | useEffect cleanup | `return () => clearInterval(id)` |
| **Vue app** | onUnmounted | `onUnmounted(() => clearInterval(id))` |
| **Vanilla JS** | Manual cleanup + registry | Save IDs, clear on destroy |
| **Large app** | Centralized timer service | TimerRegistry class |
| **Library/package** | AbortController pattern | Allow consumers to cancel |
| **Class-based** | Cleanup in destructor | Clear in `destroy()` method |
| **Functional** | Return cleanup function | IIFE with cleanup |

**Example: AbortController pattern for libraries**

```javascript
// ✅ Cancellable API for library users
function startPolling(url, options = {}) {
  const { signal } = options;

  const intervalId = setInterval(async () => {
    if (signal?.aborted) {
      clearInterval(intervalId);
      return;
    }

    await fetch(url);
  }, 5000);

  // Cleanup on abort
  signal?.addEventListener('abort', () => {
    clearInterval(intervalId);
  });

  return intervalId;
}

// Usage
const controller = new AbortController();
startPolling('/api/data', { signal: controller.signal });

// Cancel later
controller.abort();
```

</details>

<details>
<summary><strong>💬 Explain to Junior: Timers and requestAnimationFrame Simplified</strong></summary>

#### Simple Analogy: Timers as Hired Workers

Imagine timers like hiring workers for tasks:

**setTimeout**: "Hey worker, come back in 5 minutes and do this task once."

```javascript
setTimeout(() => {
  console.log('Task done!');
}, 5000);
```

**setInterval**: "Hey worker, come back every 5 minutes and repeat this task forever."

```javascript
setInterval(() => {
  console.log('Recurring task!');
}, 5000);
```

**The problem**: If you don't "fire" the worker (clear the timer), they keep working forever, even when you don't need them anymore. This wastes resources (memory, CPU) and causes problems.

**clearTimeout/clearInterval**: "You're fired! Stop working."

```javascript
const workerId = setTimeout(() => console.log('Task'), 5000);
clearTimeout(workerId); // Fire the worker
```

**requestAnimationFrame**: "Hey animator, work with the screen's refresh cycle to make smooth animations."

```javascript
function animate() {
  // Update animation
  requestAnimationFrame(animate); // Schedule next frame
}
```

---

#### Why Timer Cleanup Matters

**1. Memory leaks from closures:**

```javascript
function startTimer() {
  const hugeArray = new Array(1000000).fill('data'); // 5MB

  setInterval(() => {
    console.log(hugeArray.length); // Closure keeps hugeArray alive
  }, 1000);

  // Timer never cleared → hugeArray never garbage collected
}

startTimer(); // 5MB leaked
startTimer(); // 10MB leaked
startTimer(); // 15MB leaked
```

After calling `startTimer()` 20 times: **100MB+ leaked!**

**2. Accumulation over time:**

Real example:
- User loads page → Component mounts → Timer starts
- User navigates → Component unmounts → **Timer keeps running**
- After 50 page navigations: **50 timers running concurrently**
- Result: Browser becomes slow, laptop fan spins, battery dies

**3. React component example:**

```javascript
// ❌ BAD: Memory leak
function BadComponent() {
  useEffect(() => {
    setInterval(() => {
      console.log('Tick');
    }, 1000);
    // Missing cleanup!
  }, []);

  return <div>Component</div>;
}

// ✅ GOOD: Proper cleanup
function GoodComponent() {
  useEffect(() => {
    const id = setInterval(() => {
      console.log('Tick');
    }, 1000);

    return () => {
      clearInterval(id); // Cleanup on unmount
    };
  }, []);

  return <div>Component</div>;
}
```

---

#### When to Use requestAnimationFrame vs Timers

**Use RAF for:**
- ✅ Animations (moving elements, fading, scaling)
- ✅ Smooth scrolling
- ✅ Game loops
- ✅ Progress indicators
- ✅ Canvas rendering
- ✅ Any visual update

**Why RAF is better for animations:**
1. **60fps smooth**: Synced with screen refresh (16.67ms per frame)
2. **Battery efficient**: Auto-pauses in background tabs
3. **Better performance**: Browser optimizes rendering pipeline

**Use setTimeout/setInterval for:**
- ✅ Delays (wait 5 seconds, then do something)
- ✅ Polling (check API every 10 seconds)
- ✅ Scheduling (send email in 1 hour)
- ✅ Countdown timers
- ❌ **NOT for animations** (janky, inconsistent)

**Comparison:**

```javascript
// ❌ setTimeout for animation (30-40fps, janky)
function animateBad() {
  position += 2;
  element.style.left = position + 'px';
  setTimeout(animateBad, 16); // Try for 60fps, but actually 30-40fps
}

// ✅ RAF for animation (60fps, smooth)
function animateGood() {
  position += 2;
  element.style.left = position + 'px';
  requestAnimationFrame(animateGood); // Perfect 60fps
}
```

---

#### Common Mistakes (and How to Avoid Them)

**Mistake 1: Forgetting to clear timers**

```javascript
// ❌ WRONG
function Component() {
  useEffect(() => {
    setInterval(() => {
      console.log('Tick');
    }, 1000);
    // No cleanup = memory leak!
  }, []);
}

// ✅ CORRECT
function Component() {
  useEffect(() => {
    const id = setInterval(() => {
      console.log('Tick');
    }, 1000);

    return () => clearInterval(id); // Always clean up!
  }, []);
}
```

**Mistake 2: Not saving timer ID**

```javascript
// ❌ WRONG - Can't clear later!
setInterval(() => {
  console.log('Tick');
}, 1000);

// ✅ CORRECT - Save ID
const id = setInterval(() => {
  console.log('Tick');
}, 1000);

// Can clear later
clearInterval(id);
```

**Mistake 3: Using setTimeout for animations**

```javascript
// ❌ WRONG - Janky 30fps animation
function animate() {
  position += 2;
  element.style.left = position + 'px';
  setTimeout(animate, 16);
}

// ✅ CORRECT - Smooth 60fps animation
function animate() {
  position += 2;
  element.style.left = position + 'px';
  requestAnimationFrame(animate);
}
```

**Mistake 4: Not using delta time in RAF**

```javascript
// ❌ WRONG - Animation speed varies on different devices
function animate() {
  position += 2; // 2px per frame (60fps: 120px/s, 30fps: 60px/s)
  requestAnimationFrame(animate);
}

// ✅ CORRECT - Consistent speed on all devices
let lastTime = 0;
function animate(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  const speed = 120; // pixels per second
  position += speed * deltaTime; // Always 120px/s regardless of FPS

  requestAnimationFrame(animate);
}
```

**Mistake 5: RAF running in background tabs**

```javascript
// ❌ WRONG - Wastes CPU in background
function animate() {
  updateAnimation();
  requestAnimationFrame(animate); // Runs even when tab hidden
}

// ✅ CORRECT - Pause when tab hidden
let isVisible = !document.hidden;

document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
  if (isVisible) {
    requestAnimationFrame(animate); // Resume
  }
});

function animate() {
  if (!isVisible) return; // Pause when hidden

  updateAnimation();
  requestAnimationFrame(animate);
}
```

---

#### Interview Answer Template

**Question**: "How do you properly clear timers in JavaScript?"

**Answer**:

"To properly clear timers, you need to save the timer ID when creating the timer, then call `clearTimeout()` or `clearInterval()` when the timer is no longer needed. This is critical to prevent memory leaks, because timers create closures that keep variables in memory.

In React, you use the useEffect cleanup function. When the component unmounts, React automatically runs the cleanup function to clear the timer. For example:

```javascript
useEffect(() => {
  const id = setInterval(() => {
    fetchData();
  }, 5000);

  return () => clearInterval(id); // Cleanup on unmount
}, []);
```

For animations, `requestAnimationFrame` is superior to `setTimeout` or `setInterval` because it synchronizes with the browser's 60fps repaint cycle, automatically pauses in background tabs, and is more power-efficient. You can cancel RAF using `cancelAnimationFrame()`."

---

#### Copy-Paste Utility Hooks

**1. useTimeout hook (React)**

```javascript
import { useEffect, useRef } from 'react';

function useTimeout(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

// Usage
function Component() {
  useTimeout(() => {
    console.log('Runs after 3 seconds');
  }, 3000);
}
```

**2. useInterval hook (React)**

```javascript
import { useEffect, useRef } from 'react';

function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Usage
function Clock() {
  const [time, setTime] = useState(new Date());

  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

**3. useRAF hook for animations (React)**

```javascript
import { useEffect, useRef } from 'react';

function useRAF(callback, interval = 0, deps = []) {
  const savedCallback = useRef(callback);
  const lastUpdateRef = useRef(0);
  const rafIdRef = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let isActive = true;

    function animate(timestamp) {
      if (!isActive) return;

      if (timestamp - lastUpdateRef.current >= interval) {
        savedCallback.current(timestamp);
        lastUpdateRef.current = timestamp;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    }

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [interval, ...deps]);
}

// Usage
function AnimatedBox() {
  const [position, setPosition] = useState(0);

  useRAF(() => {
    setPosition(prev => (prev + 2) % 500);
  }, 16); // ~60fps

  return (
    <div style={{ transform: `translateX(${position}px)` }}>
      Animated!
    </div>
  );
}
```

**4. Timer Registry Service**

```javascript
class TimerService {
  constructor() {
    this.timers = new Map();
    this.nextId = 0;
  }

  setTimeout(callback, delay) {
    const id = this.nextId++;
    const timerId = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);
    this.timers.set(id, { type: 'timeout', timerId });
    return id;
  }

  setInterval(callback, delay) {
    const id = this.nextId++;
    const timerId = setInterval(callback, delay);
    this.timers.set(id, { type: 'interval', timerId });
    return id;
  }

  clear(id) {
    const timer = this.timers.get(id);
    if (!timer) return;

    if (timer.type === 'timeout') {
      clearTimeout(timer.timerId);
    } else {
      clearInterval(timer.timerId);
    }
    this.timers.delete(id);
  }

  clearAll() {
    for (const [id] of this.timers) {
      this.clear(id);
    }
  }
}

export const timerService = new TimerService();

// Usage
import { timerService } from './timer-service';

const id = timerService.setInterval(() => {
  console.log('Tick');
}, 1000);

// Clear later
timerService.clear(id);

// Or clear all on cleanup
timerService.clearAll();
```

**5. Delta Time Calculator**

```javascript
function createDeltaTime() {
  let lastTime = 0;

  return function getDeltaTime(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    return deltaTime;
  };
}

// Usage
const getDeltaTime = createDeltaTime();

function animate(timestamp) {
  const dt = getDeltaTime(timestamp);

  // Move at 100 pixels per second
  position += 100 * dt;

  requestAnimationFrame(animate);
}
```

**6. FPS Counter Utility**

```javascript
class FPSCounter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
  }

  update(timestamp) {
    this.frames++;
    const delta = timestamp - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.lastTime = timestamp;
    }

    return this.fps;
  }
}

// Usage
const fpsCounter = new FPSCounter();

function animate(timestamp) {
  const fps = fpsCounter.update(timestamp);
  console.log(`FPS: ${fps}`);

  requestAnimationFrame(animate);
}
```

---

#### Practice Exercise: Countdown Timer

**Task**: Build a countdown timer component with:
- Start/Pause/Reset buttons
- Display remaining time (MM:SS format)
- Proper cleanup on component unmount
- Prevent memory leaks

**Solution:**

```javascript
import { useState, useEffect, useRef } from 'react';

function CountdownTimer({ initialSeconds = 60 }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/pause effect
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ✅ Cleanup on unmount or isRunning change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialSeconds);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '48px', margin: '20px 0' }}>
        {formatTime(timeLeft)}
      </h1>
      <div>
        {!isRunning ? (
          <button onClick={handleStart} disabled={timeLeft === 0}>
            Start
          </button>
        ) : (
          <button onClick={handlePause}>Pause</button>
        )}
        <button onClick={handleReset} style={{ marginLeft: '10px' }}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default CountdownTimer;
```

**Key learning points:**
1. ✅ Timer ID stored in `useRef` (persists across renders)
2. ✅ Cleanup function clears interval on unmount
3. ✅ Proper state management (timeLeft, isRunning)
4. ✅ Timer stops automatically at 0
5. ✅ Start/Pause/Reset controls

</details>

---

### 📚 Additional Resources

- **MDN: clearTimeout()** - https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout
- **MDN: clearInterval()** - https://developer.mozilla.org/en-US/docs/Web/API/clearInterval
- **MDN: requestAnimationFrame()** - https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
- **MDN: cancelAnimationFrame()** - https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
- **React: useEffect cleanup** - https://react.dev/reference/react/useEffect#my-cleanup-logic-runs-even-though-my-component-didnt-unmount
- **Browser Rendering Pipeline** - https://developers.google.com/web/fundamentals/performance/rendering
- **Paul Irish: requestAnimationFrame for Smart Animating** - https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
- **Page Visibility API** - https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- **Web Animations API** - https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- **Understanding Delta Time** - https://drewcampbell92.medium.com/understanding-delta-time-b53bf4781a03

---

**End of File**
