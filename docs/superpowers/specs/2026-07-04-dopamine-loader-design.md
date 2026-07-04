# Design Spec: Dopamine-Generating Skia Game Loader

## 1. Context & Objectives
To improve the user experience upon launching the game, we want to replace the initial white blank screen with a high-juice, satisfying, and visually appealing loading screen using **Shopify Skia** and **React Native Reanimated**.

**Objectives:**
* Mask the initial JS/Native loading overhead with an engaging, interactive loading screen.
* Generate "dopamine" through juicy, satisfying animations: spring physics, elastic squashing/stretching, vibrant shifting gradients, and a satisfying "burst" transition when loading finishes.
* Ensure maximum performance (60 FPS rendering) using Skia declarative drawings driven by Reanimated shared values on the UI thread.

---

## 2. Visual & Animation Design ("Dopamine Elements")

### A. The Core Energy Ring (Satisfying Pulsing Circle)
* A central circular element representing a loading portal.
* Built using multiple concentric circles:
  - An outer glowing ring with low opacity.
  - A middle ring drawn as a dashed/segmented path that slowly rotates.
  - A central solid circle that pulses with a spring-like rhythm (using `withRepeat` and `withSpring` animations).

### B. The Springy Gradient Progress Bar
* Instead of a static linear filling animation, the progress bar will have a "bouncy" spring feel:
  - The fill width is animated with a custom ease-in-out curve (fast acceleration, springy settling).
  - The bar's color transitions from a cool mint/cyan (`#4ECDC4`) to a hot coral/red (`#FF6B6B`) as the progress reaches 100%.
  - The bar has a glowing backing shadow.

### C. The Loading Text (Interactive Shimmer)
* The text displaying `LOADING... XX%` will pulse and scale slightly, matching the progress bar's spring-back effect.

### D. The 100% Transition "Burst" (The Hype Finish)
* When the progress bar hits 100%:
  - The central circle performs a quick, elastic "pop" scale-up (scaling to `3.5` to visually "swallow" the screen) using a spring effect.
  - The opacity of the loader fades out simultaneously.
  - Once the transition ends, the loader component is unmounted and the main game starts instantly.

---

## 3. Component Architecture & Props

### A. src/components/GameLoader.tsx (New Component)
* **Props:**
  - `onFinished: () => void` (triggered when the 100% burst animation completes).
* **Internals:**
  - `progress`: Shared value representing the percentage (0 to 100).
  - `pulseScale`: Shared value driving the elastic scale of the central circle (0.9 to 1.1).
  - `rotateDegrees`: Shared value driving the rotation of the dashed ring (0 to 360).
  - `loaderOpacity`: Shared value driving the final screen fade-out (1 to 0).
  - `burstScale`: Shared value driving the transition burst scale (1 to 4).

### B. App.tsx
* Control mounting of `GameLoader` and `GameScreen` using a state hook:
```typescript
const [isLoading, setIsLoading] = useState(true);
```
* Render the loader first, transitioning on `onFinished`:
```typescript
{isLoading ? (
  <GameLoader onFinished={() => setIsLoading(false)} />
) : (
  <GameScreen />
)}
```

---

## 4. Verification Plan
* Verify the project compiles successfully.
* Verify that the app opens with a dark-themed, animated loading screen immediately.
* Check that:
  1. The central ring pulses, rotates, and glows.
  2. The progress bar fills up with variable spring speed, shifting color from mint/cyan to coral/red.
  3. The percentage text updates in sync.
  4. When hitting 100%, the circle elastically bursts and the screen fades out smoothly.
  5. The main gameplay starts immediately after without lags or stuttering.
