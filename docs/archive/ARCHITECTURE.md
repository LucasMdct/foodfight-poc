# FoodFight POC - Arquitetura Técnica

## 🏗️ Visão Geral

Sistema de jogo 2D implementado com **React Native Skia** para validar performance em 60fps. Arquitetura dividida em camadas claras com responsabilidades bem definidas.

```
┌─────────────────────────────────────┐
│         App Root (App.tsx)          │
├─────────────────────────────────────┤
│    SwipeHandler (Gesture Input)     │
├─────────────────────────────────────┤
│    GameCanvas (Skia Rendering)      │
├─────────────────────────────────────┤
│    Game Loop (useFrameCallback)     │
├─────────────────────────────────────┤
│  Store (Zustand) ← Systems (Logic)  │
└─────────────────────────────────────┘
```

---

## 📦 Estrutura de Pastas

```
src/
├── components/
│   ├── GameCanvas.tsx          # Renderização principal (Skia)
│   ├── SwipeHandler.tsx        # Gesture input wrapper
│   ├── HeroSprite.tsx          # Hero render component
│   ├── ObstacleSprite.tsx      # Obstacle render component
│   ├── LaneGrid.tsx            # Lane visual reference
│   └── FpsOverlay.tsx          # FPS counter
├── hooks/
│   ├── useGameLoop.ts          # Game loop via useFrameCallback
│   ├── useCollision.ts         # Collision detection hook
│   └── useMemoryMonitor.ts     # Memory profiling
├── store/
│   ├── gameStore.ts            # Zustand store (state)
│   └── types.ts                # Store types
├── types/
│   ├── game.ts                 # Game entity types
│   └── constants.ts            # Game constants
├── systems/
│   ├── ObstacleSystem.ts       # Obstacle spawn/movement
│   ├── CollisionSystem.ts      # Collision logic
│   ├── AnimationSystem.ts      # Lane transition animations
│   └── FpsCounter.ts           # FPS calculation
├── utils/
│   ├── geometry.ts             # Rect intersection, etc
│   ├── random.ts               # Weighted random picking
│   └── performance.ts          # Perf monitoring helpers
└── App.tsx                     # Root component
```

---

## 🧩 Componentes Principais

### 1. **GameCanvas**

Componente que encapsula toda renderização Skia.

```typescript
// Responsabilidades:
- Criar Canvas com dimensões corretas
- Renderizar lanes (visual guides)
- Renderizar hero (interpolated position)
- Renderizar obstacles (batch render)
- Renderizar collision feedback (flicker effect)
- Display FPS overlay
```

**Dados de Entrada:**
- Game state (hero position, obstacles array, fps)
- Animated values (lane interpolation)

**Output:**
- Skia Canvas visual

---

### 2. **SwipeHandler**

Wrapper que captura gesto de swipe vertical.

```typescript
// Responsabilidades:
- Detectar swipe UP/DOWN via GestureHandler
- Validar transição (não pode swipe fora dos limites)
- Disparar setHeroLane na store
- Medir e log latência

// Implementação:
- React Native Gesture Handler `Fling` gesture
- Direction filter (UP | DOWN)
- Debounce (evitar múltiplos swipes simultâneos)
```

---

### 3. **Game Loop Hook** (`useGameLoop`)

```typescript
// Responsabilidades:
- Executar lógica a cada frame via useFrameCallback
- Atualizar sistema de obstáculos
- Checar colisões
- Atualizar animações
- Medir FPS

// Timing:
- useFrameCallback roda em cada vsync do device
- Calcular deltaTime em ms
- Passar deltaTime para sistemas
```

---

## 🎮 Game State (Zustand Store)

```typescript
GameState = {
  hero: {
    lane: 'middle' | 'top' | 'bottom',
    x: number (% of screen width),
    y: number (calculated from lane)
  },
  obstacles: Obstacle[], // array de obstáculos ativos
  score: number,
  health: number (0-100),
  isGameOver: boolean,
  fps: number (updated every 1s),
  collisionActive: boolean, // para feedback visual
}

Actions = {
  setHeroLane(lane),
  addObstacle(obstacle),
  removeObstacle(id),
  updateFps(fps),
  hitHero(),
  reset(),
}
```

---

## 📊 Systems (Lógica de Jogo)

### **ObstacleSystem**

Gerencia spawn, movimento e destruição de obstáculos.

```typescript
update(obstacles[], deltaTime): {
  - Verificar spawn interval
  - Se tempo passou: criar novo obstacle em posição aleatória (right edge)
  - Mover todos obstáculos: x -= SPEED * deltaTime
  - Remover obstáculos fora da tela (x + width < 0)
  - Retornar obstacles atualizados
}

Constants:
- OBSTACLE_WIDTH: 40px
- OBSTACLE_HEIGHT: 60px
- OBSTACLE_SPEED: 300px/s (ajustável)
- SPAWN_INTERVAL: 800ms
```

---

### **CollisionSystem**

Detecta colisões entre hero e obstáculos.

```typescript
checkCollision(hero, obstacles[], lanePositions): obstacleId | null {
  - Criar hitbox do hero (inset 10px de padding)
  - Para cada obstacle:
    - Verificar AABB intersection (Axis-Aligned Bounding Box)
    - Se colidir: retornar obstacle.id
  - Se nenhuma colisão: retornar null
}

Hitbox Logic:
- Hero: inset 10px em todos lados (evita borda rígida)
- Obstacle: hitbox cheio
- Apenas checa obstacles na mesma lane que hero
```

---

### **AnimationSystem**

Gerencia transições suaves entre lanes.

```typescript
laneTransition(fromLane, toLane, duration: 100ms) {
  - Usar Reanimated shared values + withTiming
  - Easing: Easing.inOut(Easing.ease)
  - Animar hero.y de posição inicial → final
}

collisionFlicker(duration: 1500ms) {
  - Animar opacity: 1 → 0.3 → 1 (pulse 3-4x)
  - Usar Reanimated para não bloquear game loop
}
```

---

### **FpsCounter**

Calcula FPS a cada segundo.

```typescript
update() {
  - Incrementar frameCount em cada call
  - A cada 1000ms:
    - FPS = frameCount
    - Reset frameCount = 0
    - Update store.fps
}
```

---

## 🔄 Game Loop Timing

```
useFrameCallback (60Hz nominal)
  ↓
dt = now - lastTime (ms → s)
lastTime = now
  ↓
[LOGIC PHASE]
  ObstacleSystem.update(obstacles, dt)
  CollisionSystem.checkCollision(hero, obstacles)
  AnimationSystem.update(dt)
  FpsCounter.update()
  ↓
[RENDER PHASE]
  Skia Canvas.drawRect(...) (automatic via React)
  ↓
(repeat next frame)
```

---

## 🎯 Key Design Decisions

### 1. **Zustand ao invés de Context**
- **Por quê:** Performance. Zustand não causa re-renders de todo component tree
- **Trade-off:** Menos integrado com React suspense, mas ok para games

### 2. **useFrameCallback ao invés de requestAnimationFrame**
- **Por quê:** Skia já usa vsync, useFrameCallback sincroniza com Skia's rendering
- **Trade-off:** Skia-specific, não é standard Web API

### 3. **Shared Values (Reanimated) para Animações**
- **Por quê:** Animations rodam em thread nativo, não bloqueiam JS
- **Trade-off:** Curva de aprendizado maior, mas necessário para 60fps

### 4. **Collision AABB ao invés de Circle/Polygon**
- **Por quê:** Mais simples, mais rápido, suficiente para obstáculos retangulares
- **Trade-off:** Menos preciso, mas aceitável para POC

### 5. **Obstacles como objetos simples ao invés de Entities com Behaviors**
- **Por quê:** Reduz complexidade, data-driven é mais simples
- **Trade-off:** Difícil escalar para múltiplos tipos de obstacle

---

## ⚡ Performance Considerations

### Memory
- Obstacles destruídos ao sair da tela (não acumulam)
- Game state é pequeno (alguns KBs)
- Zustand store não duplica state

### Rendering
- Skia Canvas é muito eficiente
- Batch rendering (todos os rects em uma passada)
- Sem re-renders desnecessários (Zustand subscriptions)

### Input Latency
- Gesture handler é nativo (< 1ms de overhead)
- Zustand updates são síncronos
- Reanimated animations runOnUI (< 1ms de overhead)

### CPU/GPU
- 60fps target = 16.67ms budget por frame
- Current logic é O(n) onde n = número de obstacles (~5-10)
- Room para 3-5x mais obstacles antes de throttling

---

## 🧪 Testes (Spec-Driven)

### Unit Tests

**CollisionSystem**
```typescript
// Given: hero at (50, 200) e obstacle at (55, 205)
// When: checkCollision is called
// Then: return obstacle.id
```

**ObstacleSystem**
```typescript
// Given: 0 obstacles, spawn interval passed
// When: update() is called
// Then: return 1 new obstacle
```

### Integration Tests

**Game Loop**
```typescript
// Given: game running
// When: 100 frames pass
// Then: FPS logged ≈ 60
```

**Swipe → Lane Change**
```typescript
// Given: hero on middle lane
// When: swipe UP gesture detected
// Then: hero animates to top lane in < 100ms
```

---

## 🔧 Debugging Tips

### Enable Skia Debug View
```typescript
<Canvas debugger={true}>
  {/* visualize bounds, etc */}
</Canvas>
```

### Log Game State
```typescript
useEffect(() => {
  console.log(useGameStore.getState().state);
}, [/* interval */]);
```

### Measure Frame Time
```typescript
let frameStart = Date.now();
useFrameCallback(() => {
  const frameTime = Date.now() - frameStart;
  console.log(`Frame: ${frameTime}ms`);
  frameStart = Date.now();
});
```

### React DevTools Profiler
- Check for unnecessary re-renders
- Profile expensive components

---

## 📚 Recursos & Referências

- [Skia useFrameCallback](https://shopify.github.io/react-native-skia/docs/animations/hooks/)
- [Reanimated 3 Shared Values](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/shared-values)
- [Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Zustand Store Pattern](https://github.com/pmndrs/zustand)

---

**Documentação gerada via Spec-Driven Development**  
**Última atualização:** Junho 2026
