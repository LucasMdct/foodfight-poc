# Dopamine-Generating Skia Game Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-juice, animated loading screen using Shopify Skia and Reanimated that runs immediately when the app launches and elastically bursts into the main game.

**Architecture:** Create `GameLoader.tsx` containing Skia Canvas graphics (spring-pulsing circles, rotating dashed paths, and a color-gradient progress bar) driven by Reanimated shared values. Integrate the loader into `App.tsx` using a state flag, unmounting it when loading finishes.

**Tech Stack:** React Native, React Native Skia, React Native Reanimated.

## Global Constraints
- Target platform: iOS 15+ and Android 11+ via Expo SDK 56.
- Styling: Use vanilla stylesheet styles (React Native `StyleSheet.create`).
- Maintain project structure and clean separation of state from rendering.

---

### Task 1: Create GameLoader Component

**Files:**
- Create: `src/components/GameLoader.tsx`

**Interfaces:**
- Consumes: `onFinished: () => void` callback
- Produces: `<GameLoader>` visual component

- [ ] **Step 1: Create GameLoader.tsx file with Skia animations and layouts**

Create the new file [GameLoader.tsx](file:///home/lucas/GameProjects/foodfight-poc/src/components/GameLoader.tsx) with the following content:

```typescript
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Rect, Group, LinearGradient, Paint, DashPathEffect, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface GameLoaderProps {
  onFinished: () => void;
}

export const GameLoader = ({ onFinished }: GameLoaderProps) => {
  const { width, height } = useWindowDimensions();

  // Shared values for loading animations
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(0.95);
  const rotation = useSharedValue(0);
  const loaderOpacity = useSharedValue(1);
  const burstScale = useSharedValue(1);

  // Position coordinates
  const cx = width / 2;
  const cy = height / 2 - 40;
  const radius = 60;

  // Track progress text percentage
  const progressText = useDerivedValue(() => {
    return `${Math.round(progress.value)}%`;
  });

  // Animated styles for text overlay
  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: loaderOpacity.value,
      transform: [
        { scale: withSpring(1 + (progress.value / 200), { damping: 15 }) }
      ],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: loaderOpacity.value,
    };
  });

  // Start animations on mount
  useEffect(() => {
    // 1. Spring pulse animation (juicy heartbeat)
    pulseScale.value = withRepeat(
      withSpring(1.05, { damping: 4, stiffness: 90 }),
      -1,
      true
    );

    // 2. Continuous linear rotation of dashed ring
    rotation.value = withRepeat(
      withTiming(360, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );

    // 3. Satisfying staggered progress timing (Dopamine load curve)
    progress.value = withTiming(35, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }, (finished35) => {
      if (!finished35) return;
      progress.value = withTiming(55, { duration: 450 }, (finished55) => {
        if (!finished55) return;
        progress.value = withTiming(85, { duration: 800 }, (finished85) => {
          if (!finished85) return;
          progress.value = withTiming(100, { duration: 350 }, (finished100) => {
            if (!finished100) return;
            
            // At 100%, trigger final burst pop and fadeout
            burstScale.value = withSpring(4.5, { damping: 10, stiffness: 50 }, (burstFinished) => {
              if (burstFinished) {
                runOnJS(onFinished)();
              }
            });
            loaderOpacity.value = withTiming(0, { duration: 350 });
          });
        });
      });
    });
  }, []);

  // Compute animated progress bar width
  const barWidth = useDerivedValue(() => {
    return (width * 0.7) * (progress.value / 100);
  });

  // Scale calculations for the central portal group
  const portalTransform = useDerivedValue(() => {
    const scale = pulseScale.value * burstScale.value;
    return [{ scale }];
  });

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background dark overlay */}
        <Rect x={0} y={0} width={width} height={height} color="#121212" />

        {/* Central portal items (pulses & bursts) */}
        <Group transform={portalTransform} origin={{ x: cx, y: cy }}>
          {/* Inner core */}
          <Circle cx={cx} cy={cy} r={radius * 0.75} color="#4ECDC4" opacity={0.15} />
          <Circle cx={cx} cy={cy} r={radius * 0.5} color="#FF6B6B" opacity={0.8} />
          
          {/* Rotating segment/dashed path */}
          <Group transform={[{ rotate: rotation }]} origin={{ x: cx, y: cy }}>
            <Circle cx={cx} cy={cy} r={radius * 0.95} color="#4ECDC4">
              <Paint style="stroke" strokeWidth={3}>
                <DashPathEffect intervals={[12, 12]} />
              </Paint>
            </Circle>
          </Group>
        </Group>

        {/* Progress Bar Track */}
        <Rect
          x={width * 0.15}
          y={cy + radius + 70}
          width={width * 0.7}
          height={6}
          rx={3}
          ry={3}
          color="rgba(255, 255, 255, 0.1)"
        />

        {/* Bouncy Progress Fill with Color Gradient */}
        <Rect
          x={width * 0.15}
          y={cy + radius + 70}
          width={barWidth}
          height={6}
          rx={3}
          ry={3}
        >
          <LinearGradient
            start={vec(width * 0.15, 0)}
            end={vec(width * 0.85, 0)}
            colors={['#4ECDC4', '#FF6B6B']}
          />
        </Rect>
      </Canvas>

      {/* Interactive Text Overlay */}
      <Animated.View style={[styles.textOverlay, textStyle, { top: cy + radius + 100 }]}>
        <Text style={styles.loadingText}>LOADING</Text>
        <Text style={styles.percentageText}>{progressText.value}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    zIndex: 9999,
  },
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 4,
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
```

- [ ] **Step 2: Verify git status and check for any syntax/type errors**

Run: `git status`
Expected: `src/components/GameLoader.tsx` is untracked.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/GameLoader.tsx
git commit -m "feat: implement Dopamine Skia GameLoader component"
```

---

### Task 2: Integrate GameLoader in App.tsx

**Files:**
- Modify: `App.tsx:20-54`

**Interfaces:**
- Consumes: `<GameLoader>` visual component
- Produces: Loading states at app mount

- [ ] **Step 1: Modify App.tsx to display GameLoader on startup**

We will update [App.tsx](file:///home/lucas/GameProjects/foodfight-poc/App.tsx) to:
1. Import `useState` from `'react'`.
2. Import the `GameLoader` component.
3. Manage an `isLoading` boolean state.
4. Render `GameLoader` if `isLoading` is true, otherwise render the main `GameScreen` wrapper.

Replace lines 20-54 in [App.tsx](file:///home/lucas/GameProjects/foodfight-poc/App.tsx):

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameCanvas } from './src/components/GameCanvas';
import { SwipeHandler } from './src/components/SwipeHandler';
import { useGameStore } from './src/store/gameStore';
import { useRunnerEngine } from './src/hooks/useRunnerEngine';
import { GameLoader } from './src/components/GameLoader';

const styles = StyleSheet.create({
  container: { flex: 1 },
});

function GameScreen() {
  const { width, height } = useWindowDimensions();
  const actions = useGameStore((s) => s.actions);
  const engine = useRunnerEngine(width, height);

  const handleReset = () => {
    engine.reset();
    actions.reset();
  };

  return (
    <View style={styles.container}>
      <SwipeHandler onMoveLane={engine.moveLane}>
        <View style={styles.container}>
          <GameCanvas
            engine={engine}
            screenWidth={width}
            screenHeight={height}
            onReset={handleReset}
          />
        </View>
      </SwipeHandler>
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <GestureHandlerRootView style={styles.container}>
      {isLoading ? (
        <GameLoader onFinished={() => setIsLoading(false)} />
      ) : (
        <GameScreen />
      )}
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Verify git status and check for any syntax/type errors**

Run: `git diff App.tsx`
Expected: Diff shows state addition, loading view check, and GameLoader import.

- [ ] **Step 3: Commit changes**

```bash
git add App.tsx
git commit -m "feat: integrate GameLoader in App component for startup loading screen"
```
