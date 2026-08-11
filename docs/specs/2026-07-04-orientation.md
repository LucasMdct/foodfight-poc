# Orientation Selection Feature - Spec Comparison

This document applies multiple spec methodologies to the "Orientation Selection" feature to compare their effectiveness for this scenario.

## 1. PRD Format (`to-prd` skill)

### Problem Statement
The game currently only plays in vertical (portrait) mode. Players have different preferences and devices, and may want to play the game in horizontal (landscape) mode. There is no way to choose the orientation before the game starts.

### Solution
Introduce an intermediary screen after the loading screen finishes. This screen will present two buttons: "Vertical" and "Horizontal". Once the user selects an option, the app will lock the device orientation accordingly and proceed to the GameScreen. The game engine and canvas will adapt dynamically to the selected dimensions.

### User Stories
1. As a player, I want to see an orientation selection screen after loading, so that I can choose how I want to hold my device.
2. As a player, I want to click "Horizontal" to play the game in landscape mode, so that I have a wider field of view.
3. As a player, I want the game to adapt its lanes and obstacles to the horizontal layout automatically.
4. As a player, I want my choice to instantly transition me into the gameplay screen.

### Implementation Decisions
- Add `expo-screen-orientation` to handle native orientation locking.
- Modify `App.tsx` state machine: `isLoading` -> `isSelectingOrientation` -> `isPlaying`.
- Create a new component `OrientationSelectionScreen`.
- Ensure `useRunnerEngine` and `GameCanvas` use `useWindowDimensions` correctly (which they already do, making them responsive).

---

## 2. SDD Format (`spec-driven-development` skill)

### Objective
Add a screen after the loader that lets the user choose between Vertical (Portrait) and Horizontal (Landscape) mode before the game starts.

### Tech Stack
React Native, Expo SDK 56, `expo-screen-orientation`.

### Commands
Install dependency: `npx expo install expo-screen-orientation`

### Project Structure
- `App.tsx` (State machine updates)
- `src/components/OrientationScreen.tsx` (New component)
- `src/components/OrientationScreen.styles.ts` (Styles)

### Boundaries
- **Always:** Use React Native animated or simple styles for the selection screen. Keep it premium to match the loader.
- **Ask first:** Adding new heavy libraries. (`expo-screen-orientation` is standard).
- **Never:** Hardcode screen dimensions in the engine.

### Success Criteria
- After the dopamine loader, a screen with 2 premium buttons appears.
- Clicking "Horizontal" locks the app in landscape and mounts the game.
- The Skia canvas and RunnerEngine lanes adapt perfectly to the new width/height.

---

## 3. Interface Design (`design-an-interface` skill)

### Design A: Global Store State (Maximize Flexibility)
- Store orientation preference in `useGameStore`.
- `App.tsx` reacts to the store and calls `ScreenOrientation.lockAsync`.
- Pros: Orientation can be changed from a pause menu later.
- Cons: Slightly more boilerplate.

### Design B: Local App State (Simplicity)
- `App.tsx` manages `<OrientationScreen onSelect={(mode) => lockAndStart(mode)} />`.
- `lockAndStart` directly calls the Expo API and changes local state to render `<GameScreen />`.
- Pros: Extremely simple, contained within the App root flow.
- Cons: Harder to change orientation mid-game without reloading the engine.

### Design C: Auto-Detect (Optimize for Common Case)
- Don't ask the user. Just allow auto-rotate and let the game engine listen to `useWindowDimensions`.
- Pros: Zero friction.
- Cons: Doesn't meet the explicit requirement of showing "two buttons".

---

## 🏆 Comparison & Conclusion

**Best for this scenario:** **SDD Format + Design B (Local App State)**.
- The **PRD** is too focused on user stories, which is overkill for a 2-button screen.
- The **Interface Design** highlights an important technical choice (Global vs Local state). Since we only need to select before the game starts, **Design B** is perfect.
- The **SDD** provides the most actionable blueprint (installing the Expo package, defining the boundaries, and success criteria).

I will implement the feature following the **SDD + Design B** approach.
