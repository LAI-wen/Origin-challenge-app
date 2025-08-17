// src/styles/theme.ts
import { Platform } from 'react-native';

export type ThemeMode = 'monochrome' | 'colored';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  colors: ThemeColors;
  fonts: {
    mono: string;
  };
  spacing: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
  borderRadius: number;
  borderWidth: {
    thin: number;
    normal: number;
    thick: number;
  };
  shadows: {
    none: object;
    pixel: object;
  };
}

const baseTheme = {
  fonts: {
    mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  spacing: {
    xs: 4,
    s: 8, 
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: 0, // 像素風格無圓角
  borderWidth: {
    thin: 1,
    normal: 2,
    thick: 3
  },
  shadows: {
    none: {},
    // 像素風格陰影 - 使用邊框效果而非模糊陰影
    pixel: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    }
  }
};

const monochromeColors: ThemeColors = {
  background: '#000000',
  surface: '#1a1a1a', 
  surfaceLight: '#333333',
  border: '#666666',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textMuted: '#999999',
  accent: '#ffffff',
  success: '#ffffff',
  warning: '#cccccc',
  error: '#ffffff',
};

const coloredColors: ThemeColors = {
  background: '#0a0a0f',
  surface: '#1a1a2e', 
  surfaceLight: '#16213e',
  border: '#0f3460',
  text: '#eee6e6',
  textSecondary: '#a8a8a8',
  textMuted: '#6b6b6b',
  accent: '#e94560',
  success: '#00d2d3',
  warning: '#ff9f43',
  error: '#ea5455',
};

export const themes: Record<ThemeMode, Theme> = {
  monochrome: {
    ...baseTheme,
    colors: monochromeColors,
  },
  colored: {
    ...baseTheme,
    colors: coloredColors,
  },
};

// 預設主題
export const defaultTheme = themes.monochrome;

// 主題工具函數
export const getTheme = (mode: ThemeMode): Theme => themes[mode];

// 常用樣式組合
export const createPixelButtonStyle = (theme: Theme, variant: 'primary' | 'secondary' = 'primary') => ({
  backgroundColor: variant === 'primary' ? theme.colors.accent : theme.colors.surface,
  borderColor: theme.colors.border,
  borderWidth: theme.borderWidth.normal,
  borderRadius: theme.borderRadius,
  paddingVertical: theme.spacing.m,
  paddingHorizontal: theme.spacing.l,
  minHeight: 48, // 可觸摸的最小尺寸
});

export const createPixelCardStyle = (theme: Theme) => ({
  backgroundColor: theme.colors.surface,
  borderColor: theme.colors.border,
  borderWidth: theme.borderWidth.normal,
  borderRadius: theme.borderRadius,
  padding: theme.spacing.m,
  marginVertical: theme.spacing.s,
});

export const createPixelInputStyle = (theme: Theme) => ({
  backgroundColor: theme.colors.surfaceLight,
  borderColor: theme.colors.border,
  borderWidth: theme.borderWidth.normal,
  borderRadius: theme.borderRadius,
  paddingVertical: theme.spacing.m,
  paddingHorizontal: theme.spacing.m,
  color: theme.colors.text,
  fontFamily: theme.fonts.mono,
  fontSize: 16,
  minHeight: 48,
});