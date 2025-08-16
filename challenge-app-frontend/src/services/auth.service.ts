// src/services/auth.service.ts
import { Platform } from 'react-native';
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://10.0.2.2:3000'; // Android emulator uses 10.0.2.2 to access host

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    language?: string;
  };
  token: string;
}

class AuthService {
  async loginWithGoogle(googleToken: string): Promise<LoginResponse> {
    try {
      console.log('🔗 API_BASE_URL:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth service error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    // In the future, we might want to call a logout endpoint
    // For now, just handle local cleanup
    return Promise.resolve();
  }
}

export const authService = new AuthService();