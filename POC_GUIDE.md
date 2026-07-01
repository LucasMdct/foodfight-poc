# FoodFight Kids - POC Runner Guide

**Status:** Spec-Driven Development (SDD) - Brainstorming → Planning → Implementation → Verification

**Objetivo:** Validar React Native Skia em 60fps mid-range devices antes de full game build.

---

## 📋 Fase 1: Brainstorming & Decomposição

### Requisitos Coletados (da Spec)

**Core Loop:**
- Game loop rodando a 60fps via `useFrameCallback`
- Delta time estável e independente do device frame rate
- FPS logger em tempo real

**Visual Elements:**
- 3 lanes fixas (top, middle, bottom)
- Hero placeholder (retângulo) na lane do meio
- Transição entre lanes com animação suave (~100ms)

**Input:**
- Swipe vertical → mudança de lane
- Latência de resposta < 100ms percebida

**Game Mechanics:**
- Obstacles spawnam à direita em intervalos regulares
- Movement: direita → esquerda a velocidade constante
- Cleanup: destruir objetos fora da tela

**Collision:**
- Hitbox simplificada (rect menor que sprite)
- Feedback visual ao colidir (piscar 1.5s)
- Sem falsos positivos/negativos óbvios

**Acceptance Criteria:**
- ✅ 60fps estável em mid-range device
- ✅ Swipe latency < 100ms
- ✅ Sem memory leak após 2 min gameplay
- ✅ iOS 15+ e Android 11+

---

## 📐 Fase 2: Arquitetura & Task Planning

### Decisões de Arquitetura

**State Management:** Zustand + Reanimated shared values
- Game state (score, lives, game over)
- Hero lane position (animated)
- Obstacles array

**Rendering:** React Native Skia Canvas
- `Canvas` component wraps entire game
- `useFrameCallback` handles game loop
- Shapes (Rect, Circle) for placeholders

**Animations:** Reanimated 3
- Lane transitions (Easing.inOut)
- Hero collision flicker
- Obstacle movement

**Input:** react-native-gesture-handler
- `GestureDetector` wraps game canvas
- Vertical swipe → lane change

---

## 🛠️ Fase 3: Task Decomposition (TDD Style)

### Sprint 1: Foundation

- [ ] **Task 1.1** Install missing deps (gesture-handler)
- [ ] **Task 1.2** Create project file structure
- [ ] **Task 1.3** Setup Zustand store (game state)
- [ ] **Task 1.4** Implement base Canvas + game loop scaffold

**Acceptance:** Black canvas renders, console logs stable fps

---

### Sprint 2: Visual & Input

- [ ] **Task 2.1** Render 3 lanes (visual reference only)
- [ ] **Task 2.2** Add hero placeholder (rect) on middle lane
- [ ] **Task 2.3** Implement lane transition animation
- [ ] **Task 2.4** Wire swipe gesture → lane change
- [ ] **Task 2.5** Test swipe latency on device

**Acceptance:** Hero moves between lanes smoothly on swipe

---

### Sprint 3: Game Mechanics

- [ ] **Task 3.1** Create Obstacle entity type + spawn system
- [ ] **Task 3.2** Implement obstacle movement (right → left)
- [ ] **Task 3.3** Obstacle cleanup when off-screen
- [ ] **Task 3.4** Memory monitoring (log heap usage)

**Acceptance:** Obstacles spawn, move, disappear. No memory growth.

---

### Sprint 4: Collision & Polish

- [ ] **Task 4.1** Implement collision detection (hero ↔ obstacle)
- [ ] **Task 4.2** Add collision feedback (hero flicker 1.5s)
- [ ] **Task 4.3** FPS counter widget overlay
- [ ] **Task 4.4** Device performance benchmarking

**Acceptance:** 60fps maintained. Collisions accurate. Latency < 100ms.

---

## 🚀 Fase 4: Implementação Passo-a-Passo

### Step 1: Setup Inicial

```bash
# Instalar dependências faltantes
npm install react-native-gesture-handler react-native-screens

# Criar estrutura de pastas
mkdir -p src/{components,hooks,store,types,utils}
```

---

### Step 2: Definir Types

**`src/types/game.ts`**
```typescript
export type Lane = 'top' | 'middle' | 'bottom';

export interface Hero {
  lane: Lane;
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  lane: Lane;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  hero: Hero;
  obstacles: Obstacle[];
  score: number;
  isGameOver: boolean;
  fps: number;
  health: number;
}
```

---

### Step 3: State Management

**`src/store/gameStore.ts`**
```typescript
import { create } from 'zustand';
import { GameState, Lane, Obstacle } from '../types/game';

export const useGameStore = create<{
  state: GameState;
  actions: {
    setHeroLane: (lane: Lane) => void;
    addObstacle: (obstacle: Obstacle) => void;
    removeObstacle: (id: string) => void;
    updateFps: (fps: number) => void;
    hitHero: () => void;
  };
}>((set) => ({
  state: {
    hero: { lane: 'middle', x: 50, y: 0 },
    obstacles: [],
    score: 0,
    isGameOver: false,
    fps: 60,
    health: 100,
  },
  actions: {
    setHeroLane: (lane) => set((s) => ({
      state: { ...s.state, hero: { ...s.state.hero, lane } }
    })),
    addObstacle: (obstacle) => set((s) => ({
      state: { ...s.state, obstacles: [...s.state.obstacles, obstacle] }
    })),
    removeObstacle: (id) => set((s) => ({
      state: {
        ...s.state,
        obstacles: s.state.obstacles.filter((o) => o.id !== id),
      },
    })),
    updateFps: (fps) => set((s) => ({
      state: { ...s.state, fps }
    })),
    hitHero: () => set((s) => ({
      state: { ...s.state, health: Math.max(0, s.state.health - 25) }
    })),
  },
}));
```

---

### Step 4: Game Loop Hook

**`src/hooks/useGameLoop.ts`**
```typescript
import { useFrameCallback } from '@shopify/react-native-skia';
import { useGameStore } from '../store/gameStore';
import { useSharedValue } from 'react-native-reanimated';

let lastTime = Date.now();
let frameCount = 0;
let fpsCheckTime = Date.now();

export const useGameLoop = () => {
  const { state, actions } = useGameStore();

  useFrameCallback(({ timestamp }) => {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    frameCount++;

    // Update FPS every 1 second
    if (now - fpsCheckTime >= 1000) {
      actions.updateFps(frameCount);
      frameCount = 0;
      fpsCheckTime = now;
    }

    // Game logic here
    // - Move obstacles
    // - Check collisions
    // - Update animations
  });
};
```

---

### Step 5: Canvas Component

**`src/components/GameCanvas.tsx`**
```typescript
import React from 'react';
import { View } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { useGameStore } from '../store/gameStore';

const LANE_POSITIONS = {
  top: 100,
  middle: 300,
  bottom: 500,
};

const LANE_HEIGHT = 150;

export const GameCanvas = () => {
  const { state } = useGameStore();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Canvas style={{ flex: 1 }}>
        {/* Render lanes (visual guides) */}
        {Object.values(LANE_POSITIONS).map((y, i) => (
          <Rect
            key={`lane-${i}`}
            x={0}
            y={y}
            width={400}
            height={LANE_HEIGHT}
            color="rgba(200, 200, 200, 0.2)"
          />
        ))}

        {/* Render hero */}
        <Rect
          x={state.hero.x}
          y={LANE_POSITIONS[state.hero.lane]}
          width={50}
          height={60}
          color="#FF6B6B"
        />

        {/* Render obstacles */}
        {state.obstacles.map((obs) => (
          <Rect
            key={obs.id}
            x={obs.x}
            y={LANE_POSITIONS[obs.lane]}
            width={obs.width}
            height={obs.height}
            color="#4ECDC4"
          />
        ))}
      </Canvas>

      {/* FPS display */}
      <View style={{ position: 'absolute', top: 20, right: 20 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
          FPS: {Math.round(state.fps)}
        </Text>
      </View>
    </View>
  );
};
```

---

### Step 6: Swipe Input Handler

**`src/components/SwipeHandler.tsx`**
```typescript
import React from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useGameStore } from '../store/gameStore';

export const SwipeHandler = ({ children }: { children: React.ReactNode }) => {
  const { state, actions } = useGameStore();

  const swipe = Gesture.Fling()
    .direction(Directions.UP | Directions.DOWN)
    .onEnd((event) => {
      const currentLaneIndex = ['top', 'middle', 'bottom'].indexOf(state.hero.lane);
      let newLane = state.hero.lane;

      if (event.direction === Directions.DOWN && currentLaneIndex < 2) {
        newLane = ['top', 'middle', 'bottom'][currentLaneIndex + 1] as Lane;
      } else if (event.direction === Directions.UP && currentLaneIndex > 0) {
        newLane = ['top', 'middle', 'bottom'][currentLaneIndex - 1] as Lane;
      }

      actions.setHeroLane(newLane);
    });

  return (
    <GestureDetector gesture={swipe}>
      {children}
    </GestureDetector>
  );
};
```

---

### Step 7: Obstacle System

**`src/systems/ObstacleSystem.ts`**
```typescript
import { Obstacle } from '../types/game';

const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 60;
const OBSTACLE_SPEED = 300; // pixels per second
const SPAWN_INTERVAL = 800; // ms

export class ObstacleSystem {
  private lastSpawnTime = 0;
  private obstacleCounter = 0;

  update(
    obstacles: Obstacle[],
    deltaTime: number,
    screenWidth: number
  ): {
    updated: Obstacle[];
    toRemove: string[];
    toAdd: Obstacle[];
  } {
    const now = Date.now();
    const toAdd: Obstacle[] = [];
    const toRemove: string[] = [];

    // Spawn new obstacle
    if (now - this.lastSpawnTime > SPAWN_INTERVAL) {
      const lanes = ['top', 'middle', 'bottom'] as const;
      const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

      toAdd.push({
        id: `obs-${this.obstacleCounter++}`,
        lane: randomLane,
        x: screenWidth,
        y: 0,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
      });

      this.lastSpawnTime = now;
    }

    // Move obstacles
    const updated = obstacles.map((obs) => ({
      ...obs,
      x: obs.x - OBSTACLE_SPEED * deltaTime,
    }));

    // Remove off-screen
    updated.forEach((obs) => {
      if (obs.x + obs.width < 0) {
        toRemove.push(obs.id);
      }
    });

    return {
      updated: updated.filter((o) => !toRemove.includes(o.id)),
      toRemove,
      toAdd,
    };
  }
}
```

---

### Step 8: Collision Detection

**`src/systems/CollisionSystem.ts`**
```typescript
import { Hero, Obstacle } from '../types/game';

export class CollisionSystem {
  checkCollision(hero: Hero, obstacles: Obstacle[], laneY: Record<string, number>) {
    const heroHitbox = {
      x: hero.x + 10,
      y: laneY[hero.lane] + 10,
      width: 30,
      height: 40,
    };

    for (const obs of obstacles) {
      const obsHitbox = {
        x: obs.x,
        y: laneY[obs.lane],
        width: obs.width,
        height: obs.height,
      };

      if (this.rectsIntersect(heroHitbox, obsHitbox)) {
        return obs.id;
      }
    }

    return null;
  }

  private rectsIntersect(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
```

---

## 📊 Fase 5: Verificação & Testes

### Checklist de Verificação

**Performance:**
- [ ] Executar em iPhone 12/13 (mid-range) → verificar 60fps estável
- [ ] Executar em Android mid-range → verificar 60fps estável
- [ ] Usar Profiler do React Native para memory usage
- [ ] Testar por 2-3 minutos → verificar sem memory leak

**Gameplay:**
- [ ] Swipe up/down → hero muda de lane (< 100ms perceptível)
- [ ] Obstacles spawnam regularmente
- [ ] Collision feedback (flicker) dispara corretamente
- [ ] Game loop não trava durante colisão

**Compatibility:**
- [ ] iOS 15+ compila e roda
- [ ] Android 11+ compila e roda

---

## 🔍 Fase 6: Troubleshooting

### Problema: FPS não bate 60

**Diagnosticar:**
```
1. Abrir Chrome DevTools → Performance tab
2. Verificar se há "jank" (frames > 16.67ms)
3. Checar se é rendering ou logic que trava
```

**Soluções:**
- Reduzir número de obstacles simultâneos
- Usar Skia's `SkiaView` ao invés de Canvas direto
- Profile com Reanimated DevTools

---

### Problema: Swipe latency alto

**Diagnosticar:**
- Adicionar timestamp ao gesture handler
- Log: `gesture start time` vs `hero position update time`

**Soluções:**
- Usar `runOnJS` ao invés de setting state direto
- Considerar usar shared values da Reanimated

---

### Problema: Memory leak

**Diagnosticar:**
```
adb shell dumpsys meminfo com.foodfight.poc | head -20
```

**Soluções:**
- Verificar cleanup do ObstacleSystem
- Ensure Zustand store não acumula state antigo
- Usar `useCallback` em callbacks do game loop

---

## 📈 Resultado Final

Após concluir tudo, preencher:

- **FPS Medido:** _____ fps em _____ device
- **Latência Swipe:** _____ ms
- **Dispositivos Testados:** iOS _____, Android _____
- **Memory Growth (2 min):** _____ MB
- **Decisão Final:** ✅ **Aprovado** / ❌ **Reprovado - Ajustar stack**

---

## 🎯 Próximos Passos (Se Aprovado)

1. Integrar sprites reais via spritesheets
2. Adicionar som effects e background music
3. Implementar sistema de vidas/pontuação completo
4. UI polida (menu, pause, game over screen)
5. Backend multiplayer (opcional)

---

**Criado com:** Spec-Driven Development + Brainstorming + Task Planning  
**Última atualização:** Junho 2026
