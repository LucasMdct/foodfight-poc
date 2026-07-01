# FoodFight POC - Testing Guide

## 🧪 Teste Spec-Driven

Estrutura de testes baseada em **Behavior-Driven Development** (BDD), alinhada com a spec original.

---

## 📋 Test Coverage Map

```
┌─ Performance Tests (Quantitative)
│  ├─ FPS Stability (60fps ≥ 55)
│  ├─ Memory Growth (< 50MB in 2min)
│  └─ Swipe Latency (< 100ms)
│
├─ Gameplay Tests (Functional)
│  ├─ Lane Transitions (smooth, ~100ms)
│  ├─ Obstacle Spawn (regular intervals)
│  ├─ Collision Detection (accurate)
│  └─ Collision Feedback (visual flicker)
│
├─ Input Tests (Interaction)
│  ├─ Swipe UP/DOWN (recognized)
│  ├─ Debouncing (100ms)
│  └─ Edge cases (boundaries)
│
└─ Compatibility Tests (Platform)
   ├─ iOS 15+ (runs/compiles)
   └─ Android 11+ (runs/compiles)
```

---

## 🏃 Phase 1: Baseline Testing (5 min)

**Objetivo:** Validar app inicia sem crashes e FPS é stable em repouso.

### Setup
```bash
1. Ligar device em Airplane Mode
2. Abrir Xcode Instruments (iOS) ou Android Profiler
3. Abrir app
4. Deixar rodar SEM interação
```

### Checks

```
□ App initializes without crash
□ Canvas renders black (or lane backgrounds)
□ FPS value appears on screen
□ FPS stays ≥ 55 for full 5 min
□ Memory heap stable (< 1MB growth/min)
```

### Pass/Fail Criteria

| Métrica | Target | Pass | Fail |
|---------|--------|------|------|
| **FPS stable** | ≥55 | 55-60 | <55 ❌ |
| **Memory** | Stable | +0-5MB | +20MB ❌ |
| **Crashes** | 0 | 0 | Any ❌ |

### Data Collection

```
📊 Anotar:
- FPS médio: _____ 
- FPS mín: _____
- Memory start: _____ MB
- Memory end: _____ MB
- Crashes: _____ (0?)
```

---

## 🎮 Phase 2: Gameplay Testing (10 min)

**Objetivo:** Validar mecânicas core (swipe, obstacles, colisão).

### Subtest 2.1: Swipe Input

```
GIVEN: Hero on middle lane
WHEN: Swipe UP
THEN:
  ✓ Hero moves to top lane
  ✓ Transition animation runs (~100ms)
  ✓ No jank observed
```

**Repetir:**
- ✅ Middle → Top (swipe up)
- ✅ Middle → Bottom (swipe down)
- ✅ Top → Middle (swipe down)
- ✅ Bottom → Middle (swipe up)
- ✅ Top → Top (swipe up) → no-op ✓

### Subtest 2.2: Swipe Latency

Medir tempo entre swipe gesture e hero position update.

```bash
# Method 1 (Manual):
1. Record video of swipe
2. Count frames from gesture end to hero move start
3. latency_ms = frame_count * (1000/60)

# Method 2 (Instrumented):
Add timestamp logging:
  gesture.onEnd -> log Date.now()
  setHeroLane trigger -> log Date.now()
  Diff = latency
```

**Target:** < 100ms  
**Acceptable:** 50-100ms  
**Fail:** > 100ms ❌

### Subtest 2.3: Obstacles

```
GIVEN: Game running
WHEN: Observar por 30 segundos
THEN:
  ✓ Obstacles spawn from right edge
  ✓ Obstacles move left at consistent speed
  ✓ Obstacles disappear at left edge
  ✓ No obstacles accumulate off-screen
```

### Subtest 2.4: Collision Detection

```
GIVEN: Hero on middle lane, obstacles spawning
WHEN: Allow obstacle to reach hero lane
THEN:
  ✓ Collision detected when rects overlap
  ✓ Hero flickers (opacity 1 → 0.3 → 1...)
  ✓ Flicker lasts ~1.5s
  ✓ Health decreases by 25
  ✓ Game Over when health = 0
```

### Subtest 2.5: Collision Accuracy

Test false positives/negatives:

```
CASE 1: Hero in middle lane, obstacle in top lane
THEN: No collision ✓

CASE 2: Hero narrowly avoids obstacle (lane change)
THEN: No collision ✓

CASE 3: Hero rect overlaps obstacle rect
THEN: Collision detected ✓

CASE 4: Hero rect just touches obstacle edge
THEN: Collision (AABB includes edges) ✓
```

### Pass/Fail Criteria

| Teste | Target | Pass | Fail |
|-------|--------|------|------|
| **Swipe response** | <100ms | 50-100ms | >100ms ❌ |
| **Obstacle spawn** | Regular | <1s jitter | >1s ❌ |
| **Collision accuracy** | No false +/- | ✓ | Falsos ❌ |
| **Visual feedback** | Clear flicker | Visible | Imperceptível ❌ |

---

## 📊 Phase 3: Performance Stress Test (5 min)

**Objetivo:** Validar performance sob stress (muitos obstacles, longa duração).

### Procedure

```
1. Abrir app
2. Deixar rodar até game over (mínimo 2 min)
3. Monitorar continuamente:
   - FPS (deve ser ≥ 55)
   - Memory (deve crescer <20MB)
   - Crashes (deve ser 0)
4. Swipe ocasionalmente (1-2x por segundo)
```

### Metrics

```
⏱️ Duration: Start time = _____, End time = _____
📊 FPS: avg = _____, min = _____, max = _____
💾 Memory: start = _____ MB, end = _____ MB, growth = _____
🔴 Crashes: _____
```

### Pass Criteria

```
✅ PASS: FPS ≥ 55 for full duration
✅ PASS: Memory growth < 50MB
✅ PASS: Zero crashes
✅ PASS: No UI lag/jank

❌ FAIL: Any metric outside criteria
```

---

## 🔧 Phase 4: Profiling Deep Dive

Se algum teste falhar, usar profilers para diagnosticar.

### iOS (Xcode Instruments)

```bash
1. Xcode → Product → Profile → select "Metal System Trace"
2. Abrir app
3. Deixar rodar 30 segundos
4. Parar recording

📊 Analizar:
├─ GPU %: deve ser < 85%
├─ Frame times: deve ser ~16.67ms (16ms)
├─ Missing frames: deve ser 0
└─ CPU cores: máximo 2-3 cores occupied
```

### Android Profiler

```bash
1. Android Studio → Profiler tab
2. Abrir app
3. Graficar por 30 segundos

📊 Analizar:
├─ Memory: growth rate < 5MB/min
├─ CPU: < 80% utilization
├─ GPU: < 85% utilization
└─ Frames: verde (no drops)
```

### React DevTools (Chrome)

```bash
expo start
# Shake device → Open Debugger → Profiler tab

📊 Analizar:
├─ Component renders: minimal re-renders
├─ Component timing: <50ms per render
└─ Hook performance: useGameLoop < 5ms
```

---

## 🧬 Phase 5: Unit/Integration Tests

### Unit Test: CollisionSystem

```typescript
// File: __tests__/CollisionSystem.test.ts
describe('CollisionSystem', () => {
  it('detects AABB intersection', () => {
    const collision = new CollisionSystem();
    
    const hero = { 
      lane: 'middle', 
      x: 50, 
      y: 0, 
      isColliding: false 
    };
    
    const obstacles = [{
      id: '1',
      lane: 'middle',
      x: 55,  // Overlaps with hero
      y: 0,
      width: 40,
      height: 60,
    }];
    
    const result = collision.checkCollision(
      hero, 
      obstacles, 
      { top: 100, middle: 300, bottom: 500 }
    );
    
    expect(result).toBe('1');  // Collision detected
  });

  it('ignores obstacles in different lanes', () => {
    // hero in 'middle', obstacle in 'top'
    // Expected: no collision
  });

  it('returns null when no collision', () => {
    // hero and obstacle far apart
    // Expected: null
  });
});
```

### Unit Test: ObstacleSystem

```typescript
describe('ObstacleSystem', () => {
  it('spawns obstacle at interval', () => {
    const system = new ObstacleSystem();
    
    // Wait for spawn interval
    setTimeout(() => {
      const result = system.update([], 0, 400);
      expect(result.toAdd).toHaveLength(1);
      expect(result.toAdd[0].x).toBe(400);  // Right edge
    }, 900);
  });

  it('moves obstacles left', () => {
    const system = new ObstacleSystem();
    const obstacle = { id: '1', x: 200, ... };
    
    const result = system.update([obstacle], 1.0, 400);  // 1 second
    
    expect(result.updated[0].x).toBe(200 - 300);  // 300px/s
  });

  it('removes off-screen obstacles', () => {
    const system = new ObstacleSystem();
    const offScreen = { id: '1', x: -50, width: 40, ... };
    
    const result = system.update([offScreen], 0, 400);
    
    expect(result.toRemove).toContain('1');
  });
});
```

### Integration Test: Game Loop

```typescript
describe('Game Loop', () => {
  it('maintains 60fps baseline', async () => {
    const store = useGameStore();
    
    // Run game loop for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const fps = store.state.fps;
    expect(fps).toBeGreaterThanOrEqual(55);
  });

  it('handles collision in real time', async () => {
    // Spawn obstacle deliberately in hero path
    // Verify collision triggers hitHero
    // Verify health decreases
  });
});
```

---

## 📋 Test Checklist Template

### Device: ____________  
### Date: ____________  
### Tester: ____________

#### Phase 1: Baseline (5 min) ✓

```
□ No crashes on startup
□ FPS ≥ 55 whole duration
□ Memory growth < 5MB
```

**Result:** ✅ PASS / ❌ FAIL

#### Phase 2: Gameplay (10 min) ✓

```
□ Swipe UP: middle → top ✓
□ Swipe DOWN: middle → bottom ✓
□ Swipe latency < 100ms ✓
□ Obstacles spawn regularly ✓
□ Obstacles move left smoothly ✓
□ Collision feedback visible ✓
□ No false positives/negatives ✓
```

**Result:** ✅ PASS / ❌ FAIL

#### Phase 3: Stress (5 min) ✓

```
□ FPS ≥ 55 during gameplay
□ Memory growth < 50MB
□ Zero crashes
□ No jank/lag observed
```

**Result:** ✅ PASS / ❌ FAIL

#### Phase 4: Profiling (if needed) ✓

```
GPU %: _____ (target < 85%)
Memory growth/min: _____ (target < 5MB)
Frame times: _____ ms (target ~16.67ms)
```

**Result:** ✅ PASS / ❌ FAIL

#### Overall Result

```
✅ ALL PASS → POC APPROVED
   (Prosseguir para full game build)

❌ ANY FAIL → ADJUST STACK
   (Retune constants e re-test)
```

---

## 🎓 Test Methodology

### Given-When-Then (BDD)

Cada test case segue formato:

```
GIVEN: [initial state]
WHEN: [action taken]
THEN: [expected outcome]
```

Example:
```
GIVEN: Game is running, hero on middle lane, obstacle approaching
WHEN: Obstacle reaches hero position
THEN: Collision is detected and health decreases
```

### Test Automation

Usar **jest** com **react-native-testing-library**:

```bash
npm install --save-dev jest @testing-library/react-native

# Run tests
npm test

# Watch mode
npm test -- --watch
```

---

## 📊 Resultado Final

Preencher após completar todas as fases:

```markdown
## Test Results Summary

**Device:** iPhone 12 (iOS 15.7)
**Date:** 2026-06-27
**Duration:** 30 min

### Phase Results

| Phase | Result | Notes |
|-------|--------|-------|
| Baseline | ✅ PASS | FPS 58-60, no memory growth |
| Gameplay | ✅ PASS | All mechanics working, latency 45ms |
| Stress | ✅ PASS | 5 min gameplay, FPS stable, +12MB mem |
| Profiling | ✅ PASS | GPU 65%, no frame drops |

### Overall Decision

✅ **APPROVED** - Stack is validated. Proceed to full game build.

### Deviations

None - all criteria met or exceeded.
```

---

**Últimas actualizações:** Junho 2026  
**Versão:** 1.0.0-poc
