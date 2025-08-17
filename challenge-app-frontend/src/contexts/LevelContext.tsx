// src/contexts/LevelContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { levelService, Level, CreateLevelRequest, JoinLevelRequest } from '../services/level.service';
import { useAuth } from './AuthContext';

interface LevelContextType {
  // State
  levels: Level[];
  activeLevel: Level | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadLevels: () => Promise<void>;
  createLevel: (levelData: CreateLevelRequest) => Promise<Level | null>;
  joinLevel: (levelId: string, inviteCode: string) => Promise<Level | null>;
  setActiveLevel: (level: Level | null) => void;
  refreshLevelDetails: (levelId: string) => Promise<Level | null>;
  clearError: () => void;
  
  // Utility functions
  getLevelById: (levelId: string) => Level | null;
  getUserRole: (levelId: string) => 'CREATOR' | 'PLAYER' | 'AUDIENCE' | null;
  isLevelOwner: (levelId: string) => boolean;
}

const LevelContext = createContext<LevelContextType | undefined>(undefined);

interface LevelProviderProps {
  children: ReactNode;
}

export const LevelProvider = ({ children }: LevelProviderProps) => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load levels when user changes or component mounts
  useEffect(() => {
    if (user) {
      loadLevels();
    } else {
      // Clear data when user logs out
      setLevels([]);
      setActiveLevel(null);
      setError(null);
    }
  }, [user]);

  /**
   * Load all levels for the current user
   */
  const loadLevels = async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await levelService.getLevels();
      
      if (response.success) {
        setLevels(response.levels || []);
        console.log(`📋 Loaded ${response.levels?.length || 0} levels`);
      } else {
        throw new Error(response.error || 'Failed to load levels');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load levels';
      console.error('❌ Error loading levels:', errorMessage);
      setError(errorMessage);
      setLevels([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new level
   */
  const createLevel = async (levelData: CreateLevelRequest): Promise<Level | null> => {
    if (!user) {
      setError('User must be logged in to create a level');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await levelService.createLevel(levelData);
      
      if (response.success && response.level) {
        // Add the new level to the list
        setLevels(prevLevels => [response.level, ...prevLevels]);
        console.log(`✅ Created level: ${response.level.name}`);
        return response.level;
      } else {
        throw new Error(response.error || 'Failed to create level');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create level';
      console.error('❌ Error creating level:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Join a level using invite code
   */
  const joinLevel = async (levelId: string, inviteCode: string): Promise<Level | null> => {
    if (!user) {
      setError('User must be logged in to join a level');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await levelService.joinLevel(levelId, { inviteCode });
      
      if (response.success && response.level) {
        // Add the joined level to the list if not already present
        setLevels(prevLevels => {
          const exists = prevLevels.some(level => level.id === response.level.id);
          if (exists) {
            // Update existing level data
            return prevLevels.map(level => 
              level.id === response.level.id ? response.level : level
            );
          } else {
            // Add new level
            return [response.level, ...prevLevels];
          }
        });
        console.log(`✅ Joined level: ${response.level.name}`);
        return response.level;
      } else {
        throw new Error(response.error || 'Failed to join level');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join level';
      console.error('❌ Error joining level:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh specific level details (useful after updates)
   */
  const refreshLevelDetails = async (levelId: string): Promise<Level | null> => {
    try {
      setError(null);
      
      const response = await levelService.getLevelDetails(levelId);
      
      if (response.success && response.level) {
        // Update the level in the list
        setLevels(prevLevels => 
          prevLevels.map(level => 
            level.id === levelId ? response.level : level
          )
        );
        
        // Update active level if it's the same one
        if (activeLevel?.id === levelId) {
          setActiveLevel(response.level);
        }
        
        console.log(`🔄 Refreshed level details: ${response.level.name}`);
        return response.level;
      } else {
        throw new Error(response.error || 'Failed to refresh level details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh level details';
      console.error('❌ Error refreshing level details:', errorMessage);
      setError(errorMessage);
      return null;
    }
  };

  /**
   * Clear the current error
   */
  const clearError = (): void => {
    setError(null);
  };

  /**
   * Get level by ID from current levels list
   */
  const getLevelById = (levelId: string): Level | null => {
    return levels.find(level => level.id === levelId) || null;
  };

  /**
   * Get user's role in a specific level
   */
  const getUserRole = (levelId: string): 'CREATOR' | 'PLAYER' | 'AUDIENCE' | null => {
    const level = getLevelById(levelId);
    return level?.userRole || null;
  };

  /**
   * Check if current user is the owner of a specific level
   */
  const isLevelOwner = (levelId: string): boolean => {
    const level = getLevelById(levelId);
    return level?.isOwner || false;
  };

  const value: LevelContextType = {
    // State
    levels,
    activeLevel,
    isLoading,
    error,
    
    // Actions
    loadLevels,
    createLevel,
    joinLevel,
    setActiveLevel,
    refreshLevelDetails,
    clearError,
    
    // Utility functions
    getLevelById,
    getUserRole,
    isLevelOwner,
  };

  return (
    <LevelContext.Provider value={value}>
      {children}
    </LevelContext.Provider>
  );
};

export const useLevel = (): LevelContextType => {
  const context = useContext(LevelContext);
  if (context === undefined) {
    throw new Error('useLevel must be used within a LevelProvider');
  }
  return context;
};