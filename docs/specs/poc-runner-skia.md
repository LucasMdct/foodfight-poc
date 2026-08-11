# POC Técnica — Runner (React Native Skia)

**Projeto:** FoodFight Kids

**Documento:** Especificação Técnica da POC do Runner

**Status:** Em elaboração

**Última atualização:** Junho 2026

---

## Objetivo

Provar que o React Native Skia consegue rodar o loop de gameplay principal a **60fps em dispositivos mid-range** (iOS e Android), antes de investir na construção completa do jogo.

Esta POC não precisa ter sprites reais, áudio ou UI completa — apenas validar que a engine suporta o core loop.

---

## 1. Setup do Ambiente

- [x]  Configurar projeto Expo com React Native Skia
- [x]  Configurar Reanimated 3 integrado ao Skia *(Reanimated 4.3.1; shared values lidos direto pelo Skia + `useFrameCallback`)*
- [ ]  Rodar em dispositivo físico (não só emulador) — iOS e Android *(pendente: teste manual em hardware)*

---

## 2. Game Loop Básico

- [x]  Implementar loop com `useFrameCallback` ou equivalente do Skia *(loop na thread UI, sem re-render React por frame)*
- [x]  Garantir delta time estável (independente do frame rate do dispositivo) *(`timeSincePreviousFrame`)*
- [x]  Medir e logar FPS em tempo real durante o teste *(amostra 1×/s na HUD)*

---

## 3. As 3 Faixas

- [x]  Renderizar as 3 faixas fixas (cima, meio, baixo) no canvas
- [x]  Posicionar o herói (placeholder — pode ser um retângulo) na faixa do meio
- [x]  Implementar transição entre faixas com animação suave (~100ms) *(`withTiming` de 100ms sobre `heroY`)*

---

## 4. Controle por Swipe

- [x]  Capturar gesto de swipe vertical com `react-native-gesture-handler`
- [x]  Conectar swipe → mudança de faixa → animação
- [ ]  Testar em touch real — verificar latência percebida *(pendente: teste manual em hardware)*

---

## 5. Geração e Spawn de Obstáculos

- [x]  Criar sistema de spawn que gera obstáculos fora da tela (direita) em intervalos
- [x]  Mover obstáculos da direita para a esquerda em velocidade constante
- [x]  Destruir objetos ao sair da tela (evitar memory leak) *(pool fixo reciclado — zero alocação por frame)*

---

## 6. Detecção de Colisão

- [x]  Implementar hitbox simplificada (retângulo menor que o sprite) *(padding de 10px)*
- [x]  Detectar colisão herói × obstáculo *(AABB por faixa, na thread UI)*
- [x]  Acionar feedback visual ao colidir (piscar herói por 1,5s)

---

## 7. Critérios de Aprovação

| Critério | Meta |
| --- | --- |
| FPS estável | 60fps em device mid-range |
| Latência do swipe | < 100ms de resposta percebida |
| Colisão | Sem falsos positivos ou negativos óbvios |
| Memória | Sem vazamento após 2 min de gameplay |
| Compatibilidade | iOS 15+ e Android 11+ |

---

## 8. O que a POC NÃO Precisa Ter

- Sprites reais (placeholder geométrico está ótimo)
- Áudio
- Sistema de vidas completo
- HUD / UI
- Backend ou persistência de dados

---

## 9. Referências

- [React Native Skia — useFrameCallback](https://shopify.github.io/react-native-skia/docs/animations/hooks/)
- [Reanimated 3 — documentação oficial](https://docs.swmansion.com/react-native-reanimated/)
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)

---

## Resultado da POC

> *Preencher após a execução com os resultados dos testes de performance e decisão de prosseguir ou ajustar a stack.*
> 
- **FPS medido:**
- **Latência do swipe medida:**
- **Dispositivos testados:**
- **Decisão:** ✅ Aprovado / ❌ Reprovado — ajustar stack