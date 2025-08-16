// App.tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import './src/i18n';

WebBrowser.maybeCompleteAuthSession();

function AppContent() {
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Check if user is signed in before trying to sign out
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
        console.log('🚪 Google Sign-In signed out');
      } else {
        console.log('🚪 User not signed in to Google, skipping Google sign out');
      }
      
      // Clear local auth state
      await logout();
      console.log('🚪 User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still try to logout locally even if Google sign out fails
      await logout();
    }
  };

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
        
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>📧 {user.email}</Text>
          {user.language && (
            <Text style={styles.userLanguage}>🌐 Language: {user.language}</Text>
          )}
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout / 登出</Text>
        </Pressable>
        
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
    marginBottom: 30,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  userEmail: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 5,
  },
  userLanguage: {
    color: '#cccccc',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff6666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});