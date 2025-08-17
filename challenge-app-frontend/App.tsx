// App.tsx
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LevelProvider } from './src/contexts/LevelContext';
import LoginScreen from './src/screens/LoginScreen';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { 
  PixelText, 
  PixelButton, 
  PixelCard, 
  LoadingSpinner,
  useStyles 
} from './src/components/ui';
import { Theme } from './src/styles/theme';
import './src/i18n';

WebBrowser.maybeCompleteAuthSession();

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme, themeMode } = useTheme();
  const styles = useStyles(createAppStyles);

  const handleLogout = async () => {
    try {
      // Try to sign out from Google directly without checking isSignedIn
      await GoogleSignin.signOut();
      console.log('🚪 Google Sign-In signed out');
      
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
        <LoadingSpinner 
          variant="text" 
          size="large" 
          text="Loading 8-Bit Habits..."
        />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <PixelCard variant="elevated" style={styles.welcomeCard}>
          <PixelText variant="h3" color="accent" weight="bold" align="center">
            Welcome back, {user.name}! 🎯
          </PixelText>
          
          <PixelText variant="body1" color="textSecondary" align="center" style={styles.subtitle}>
            Ready for your pixel quest?
          </PixelText>
          
          <View style={styles.userInfo}>
            <PixelText variant="body2" color="text">
              📧 {user.email}
            </PixelText>
            {user.language && (
              <PixelText variant="caption" color="textMuted">
                🌐 Language: {user.language}
              </PixelText>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <PixelButton
              variant="outline"
              title={`Theme: ${themeMode}`}
              onPress={toggleTheme}
              style={styles.themeButton}
            />
            
            <PixelButton
              variant="secondary"
              title="🚪 Logout"
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </View>
        </PixelCard>
        
        <StatusBar style={themeMode === 'monochrome' ? 'light' : 'auto'} />
      </View>
    );
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <ThemeProvider initialTheme="monochrome">
      <AuthProvider>
        <LevelProvider>
          <AppContent />
        </LevelProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// 使用主題系統的樣式創建函數
const createAppStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: theme.spacing.l,
  },
  welcomeCard: {
    width: '100%' as const,
    maxWidth: 400,
    padding: theme.spacing.l,
  },
  subtitle: {
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },
  userInfo: {
    alignItems: 'center' as const,
    marginVertical: theme.spacing.l,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: theme.spacing.l,
    gap: theme.spacing.s,
  },
  themeButton: {
    flex: 1,
  },
  logoutButton: {
    flex: 1,
  },
});