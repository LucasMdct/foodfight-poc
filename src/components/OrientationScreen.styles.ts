import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 40,
    letterSpacing: 1,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 20,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonHorizontal: {
    borderColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
