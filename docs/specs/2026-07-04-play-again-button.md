# Design Spec: Game Over Modal & Play Again Button Refactoring

## 1. Context & Objectives
In the current implementation of the FoodFight PoC:
* The Game Over screen is rendered as a modal in the center of [GameCanvas.tsx](file:///home/lucas/GameProjects/foodfight-poc/src/components/GameCanvas.tsx) instructing the player to reset the game.
* However, the actual **Play Again** button is rendered at the absolute bottom of the screen in [App.tsx](file:///home/lucas/GameProjects/foodfight-poc/App.tsx) using a generic React Native `<Button>`.
* This causes visual clutter, bad UX (the button is located away from the modal instructions), and accessibility/layout issues (the button is positioned too far down, potentially overlapping device home indicator lines/navigation bars).

**Objectives:**
* Remove the generic button at the bottom of the screen.
* Move the "Play Again" button inside the central Game Over modal.
* Elevate the visual quality of the modal and button using modern styling (rounded borders, elevation, custom touchable opacity button, clear final score display).

---

## 2. Proposed Changes

### A. App.tsx
* Remove the `state.isGameOver && resetButtonContainer` view block.
* Pass the `handleReset` callback to `<GameCanvas>` via an `onReset` prop.

### B. GameCanvas.tsx
* Update the `GameCanvasProps` interface to require an `onReset` callback.
* Import `TouchableOpacity` from `react-native`.
* Re-style the modal container, card, and add the new button:
  * **Overlay:** Fullscreen semi-transparent dim overlay (`rgba(0,0,0,0.6)`).
  * **Card:** Styled with white background, rounded corners (`borderRadius: 20`), vertical padding, shadow offsets/elevation, and proper sizing.
  * **Score:** Show the final score.
  * **Play Again Button:** Styled as a high-contrast pill shape (`#FF6B6B`) with bold, uppercase text and modern letter-spacing.

---

## 3. Implementation Details & Style Sheet

We will define clean, explicit styles for the Game Over overlay and modal components:

```typescript
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
    width: '80%',
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

---

## 4. Verification Plan
* Ensure the project compiles successfully.
* Verify that the "Play Again" button does not appear at the bottom of the screen.
* When health reaches 0 (Game Over), verify that:
  1. The Game Over screen overlays correctly.
  2. The final score is shown.
  3. The custom styled "Play Again" button is centered inside the modal card.
  4. Pressing the button correctly resets the game state (score, health to 100, etc.) and starts a new game.
