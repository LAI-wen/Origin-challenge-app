// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
  const { login } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLogging(true);
    
    try {
      // Configure Google OAuth
      const request = new AuthSession.AuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri: AuthSession.makeRedirectUri({
          scheme: '8bithabits',
          useProxy: true,
        }),
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success' && result.params.id_token) {
        const success = await login(result.params.id_token);
        
        if (!success) {
          Alert.alert('Login Failed', 'Unable to complete Google authentication');
        }
      } else {
        Alert.alert('Login Cancelled', 'Google authentication was cancelled');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 8-Bit Habits</Text>
        <Text style={styles.subtitle}>像素級的堅持，史詩級的成就</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          歡迎來到復古像素世界！{'\n'}
          建立習慣，開啟你的生存挑戰
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, isLogging && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={isLogging}
        >
          <Text style={styles.buttonText}>
            {isLogging ? '🔄 登入中...' : '🚀 使用 Google 登入'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        ⚡ Ready Player One? ⚡
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
  },
  loginButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00cc00',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    borderColor: '#444444',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
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