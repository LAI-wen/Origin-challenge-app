// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Theme, ThemeMode, themes, defaultTheme } from '../styles/theme';

interface ThemeContextType {
  // 當前主題
  theme: Theme;
  themeMode: ThemeMode;
  
  // 主題切換功能
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  
  // 主題狀態
  isLoading: boolean;
  
  // 樣式創建工具
  createStyles: <T extends Record<string, any>>(styleCreator: (theme: Theme) => T) => T;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeMode;
}

const THEME_STORAGE_KEY = 'app_theme_mode';

export const ThemeProvider = ({ children, initialTheme = 'monochrome' }: ThemeProviderProps) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [isLoading, setIsLoading] = useState(true);
  
  const theme = themes[themeMode];

  // 載入保存的主題設置
  useEffect(() => {
    loadSavedTheme();
  }, []);

  /**
   * 從存儲中載入保存的主題設置
   */
  const loadSavedTheme = async (): Promise<void> => {
    try {
      let savedTheme: string | null = null;
      
      if (Platform.OS === 'web') {
        savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      } else {
        savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      }
      
      if (savedTheme && (savedTheme === 'monochrome' || savedTheme === 'colored')) {
        setThemeMode(savedTheme as ThemeMode);
        console.log(`🎨 Loaded saved theme: ${savedTheme}`);
      } else {
        console.log(`🎨 Using default theme: ${initialTheme}`);
      }
    } catch (error) {
      console.error('❌ Error loading saved theme:', error);
      // 載入失敗時使用預設主題
      setThemeMode(initialTheme);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存主題設置到存儲
   */
  const saveTheme = async (mode: ThemeMode): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
      }
      console.log(`💾 Saved theme: ${mode}`);
    } catch (error) {
      console.error('❌ Error saving theme:', error);
    }
  };

  /**
   * 切換主題（在黑白和彩色之間）
   */
  const toggleTheme = (): void => {
    const newMode: ThemeMode = themeMode === 'monochrome' ? 'colored' : 'monochrome';
    setTheme(newMode);
  };

  /**
   * 設置特定主題
   */
  const setTheme = (mode: ThemeMode): void => {
    setThemeMode(mode);
    saveTheme(mode);
    console.log(`🎨 Theme changed to: ${mode}`);
  };

  /**
   * 樣式創建工具 - 自動使用當前主題
   */
  const createStyles = <T extends Record<string, any>>(
    styleCreator: (theme: Theme) => T
  ): T => {
    return styleCreator(theme);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setTheme,
    isLoading,
    createStyles,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook 來使用主題上下文
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * HOC 來為組件提供主題
 */
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) => {
  return (props: P) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

/**
 * Hook 來創建響應式樣式
 */
export const useStyles = <T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return React.useMemo(() => styleCreator(theme), [theme, styleCreator]);
};

/**
 * Hook 來獲取主題相關的值
 */
export const useThemeValue = <T,>(
  valueCreator: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return React.useMemo(() => valueCreator(theme), [theme, valueCreator]);
};

/**
 * 主題切換按鈕組件（可在任何地方使用）
 */
export const ThemeToggleButton: React.FC<{
  children?: React.ReactElement;
  onPress?: () => void;
}> = ({ children, onPress }) => {
  const { toggleTheme, themeMode } = useTheme();
  
  const handlePress = () => {
    toggleTheme();
    onPress?.();
  };
  
  return (
    <>
      {children ? (
        React.cloneElement(children, { onPress: handlePress } as any)
      ) : null}
    </>
  );
};

// 導出常用的類型
export type { ThemeContextType, ThemeProviderProps };