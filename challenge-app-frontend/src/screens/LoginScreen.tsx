// src/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Pressable } from 'react-native';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const [isLogging, setIsLogging] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com',
      // androidClientId is not required for Expo managed workflow
      // The androidClientId from Google Cloud Console is used automatically
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });

    console.log('📋 Google Sign-In configured');
    console.log('- Web Client ID:', '823839716704-hsv1lujjk8u28srerboe5ik54hj7kqra.apps.googleusercontent.com');
    console.log('- Platform:', Platform.OS);
  }, []);

  const handleGoogleLogin = async () => {
    console.log('🚀 Google Sign-In button clicked!');
    setIsLogging(true);
    
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      console.log('✅ Google Play Services available');
      
      // Sign in
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In Success!');
      console.log('👤 User info:', userInfo);
      
      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('🎫 Tokens:', tokens);
      
      // Try login with access token first
      const success = await login(tokens.accessToken);
      
      if (!success) {
        // If access token fails, try with id token
        if (tokens.idToken) {
          console.log('🔄 Trying with ID token...');
          const idSuccess = await login(tokens.idToken);
          if (!idSuccess) {
            Alert.alert(t('login.failed'), t('login.failedMessage'));
          } else {
            console.log('✅ Login successful with ID token!');
          }
        } else {
          Alert.alert(t('login.failed'), t('login.failedMessage'));
        }
      } else {
        console.log('✅ Login successful with access token!');
      }
      
    } catch (error: any) {
      console.error('❌ Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('⚠️ User cancelled the login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('🔄 Sign in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(t('login.error'), 'Google Play Services not available');
      } else {
        Alert.alert(t('login.error'), error.message || t('login.errorMessage'));
      }
    } finally {
      setIsLogging(false);
    }
  };

  const toggleLanguage = () => {
    const currentLanguage = i18n.language;
    const newLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLanguage);
  };

  return (
    <View style={styles.container}>
      <View style={styles.languageToggle}>
        <Pressable
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageButtonText}>
            {i18n.language === 'zh' ? t('login.switchToEnglish') : t('login.switchToChinese')}
          </Text>
        </Pressable>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.title}>{t('app.title')}</Text>
        <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          {t('login.welcome')}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Use the official Google Sign-In button */}
        <GoogleSigninButton
          style={styles.googleButton}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={handleGoogleLogin}
          disabled={isLogging}
        />
        
        {isLogging && (
          <Pressable
            style={styles.resetButton}
            onPress={() => {
              console.log('🔄 Manual reset button pressed');
              setIsLogging(false);
            }}
          >
            <Text style={styles.resetButtonText}>
              Reset / 重置
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.footer}>
        {t('login.footer')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'center',
  },
  languageToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  languageButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
  },
  languageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffff00',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcomeText: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 28,
  },
  buttonContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  googleButton: {
    width: 192,
    height: 48,
    marginBottom: 15,
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: '#ff6666',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  footer: {
    fontSize: 14,
    color: '#ff00ff',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default LoginScreen;