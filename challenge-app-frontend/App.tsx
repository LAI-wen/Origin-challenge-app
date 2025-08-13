// App.tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>🎮 Loading 8-Bit Habits...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome back, {user.name}! 🎯</Text>
        <Text style={styles.subtitle}>Ready for your pixel quest?</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#00ffff',
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  welcomeText: {
    color: '#00ff00',
    fontSize: 20,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ffff00',
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});