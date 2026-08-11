# Game Over Modal & Play Again Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate the generic Play Again button from the absolute bottom of the screen into the central Game Over modal, adding premium aesthetics.

**Architecture:** Update `GameCanvasProps` to accept an `onReset` function. Remove the bottom button container in `App.tsx` and pass `handleReset` down. In `GameCanvas.tsx`, style the Game Over container overlay, modal card, and add a custom `<TouchableOpacity>` button with shadows, padding, and bold text.

**Tech Stack:** React Native, React Native Gesture Handler, Zustand.

## Global Constraints
- Target platform: iOS 15+ and Android 11+ via Expo SDK 56.
- Styling: Use vanilla stylesheet styles (React Native `StyleSheet.create`).
- Maintain project structure and clean separation of state from rendering.

---

### Task 1: Update App.tsx

**Files:**
- Modify: `App.tsx:20-54`

**Interfaces:**
- Consumes: [useGameStore](file:///home/lucas/GameProjects/foodfight-poc/src/store/gameStore.ts)
- Produces: None

- [ ] **Step 1: Modify App.tsx to pass the reset handler to GameCanvas and remove the bottom button**

We will update [App.tsx](file:///home/lucas/GameProjects/foodfight-poc/App.tsx) by removing the absolute positioned reset button view and passing `handleReset` to `GameCanvas` as `onReset`.

Replace lines 30-54 with:
```typescript
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
  return (
    <GestureHandlerRootView style={styles.container}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}
```
And remove `resetButtonContainer` from `styles` (lines 11-17).

- [ ] **Step 2: Verify git status and check for any syntax/type errors**

Run: `git diff App.tsx`
Expected: Diff shows removal of `resetButtonContainer` styling and the bottom button, plus passing `onReset={handleReset}` to `GameCanvas`.

- [ ] **Step 3: Commit changes**

```bash
git add App.tsx
git commit -m "refactor: remove bottom play again button from App.tsx"
```

---

### Task 2: Refactor GameCanvas.tsx

**Files:**
- Modify: `src/components/GameCanvas.tsx:1-131`

**Interfaces:**
- Consumes: `onReset` callback passed as prop.
- Produces: Visual modal card and styled button centered on Game Over.

- [ ] **Step 1: Modify GameCanvas.tsx with updated styles, imports, and modal layout**

We will edit [GameCanvas.tsx](file:///home/lucas/GameProjects/foodfight-poc/src/components/GameCanvas.tsx) to:
1. Update `GameCanvasProps` interface to include `onReset: () => void`.
2. Import `TouchableOpacity` and `StyleSheet` from `'react-native'`.
3. Add a stylesheet with premium aesthetics for the Game Over card.
4. Replace the inline styled modal view and centralize the "Play Again" button inside it.

Replace contents of [GameCanvas.tsx](file:///home/lucas/GameProjects/foodfight-poc/src/components/GameCanvas.tsx) with the updated styled modal and props:

```typescript
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { useGameStore } from '../store/gameStore';
import { GAME_CONSTANTS } from '../types/constants';
import { RunnerEngine } from '../hooks/useRunnerEngine';

interface GameCanvasProps {
  engine: RunnerEngine;
  screenWidth: number;
  screenHeight: number;
  onReset: () => void;
}

export const GameCanvas = ({ engine, screenWidth, screenHeight, onReset }: GameCanvasProps) => {
  const { state } = useGameStore();
  const laneHeight = screenHeight / 3;

  const laneTops = useMemo(
    () => [0, laneHeight, laneHeight * 2],
    [laneHeight]
  );

  return (
    <View style={{ flex: 1, backgroundColor: GAME_CONSTANTS.COLORS.CANVAS_BG }}>
      <Canvas style={{ flex: 1 }}>
        {/* 3 fixed lanes */}
        {laneTops.map((top, i) => (
          <Rect
            key={`lane-bg-${i}`}
            x={0}
            y={top}
            width={screenWidth}
            height={laneHeight}
            color={i % 2 === 0 ? 'rgba(230, 244, 254, 0.3)' : 'rgba(255, 255, 255, 0.5)'}
          />
        ))}
        {laneTops.slice(1).map((top, i) => (
          <Rect
            key={`lane-border-${i}`}
            x={0}
            y={top}
            width={screenWidth}
            height={2}
            color="rgba(200, 200, 200, 0.5)"
          />
        ))}

        {/* Hero — position/opacity driven by shared values (UI thread) */}
        <Rect
          x={engine.heroX}
          y={engine.heroY}
          width={GAME_CONSTANTS.HERO_WIDTH}
          height={GAME_CONSTANTS.HERO_HEIGHT}
          color={GAME_CONSTANTS.COLORS.HERO}
          opacity={engine.heroOpacity}
        />

        {/* Obstacle pool — fixed set of Rects, animated via shared values */}
        {Array.from({ length: engine.poolSize }, (_, i) => (
          <Rect
            key={`obs-${i}`}
            x={engine.obstacleX[i]}
            y={engine.obstacleY[i]}
            width={GAME_CONSTANTS.OBSTACLE_WIDTH}
            height={GAME_CONSTANTS.OBSTACLE_HEIGHT}
            color={GAME_CONSTANTS.COLORS.OBSTACLE}
            opacity={engine.obstacleActive[i]}
          />
        ))}
      </Canvas>

      {/* HUD (discrete state only — no per-frame re-render) */}
      <View
        style={{
          position: 'absolute',
          top: 70,
          left: 20,
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
            Health: {state.health}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: state.fps >= 55 ? '#4CAF50' : '#FF9800',
            }}
          >
            FPS: {Math.round(state.fps)}
          </Text>
        </View>
      </View>

      {/* Game Over screen with integrated Play Again button */}
      {state.isGameOver && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: screenWidth * 0.8 }]}>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.scoreSubtitle}>Final Score: {state.score}</Text>
            <TouchableOpacity
              onPress={onReset}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text style={styles.buttonText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 320,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scoreSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
```

- [ ] **Step 2: Verify git status and check for any syntax/type errors**

Run: `git diff src/components/GameCanvas.tsx`
Expected: Diff shows proper TypeScript props integration and stylesheet addition with updated layout.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/GameCanvas.tsx
git commit -m "feat: design and integrate modern Play Again button inside Game Over modal"
```
