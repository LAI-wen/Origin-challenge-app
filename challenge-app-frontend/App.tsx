// App.tsx
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LevelProvider } from './src/contexts/LevelContext';
import LoginScreen from './src/screens/LoginScreen';
import { LevelListScreen } from './src/screens/LevelListScreen';
import CheckinScreen from './src/screens/CheckinScreen';
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
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'rooms' | 'checkin'>('welcome');
  const [checkinData, setCheckinData] = useState<{levelId: string; levelName: string} | null>(null);

  const handleLogout = async () => {
    try {
      // Try to sign out from Google directly without checking isSignedIn
      await GoogleSignin.signOut();
      console.log('🚪 Google Sign-In signed out');
      
      // Clear local auth state
      await logout();
      console.log('🚪 User logged out successfully');
      
      // Reset navigation state
      setCurrentScreen('welcome');
      setShowWelcome(true);
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still try to logout locally even if Google sign out fails
      await logout();
      setCurrentScreen('welcome');
      setShowWelcome(true);
    }
  };

  const handleCheckinNavigation = (levelId: string, levelName: string) => {
    setCheckinData({ levelId, levelName });
    setCurrentScreen('checkin');
  };

  const handleBackToRooms = () => {
    setCheckinData(null);
    setCurrentScreen('rooms');
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
    // Check-in screen
    if (currentScreen === 'checkin' && checkinData) {
      return (
        <View style={{ flex: 1 }}>
          <CheckinScreen
            levelId={checkinData.levelId}
            levelName={checkinData.levelName}
            onBack={handleBackToRooms}
            onCheckinSuccess={handleBackToRooms}
          />
          <StatusBar style={themeMode === 'monochrome' ? 'light' : 'auto'} />
        </View>
      );
    }

    // Rooms screen
    if (currentScreen === 'rooms') {
      return (
        <View style={{ flex: 1 }}>
          <LevelListScreen 
            onNavigateToSettings={() => setCurrentScreen('welcome')}
            onNavigateToCheckin={handleCheckinNavigation}
          />
          <StatusBar style={themeMode === 'monochrome' ? 'light' : 'auto'} />
        </View>
      );
    }

    // Welcome screen (default)  
      return (
        <View style={styles.container}>
          <PixelCard variant="elevated" style={styles.welcomeCard}>
            <PixelText variant="h3" color="accent" weight="bold" align="center">
              Welcome back, {user.name}! 🎯
            </PixelText>
            
            <PixelText variant="body1" color="textSecondary" align="center" style={styles.subtitle}>
              Ready for your escape room challenge?
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
                variant="primary"
                title="🏠 Enter Escape Rooms"
                onPress={() => setCurrentScreen('rooms')}
                style={styles.startButton}
              />
            </View>

            <View style={styles.settingsContainer}>
              <PixelButton
                variant="outline"
                title={`Theme: ${themeMode}`}
                onPress={toggleTheme}
                style={styles.settingButton}
              />
              
              <PixelButton
                variant="secondary"
                title="🚪 Logout"
                onPress={handleLogout}
                style={styles.settingButton}
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
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  startButton: {
    width: '100%' as const,
  },
  settingsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: theme.spacing.s,
  },
  settingButton: {
    flex: 1,
  },
});