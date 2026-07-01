# FoodFight POC - Guia de Implementação Detalhado

## 🎯 Objetivo do Documento

Guia técnico **passo-a-passo** para entender, executar e estender a implementação da POC. Destina-se a:
- Developers trabalhando nas features iniciais
- QA preparando test plan
- Tech leads revisando decisões arquiteturais

---

## 📦 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│              App.tsx (Root)                          │
│         ├─ GestureHandlerRootView                   │
│         └─ SwipeHandler                             │
├─────────────────────────────────────────────────────┤
│         GameCanvas (Render Layer)                    │
│         ├─ Canvas (Skia)                            │
│         ├─ useGameLoop Hook                         │
│         └─ FPS Overlay                              │
├─────────────────────────────────────────────────────┤
│         Zustand Store (State)                        │
│         ├─ state (game entities)                    │
│         └─ actions (mutations)                       │
├─────────────────────────────────────────────────────┤
│         Game Systems (Logic)                         │
│         ├─ ObstacleSystem                           │
│         ├─ CollisionSystem                          │
│         └─ FpsCounter                               │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Game Loop Flow Diagram

```
useFrameCallback (60Hz)
  │
  ├─→ Calculate deltaTime (elapsed since last frame)
  │
  ├─→ [LOGIC PHASE]
  │   ├─ ObstacleSystem.update()  → move/spawn/cleanup obstacles
  │   ├─ CollisionSystem.check()  → detect collisions
  │   ├─ FpsCounter.update()      → track FPS
  │   └─ Store.update()           → commit state changes
  │
  └─→ [RENDER PHASE] (automatic via React)
      └─ Canvas re-renders with new state
         ├─ Lane backgrounds
         ├─ Hero (with opacity if colliding)
         └─ Obstacles

      Then repeat next frame
```

**Timing:** 60fps = 16.67ms per frame
- Logic: ~5-10ms
- Render: ~3-5ms
- Buffer: ~2-3ms

---

## 🎮 State Management (Zustand)

### Store Structure

```typescript
useGameStore = {
  state: {
    hero: { lane, x, y, isColliding, collisionStartTime },
    obstacles: Obstacle[],
    score: number,
    health: number,
    isGameOver: boolean,
    fps: number,
    gameStartTime: number,
  },
  
  actions: {
    setHeroLane(lane)        // Update hero lane
    addObstacle(obstacle)     // Add new obstacle
    removeObstacle(id)        // Remove by id
    updateFps(fps)           // Update FPS counter
    hitHero()                // Damage hero
    setColliding(bool, time) // Set collision state
    incrementScore(points)   // Add to score
    reset()                  // Reset to initial
  }
}
```

### Subscription Pattern

Components subscrever apenas as partes do state que usam:

```typescript
const { state } = useGameStore();  // Full state (simples, ok)

// Better - selective subscription (advanced):
const fps = useGameStore((s) => s.state.fps);
const hero = useGameStore((s) => s.state.hero);
```

---

## 🏃 Fase 1: Core Game Loop

### Implementação

**File:** `src/hooks/useGameLoop.ts`

```typescript
useFrameCallback(({ timestamp }) => {
  // 1. Calculate time delta
  const deltaTime = (now - lastTime) / 1000;  // seconds
  
  // 2. Update all systems
  const result = obstacleSystem.update(
    state.obstacles, 
    deltaTime, 
    screenWidth
  );
  
  // 3. Commit to store
  result.toAdd.forEach(obs => actions.addObstacle(obs));
  result.toRemove.forEach(id => actions.removeObstacle(id));
  
  // 4. Check collisions
  const hit = collisionSystem.checkCollision(
    state.hero,
    result.updated,
    LANE_Y_POSITIONS
  );
  if (hit) actions.hitHero();
});
```

### Key Points

✅ `useFrameCallback` é sincronizado com vsync do Skia  
✅ `deltaTime` em segundos para cálculos consistentes  
✅ Lógica rápida (<10ms) para deixar margin para render  
✅ Zustand updates síncronos (não async)

### Testing

```typescript
// Test: FPS counter updates
// Expected: fps value increments every 60 frames, then resets

// Test: Delta time consistency
// Expected: deltaTime ≈ 16.67ms em 60fps device

// Test: No memory accumulation
// Expected: Memory cresce <1MB in 10 segundos
```

---

## 🎨 Fase 2: Rendering (GameCanvas)

### Componente Principal

**File:** `src/components/GameCanvas.tsx`

```typescript
const GameCanvas = () => {
  const { state } = useGameStore();
  useGameLoop(screenWidth);  // Run game loop
  
  return (
    <Canvas>
      {/* Render lanes */}
      {lanes.map((lane, i) => (
        <Rect x={0} y={laneY[i]} width={w} height={h} />
      ))}
      
      {/* Render hero (with collision effect) */}
      <Rect 
        {...heroProps}
        opacity={heroOpacity}  // Flickers if colliding
      />
      
      {/* Render all obstacles */}
      {state.obstacles.map(obs => (
        <Rect {...obsProps} />
      ))}
    </Canvas>
  );
};
```

### Collision Flicker Effect

```typescript
// Calculate opacity based on collision state
const heroOpacity = useMemo(() => {
  if (!state.hero.isColliding) return 1;
  
  // Flicker 4 times over 1500ms
  const flickerPeriod = 1500 / (4 * 2);  // 4 blinks
  const phase = Math.floor(
    (elapsed / flickerPeriod) % 2
  );
  
  return phase === 0 ? 1 : 0.3;  // Blink
}, [state.hero.isColliding, elapsed]);
```

### HUD Overlay

Fixo no canto (position: absolute, z-index: 10):

```
┌─────────────────────────────┐
│ Score: 1250      FPS: 59 ✅ │
│ Health: 50       Obs: 7     │
└─────────────────────────────┘
```

---

## 🎯 Fase 3: Input (Swipe Gestures)

### Gesture Detection

**File:** `src/components/SwipeHandler.tsx`

```typescript
const swipeGesture = Gesture.Fling()
  .direction(Directions.UP | Directions.DOWN)
  .onEnd((event) => {
    if (event.direction === Directions.UP) {
      // Move hero up (top -> middle, or middle -> top)
    } else {
      // Move hero down
    }
  });
```

### Lane Transition

```typescript
// 1. Get current lane index
const currentIdx = ['top', 'middle', 'bottom'].indexOf(hero.lane);

// 2. Validate new lane is valid
if (swipeUp && currentIdx > 0) {
  newLane = lanes[currentIdx - 1];
} else if (swipeDown && currentIdx < 2) {
  newLane = lanes[currentIdx + 1];
}

// 3. Update store (Reanimated handles animation)
actions.setHeroLane(newLane);
```

### Debouncing

```typescript
// Evitar múltiplos swipes simultâneos
const lastSwipeTime = useRef(0);
const DEBOUNCE_MS = 100;

if (Date.now() - lastSwipeTime.current < DEBOUNCE_MS) {
  return;  // Ignore
}
lastSwipeTime.current = Date.now();
```

### Testing

```
✅ Swipe up while at middle → move to top
✅ Swipe up while at top → no-op (debounce)
✅ Swipe down while at bottom → no-op
✅ Rapid swipes → ignored (debounce 100ms)
✅ Swipe during collision → still works
```

---

## 🎪 Fase 4: Obstacles (Spawn & Movement)

### ObstacleSystem

**File:** `src/systems/ObstacleSystem.ts`

```typescript
class ObstacleSystem {
  update(obstacles, deltaTime, screenWidth) {
    const now = Date.now();
    const toAdd = [];
    const toRemove = [];
    
    // 1. Spawn new obstacle?
    if (
      now - lastSpawnTime > SPAWN_INTERVAL &&
      obstacles.length < MAX_OBSTACLES
    ) {
      const lane = randomLane(['top', 'middle', 'bottom']);
      toAdd.push({
        id: `obs-${counter++}`,
        lane,
        x: screenWidth,  // Spawn from right edge
        y: 0,
        width: 40,
        height: 60,
      });
      lastSpawnTime = now;
    }
    
    // 2. Move left
    const updated = obstacles.map(obs => ({
      ...obs,
      x: obs.x - SPEED * deltaTime,  // SPEED = 300px/s
    }));
    
    // 3. Remove off-screen
    updated.forEach(obs => {
      if (obs.x + obs.width < 0) {
        toRemove.push(obs.id);
      }
    });
    
    return { updated, toAdd, toRemove };
  }
}
```

### Constants (Adjustable for Tuning)

```typescript
OBSTACLE_WIDTH: 40,                   // Visual size
OBSTACLE_HEIGHT: 60,                  // Visual size
OBSTACLE_SPEED: 300,                  // px/s (↑ harder)
OBSTACLE_SPAWN_INTERVAL: 800,         // ms (↓ more obstacles)
OBSTACLE_MAX_ACTIVE: 15,              // Prevent too many
```

### Memory Management

Critical: remove obstacles **immediately** after off-screen:

```typescript
// Bad (memory leak):
obstacles.filter(o => o.x >= -50)  // Doesn't actually remove

// Good (cleanup):
if (obs.x + obs.width < 0) {
  toRemove.push(obs.id);  // Mark for deletion
  actions.removeObstacle(obs.id);  // Commit
}
```

---

## 💥 Fase 5: Collision Detection

### CollisionSystem

**File:** `src/systems/CollisionSystem.ts`

```typescript
class CollisionSystem {
  checkCollision(hero, obstacles, lanePositions) {
    const heroHitbox = {
      x: hero.x + PADDING,      // Inset 10px
      y: lanePos[hero.lane] + PADDING,
      width: HERO_WIDTH - PADDING*2,
      height: HERO_HEIGHT - PADDING*2,
    };
    
    for (const obs of obstacles) {
      // Only check same lane
      if (obs.lane !== hero.lane) continue;
      
      const obsHitbox = {
        x: obs.x,
        y: lanePos[obs.lane],
        width: obs.width,
        height: obs.height,
      };
      
      if (rectsIntersect(heroHitbox, obsHitbox)) {
        return obs.id;  // Collision!
      }
    }
    return null;
  }
  
  private rectsIntersect(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
```

### AABB (Axis-Aligned Bounding Box)

Visual:

```
   Hero Hitbox        Obstacle
   ┌──────────┐       ┌──────────┐
   │  (x,y)   │       │  (x,y)   │
   │ w=30 h=40│       │ w=40 h=60│
   └──────────┘       └──────────┘
   
   If ANY overlap → COLLISION
```

### Hitbox Padding

```typescript
HERO_HITBOX_PADDING = 10;  // inset 10px from edges

// Why? Visuais rigidity:
// - Raw hitbox = hero rect bounds (too strict)
// - Padded hitbox = feels fairer to player
// - Trade-off: Adjust if collisions feel wrong
```

### Testing

```
✅ Hero rect and obstacle overlap → hit detected
✅ Hero rect and obstacle don't overlap → no hit
✅ Hero in different lane than obstacle → no hit
✅ Multiple obstacles, hit one → correct one detected
```

---

## ⏱️ Fase 6: FPS Monitoring

### FpsCounter

**File:** `src/systems/FpsCounter.ts`

```typescript
class FpsCounter {
  frameCount = 0;
  lastCheckTime = Date.now();
  
  update() {
    this.frameCount++;
    const now = Date.now();
    
    // Every 1000ms, calculate FPS
    if (now - this.lastCheckTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;  // Reset
      this.lastCheckTime = now;
    }
    
    return this.currentFps;
  }
}
```

### Display in HUD

```typescript
<Text style={{
  fontSize: 12,
  fontWeight: '700',
  color: state.fps >= 55 ? '#4CAF50' : '#FF9800'
}}>
  FPS: {Math.round(state.fps)}
</Text>
```

Color coding:
- 🟢 ≥55: Good
- 🟡 50-54: Borderline
- 🔴 <50: Bad

---

## 🔍 Debugging Workflow

### 1. Enable Skia Debugger

```typescript
<Canvas debugger={true}>
  {/* Shows bounds, hitboxes, etc */}
</Canvas>
```

### 2. Console Logging

```typescript
// In useGameLoop
console.log(`Frame ${frameCount}: obstacles=${obstacles.length}, fps=${fps}`);
```

### 3. Reanimated DevTools

```bash
expo start
# Shake device → Open Debugger → Reanimated tab
```

### 4. Xcode Profiler (iOS)

```
Xcode → Product → Profile → Metal System Trace
├─ Check GPU %
├─ Check Frame times (should be 16.67ms)
└─ Check CPU cores used
```

### 5. Android Profiler

```bash
Android Studio → Profiler
├─ Memory tab → check heap growth
├─ CPU tab → check if > 80%
└─ GPU tab → check if > 85%
```

---

## 🚀 Performance Tuning Checklist

Se FPS <55:

| Ação | Impact | Effort |
|------|--------|--------|
| Reduzir `OBSTACLE_MAX_ACTIVE` 15→10 | High | Low |
| Aumentar `OBSTACLE_SPAWN_INTERVAL` 800→1200 | High | Low |
| Reduzir `OBSTACLE_SPEED` 300→250 | Medium | Low |
| Simplificar lane backgrounds (remove gradients) | Medium | Low |
| Use `shouldComponentUpdate` em Canvas | Medium | Medium |
| Profile com Chrome DevTools | Debug | Medium |
| Upgrade React Native version | Potential | High |

---

## 📋 Test Matrix

### Unit Tests

```typescript
// CollisionSystem
it('detects AABB intersection', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  const b = { x: 5, y: 5, w: 10, h: 10 };
  expect(rectsIntersect(a, b)).toBe(true);
});

// ObstacleSystem
it('spawns obstacle at interval', () => {
  const result = system.update([], 1, 400);
  expect(result.toAdd).toHaveLength(1);
});
```

### Integration Tests

```typescript
// Game Loop
it('maintains 60fps for 10 seconds', async () => {
  // Run game loop for 10 seconds
  // Measure fps array
  // Expect average >= 55
});

// Collision + UI
it('shows collision feedback after hit', async () => {
  // Trigger collision
  // Check hero.isColliding = true
  // Check opacity animation starts
  // Wait 1500ms
  // Check opacity back to 1
});
```

---

## 🎓 Learning Resources

### Skia Rendering
- [Canvas API](https://shopify.github.io/react-native-skia/docs/canvas/)
- [Animations](https://shopify.github.io/react-native-skia/docs/animations/hooks/)

### Reanimated
- [Shared Values](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/shared-values)
- [useAnimatedStyle](https://docs.swmansion.com/react-native-reanimated/docs/api/hooks/useAnimatedStyle)

### Gesture Handler
- [Fling Gesture](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/fling-gesture)
- [Direction Constants](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/index#directionsenums)

### Game Dev Concepts
- [Fixed Timestep Loop](https://gameprogrammingpatterns.com/game-loop.html)
- [Entity-Component-System](https://gameprogrammingpatterns.com/entity-component-system.html)

---

## 🔗 Quick Navigation

- [POC_GUIDE.md](./POC_GUIDE.md) - Full spec-driven guide (Fases 1-6)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical decisions
- [README.md](./README.md) - Quick start

---

**Última atualização:** Junho 2026  
**Versão:** 1.0.0
