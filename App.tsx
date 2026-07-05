import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  useFonts,
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import { ThemeProvider } from './src/theme';
import { useGameStore } from './src/store/gameStore';
import { LoadingScreen } from './src/screens/LoadingScreen'; // Task 7
import { SelectScreen } from './src/screens/SelectScreen'; // Task 8
import { GameScreen } from './src/screens/GameScreen'; // Task 9
import { styles } from './src/screens/appStyles';

function Flow() {
  const screen = useGameStore((s) => s.state.screen);
  // 'game' and 'over' both render GameScreen (over draws its modal on top).
  if (screen === 'select') return <SelectScreen />;
  return <GameScreen />;
}

export default function App() {
  const [loadingDone, setLoadingDone] = React.useState(false);
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <View style={styles.container}>
          {!fontsLoaded || !loadingDone ? (
            <LoadingScreen ready={fontsLoaded} onFinished={() => setLoadingDone(true)} />
          ) : (
            <Flow />
          )}
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
