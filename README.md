# FoodFight Kids - React Native Skia POC

🎮 **Proof of Concept** validar que React Native Skia consegue rodar o game loop principal a **60fps em mid-range devices** (iOS e Android).

**Status:** 🚀 Pronto para testes

---

## 📖 Documentação Completa

Este projeto inclui documentação detalhada estruturada via **Spec-Driven Development**:

| Documento | Descrição |
|-----------|-----------|
| **[POC_GUIDE.md](./POC_GUIDE.md)** | Guia passo-a-passo completo (Fases 1-6) com implementação detalhada |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Arquitetura técnica, decisões de design, game loop |
| **[README.md](./README.md)** | Este arquivo - quick start e visão geral |

---

## 🎯 Objetivo

Validar 3 requisitos críticos **antes** de construir o jogo completo:

✅ **Performance:** 60fps estável em mid-range devices  
✅ **Input Latency:** Swipe response < 100ms  
✅ **Memory:** Sem leaks após 2+ min gameplay

---

## 🚀 Quick Start

### 1. Instalação de Dependências

```bash
# Instalar todas as dependências (incluindo gesture handler)
npm install

# Para iOS, instalar pods
cd ios && pod install && cd ..
```

**Dependências principais:**
- `@shopify/react-native-skia` - Renderização 2D de alta performance
- `react-native-reanimated` - Animações no thread nativo
- `react-native-gesture-handler` - Detecção de gestos (swipe)
- `zustand` - State management leve

---

### 2. Rodar no Dispositivo

#### iOS (Real Device)
```bash
npm run ios
# ou
expo start --ios
```

#### Android (Real Device)
```bash
npm run android
# ou
expo start --android
```

#### Web (Testes Rápidos - não é válido para perf validation)
```bash
npm run web
```

---

## 🎮 Como Jogar

| Ação | Resultado |
|------|-----------|
| **Swipe UP** | Move hero para cima (lane) |
| **Swipe DOWN** | Move hero para baixo (lane) |
| **Evite obstáculos** | Venha de encontro reduz health |
| **Health = 0** | Game Over |

---

## 📊 Aceitar/Rejeitar Critérios

### ✅ Aprovação (POC success)

```
Todos os 5 critérios: VERDE
├─ FPS ≥ 55 em device mid-range
├─ Swipe latency < 100ms
├─ Sem falsos positivos em colisão
├─ Memory stable (< 50MB growth em 2 min)
└─ iOS 15+ e Android 11+ funcionam
```

### ❌ Rejeição (Stack adjustment needed)

```
Qualquer critério VERMELHO:
├─ FPS < 55? → Reduzir complexidade visual
├─ Latency alto? → Profiler gesture handler
├─ Memory leak? → Verificar obstacle cleanup
└─ Crash? → Check native bridge
```

---

## 🔍 Debugging & Profiling

### Verificar FPS em Tempo Real

A tela mostra **FPS** no canto superior direito:
- **Verde (≥55):** OK ✅
- **Amarelo (50-54):** Borderline ⚠️
- **Vermelho (<50):** Falha ❌

### iOS Profiler

```bash
# No Xcode
Xcode → Product → Profile → select "Metal System Trace"
# Verificar GPU % e frame times
```

### Android Profiler

```bash
# Via Android Studio
Android Studio → Profiler → Memory/CPU
adb shell dumpsys meminfo com.foodfight.poc
```

### React Native DevTools (Reanimated)

```bash
# Durante expo start, pressionar 'i' para iOS ou 'a' para Android
# Depois: shake device → Open Debugger
```

---

## 📁 Estrutura do Projeto

```
foodfight-poc/
├── src/
│   ├── components/
│   │   ├── GameCanvas.tsx      # Renderização Skia
│   │   └── SwipeHandler.tsx    # Input gestures
│   ├── hooks/
│   │   └── useGameLoop.ts      # Game loop principal
│   ├── store/
│   │   └── gameStore.ts        # Zustand state management
│   ├── systems/
│   │   ├── ObstacleSystem.ts   # Spawn/movimento obstáculos
│   │   ├── CollisionSystem.ts  # Detecção colisão
│   │   └── FpsCounter.ts       # FPS measurement
│   └── types/
│       ├── game.ts             # Game entity types
│       └── constants.ts        # Game constants
├── App.tsx                      # Root component
├── index.ts                     # Expo entry point
├── POC_GUIDE.md                # Full spec-driven guide
├── ARCHITECTURE.md             # Technical architecture
└── README.md                   # This file
```

---

## 🔧 Configurações Ajustáveis

Todos em `src/types/constants.ts`:

```typescript
GAME_CONSTANTS = {
  // Performance
  OBSTACLE_SPEED: 300,          // px/s (↓ = easier, ↑ = harder)
  OBSTACLE_SPAWN_INTERVAL: 800, // ms (↓ = more obstacles)
  
  // Timing
  HERO_LANE_TRANSITION_DURATION: 100, // ms
  COLLISION_FLICKER_DURATION: 1500,   // ms
  
  // Hitbox sensitivity
  HERO_HITBOX_PADDING: 10,      // px (↓ = stricter collision)
};
```

**Dica:** Se FPS cair para <55, reduzir `OBSTACLE_MAX_ACTIVE` ou aumentar `OBSTACLE_SPAWN_INTERVAL`.

---

## 📈 Metricas Esperadas (Mid-Range Device)

| Metrica | Target | Good | Acceptable | Bad |
|---------|--------|------|-----------|-----|
| **FPS** | 60 | 58-60 | 55-58 | <55 ❌ |
| **Swipe Latency** | <100ms | <50ms | 50-100ms | >100ms ❌ |
| **Heap Memory** | Stable | +0-5MB/min | +5-20MB/min | +20MB/min ❌ |
| **Obstacles** | 5-10 | ✅ | Depends | N/A |

---

## 🐛 Troubleshooting

### Problema: Game não inicia

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm start
```

### Problema: FPS cai para <55

**Checklist:**
1. ✅ Desabilitar remote debugger (shake → "Disable Remote JS Debugging")
2. ✅ Reduzir `OBSTACLE_MAX_ACTIVE` de 15 → 10
3. ✅ Aumentar `OBSTACLE_SPAWN_INTERVAL` de 800ms → 1000ms
4. ✅ Check Xcode Profiler → GPU % < 85%

### Problema: Swipe não responde ou é lento

```bash
# Verificar gesture handler está integrado
# Em App.tsx, GestureHandlerRootView deve envolver tudo

# Rebuild native modules
rm -rf node_modules
npm install
expo prebuild --clean
```

### Problema: Memory leak detectado

**Check:** `adb shell dumpsys meminfo com.foodfight.poc`

**Comum:**
- ObstacleSystem não limpando obstacles off-screen → Fix: verificar `ObstacleSystem.update()`
- Zustand store acumulando state antigo → Fix: adicionar `.subscribe()` cleanup

---

## 🧪 Test Procedure (Spec-Driven)

### Phase 1: Baseline (5 min)
```
1. Ligar device em modo voo (sem internet)
2. Abrir app
3. Deixar rodar 5 min sem interação
4. Anotar:
   - FPS médio?
   - Memory mudou?
```

### Phase 2: Gameplay (5 min)
```
1. Swipe ativamente (up/down)
2. Deixar rodar 5 min com interação
3. Anotar:
   - FPS com interação?
   - Latência percebida?
   - Colisões são justas?
```

### Phase 3: Stress (2 min)
```
1. Abrir app normalmente
2. Deixar rodar até game over (mínimo 2 min)
3. Anotar:
   - FPS manteve 60?
   - Memory cresceu > 50MB?
   - Crashes?
```

### Resultado
Preencher [`POC_RESULTS.md`](#resultado-final):
```markdown
## Resultado POC

**Dispositivo:** iPhone 12 / Pixel 5a
**Data:** 2026-06-27

| Critério | Resultado | Status |
|----------|-----------|--------|
| FPS (55+) | 58 fps | ✅ |
| Latency (<100ms) | 45ms | ✅ |
| Memory stable | +15MB | ✅ |
| Sem crashes | Sim | ✅ |

**Decisão:** ✅ **APROVADO** - Prosseguir para full game build
```

---

## 📝 O que a POC NÃO Tem

Propositalmente simplificado:

- ❌ Sprites reais (usando shapes geométricas)
- ❌ Áudio / música
- ❌ Sistema de vidas completo (apenas health bar)
- ❌ UI polida / menus
- ❌ Backend / persistência
- ❌ Múltiplos game modes
- ❌ Animations complexas

**Tudo isso será adicionado após aprovação da POC.**

---

## ✅ Próximos Passos (Se Aprovado)

1. **Integrar sprites reais** via spritesheets
2. **Adicionar efeitos sonoros** e background music
3. **Sistema de vidas** mais polido (3 vidas, game over screen)
4. **HUD/UI polida** (menu principal, pause, score display)
5. **Level progression** (difficulty scaling)
6. **Backend multiplayer** (opcional)

---

## 📚 Referências & Recursos

### Official Docs
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Reanimated 3](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Expo](https://docs.expo.dev/versions/v56.0.0/)

### Game Development Patterns
- [Game Loop](https://gameprogrammingpatterns.com/game-loop.html) - Classic reference
- [AABB Collision](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection) - Rectangle intersection

### Performance
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Profiling Expo Apps](https://docs.expo.dev/debugging/debugger-frontend/#performance)

---

## 👥 Desenvolvimento via SDD

Projeto estruturado com **Spec-Driven Development**:

✅ **Phase 1:** Brainstorming & Coleta de Requisitos  
✅ **Phase 2:** Decomposição em Tasks (Sprints)  
✅ **Phase 3:** Implementação TDD-style  
✅ **Phase 4:** Verificação & Testes  
✅ **Phase 5:** Troubleshooting & Tuning  
✅ **Phase 6:** Resultado Final & Decisão

Vide [POC_GUIDE.md](./POC_GUIDE.md) para detalhes completos de cada fase.

---

## 📞 Suporte

Problemas?

1. ✅ Verificar [Troubleshooting](#-troubleshooting) section
2. ✅ Ler [POC_GUIDE.md](./POC_GUIDE.md) seção específica
3. ✅ Verificar [ARCHITECTURE.md](./ARCHITECTURE.md) decisões de design
4. ✅ Ligar debugger via Expo Dev Client

---

## 📄 License

MIT - Use livremente para educar e desenvolver

---

**Created with ❤️ via Spec-Driven Development**  
**Last Updated:** Junho 2026  
**Version:** 1.0.0-poc

---

## Checklist de Validação Rápida

Antes de começar testes, validar:

- [ ] `npm install` completou sem erros
- [ ] iOS/Android SDKs atualizadas
- [ ] Dispositivo conectado (real device, não emulador)
- [ ] Device em modo voo para teste baseline
- [ ] Xcode/Android Studio profiler instalado
- [ ] Git branch limpa (sem mudanças pendentes)
- [ ] POC_GUIDE.md foi lido (mínimo seções 1-2)

✅ Tudo pronto? Vá para **Quick Start** e comece os testes!
