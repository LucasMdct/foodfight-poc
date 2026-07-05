import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameCanvas } from './src/components/GameCanvas';
import { SwipeHandler } from './src/components/SwipeHandler';
import { useGameStore } from './src/store/gameStore';
import { useRunnerEngine } from './src/hooks/useRunnerEngine';
import { GameLoader } from './src/components/GameLoader';
import { OrientationScreen } from './src/components/OrientationScreen';
import { styles } from './App.styles';

type AppState = 'loading' | 'orientation' | 'playing';

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
  const [appState, setAppState] = useState<AppState>('loading');

  return (
    <GestureHandlerRootView style={styles.container}>
      {appState === 'loading' && (
        <GameLoader onFinished={() => setAppState('orientation')} />
      )}
      {appState === 'orientation' && (
        <OrientationScreen onSelect={() => setAppState('playing')} />
      )}
      {appState === 'playing' && (
        <GameScreen />
      )}
    </GestureHandlerRootView>
  );
}
