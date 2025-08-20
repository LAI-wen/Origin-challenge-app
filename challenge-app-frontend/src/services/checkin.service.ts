// src/services/checkin.service.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://10.0.2.2:3000'; // Android emulator uses 10.0.2.2 to access host

// Check-in related interfaces
export interface CheckinRequest {
  type: 'TEXT' | 'IMAGE' | 'CHECKMARK';
  content?: string;
  image?: string; // base64 encoded image
}

export interface CheckinResponse {
  success: boolean;
  checkin?: {
    id: string;
    type: 'TEXT' | 'IMAGE' | 'CHECKMARK';
    content?: string;
    imageUrl?: string;
    pixelImageUrl?: string;
    submittedAt: string;
    levelId: string;
    userId: string;
  };
  roomProgress?: {
    progress: number;
    escaped: boolean;
    daysRemaining: number;
    consecutiveDays: number;
  };
  error?: string;
  message?: string;
}

export interface CheckinHistory {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'CHECKMARK';
  content?: string;
  imageUrl?: string;
  pixelImageUrl?: string;
  submittedAt: string;
  levelId: string;
  userId: string;
}

export interface TodayStatus {
  canCheckin: boolean;
  hasCheckedIn: boolean;
  timeRemaining?: number; // minutes remaining in check-in window
  timeWindow: {
    start: string;
    end: string;
    current: string;
    isWithinWindow: boolean;
  };
  todayCheckin?: CheckinHistory;
}

class CheckinService {
  private async getAuthToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('authToken');
      } else {
        return await SecureStore.getItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Response:`, data);
    return data;
  }

  /**
   * Submit a check-in for a specific level (room)
   */
  async submitCheckin(levelId: string, checkinData: CheckinRequest): Promise<CheckinResponse> {
    return this.makeRequest(`/api/checkin/${levelId}`, {
      method: 'POST',
      body: JSON.stringify(checkinData),
    });
  }

  /**
   * Get today's check-in status for a specific level
   */
  async getTodayStatus(levelId: string): Promise<TodayStatus> {
    // Add cache busting to prevent request caching issues
    const timestamp = Date.now();
    return this.makeRequest(`/api/checkin/${levelId}/today?_t=${timestamp}`);
  }

  /**
   * Get check-in history for a specific level
   */
  async getCheckinHistory(levelId: string, limit = 30): Promise<CheckinHistory[]> {
    return this.makeRequest(`/api/checkin/${levelId}/history?limit=${limit}`);
  }

  /**
   * Get all today's check-ins across all levels for current user
   */
  async getAllTodayStatus(): Promise<{ [levelId: string]: TodayStatus }> {
    return this.makeRequest('/api/checkin/today/all');
  }

  /**
   * Get room escape status for a specific level
   */
  async getRoomEscapeStatus(levelId: string) {
    return this.makeRequest(`/api/checkin/${levelId}/escape-status`);
  }
}

// Export singleton instance
export const checkinService = new CheckinService();
export default checkinService;