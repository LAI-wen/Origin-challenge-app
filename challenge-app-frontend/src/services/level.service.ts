// src/services/level.service.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://10.0.2.2:3000'; // Android emulator uses 10.0.2.2 to access host

// Level related interfaces
interface Level {
  id: string;
  name: string;
  description?: string;
  inviteCode?: string; // Only visible to CREATOR
  isActive: boolean;
  rule: {
    startTime: string;
    endTime: string;
    maxMissedDays: number;
  };
  settings: {
    checkinContentVisibility: 'public' | 'private' | 'creatorOnly';
  };
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  userRole: 'CREATOR' | 'PLAYER' | 'AUDIENCE';
  memberCount?: number;
  isOwner: boolean;
  members?: LevelMember[];
}

interface LevelMember {
  id: string;
  playerId: string;
  role: 'CREATOR' | 'PLAYER' | 'AUDIENCE';
  status: 'ACTIVE' | 'ELIMINATED';
  joinedAt: string;
  missedDays?: number; // Visible to CREATOR and PLAYER only
  player: {
    id: string;
    name: string;
    email?: string; // Visibility based on role and privacy settings
    avatarUrl?: string;
  };
}

interface CreateLevelRequest {
  name: string;
  description?: string;
  rule?: {
    startTime?: string;
    endTime?: string;
    maxMissedDays?: number;
  };
  settings?: {
    checkinContentVisibility?: 'public' | 'private' | 'creatorOnly';
  };
  startDate?: string;
  endDate?: string;
}

interface JoinLevelRequest {
  inviteCode: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

interface GetLevelsResponse extends ApiResponse {
  levels: Level[];
  total: number;
}

interface GetLevelResponse extends ApiResponse {
  level: Level;
}

interface CreateLevelResponse extends ApiResponse {
  level: Level;
}

interface JoinLevelResponse extends ApiResponse {
  level: Level;
  message: string;
}

class LevelService {
  
  /**
   * Get the authentication token from secure storage
   */
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

  /**
   * Make authenticated API request with proper error handling
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      console.log(`🔗 Making ${config.method || 'GET'} request to: ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all levels for the current user
   * GET /api/levels
   */
  async getLevels(): Promise<GetLevelsResponse> {
    return this.makeRequest<GetLevelsResponse>('/levels');
  }

  /**
   * Get specific level details by ID
   * GET /api/levels/:id
   */
  async getLevelDetails(levelId: string): Promise<GetLevelResponse> {
    return this.makeRequest<GetLevelResponse>(`/levels/${levelId}`);
  }

  /**
   * Create a new level
   * POST /api/levels
   */
  async createLevel(levelData: CreateLevelRequest): Promise<CreateLevelResponse> {
    return this.makeRequest<CreateLevelResponse>('/levels', {
      method: 'POST',
      body: JSON.stringify(levelData),
    });
  }

  /**
   * Join a level using invite code (without knowing level ID)
   * POST /api/levels/join
   */
  async joinLevelByCode(joinData: JoinLevelRequest): Promise<JoinLevelResponse> {
    return this.makeRequest<JoinLevelResponse>('/levels/join', {
      method: 'POST',
      body: JSON.stringify(joinData),
    });
  }

  /**
   * Join a level using invite code
   * POST /api/levels/:id/join
   */
  async joinLevel(levelId: string, joinData: JoinLevelRequest): Promise<JoinLevelResponse> {
    return this.makeRequest<JoinLevelResponse>(`/levels/${levelId}/join`, {
      method: 'POST',
      body: JSON.stringify(joinData),
    });
  }

  /**
   * Update level settings (CREATOR only)
   * PUT /api/levels/:id
   */
  async updateLevelSettings(
    levelId: string, 
    updateData: Partial<CreateLevelRequest>
  ): Promise<GetLevelResponse> {
    return this.makeRequest<GetLevelResponse>(`/levels/${levelId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Update level status (active/inactive) (CREATOR only)
   * PUT /api/levels/:id/status
   */
  async updateLevelStatus(
    levelId: string, 
    isActive: boolean
  ): Promise<GetLevelResponse> {
    return this.makeRequest<GetLevelResponse>(`/levels/${levelId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  /**
   * Update member role (CREATOR only)
   * PUT /api/levels/:id/members/:memberId
   */
  async updateMemberRole(
    levelId: string,
    memberId: string,
    role: 'PLAYER' | 'AUDIENCE'
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/levels/${levelId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  /**
   * Remove member from level (CREATOR only)
   * DELETE /api/levels/:id/members/:memberId
   */
  async removeMember(
    levelId: string,
    memberId: string
  ): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/levels/${levelId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }
}

export const levelService = new LevelService();

// Export types for use in components
export type {
  Level,
  LevelMember,
  CreateLevelRequest,
  JoinLevelRequest,
  GetLevelsResponse,
  GetLevelResponse,
  CreateLevelResponse,
  JoinLevelResponse,
  ApiResponse,
};