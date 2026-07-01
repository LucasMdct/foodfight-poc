module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-configures the Reanimated/Worklets Babel plugin
    // (required for `useFrameCallback` and `'worklet'` functions) when
    // react-native-reanimated is installed. No manual plugin entry needed.
    presets: ['babel-preset-expo'],
  };
};
