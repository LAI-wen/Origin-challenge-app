// src/services/auth.service.ts
const API_BASE_URL = 'http://localhost:3000'; // Change this to your backend URL

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