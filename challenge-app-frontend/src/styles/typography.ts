// src/styles/typography.ts
import { Platform, TextStyle } from 'react-native';
import { Theme } from './theme';

export interface TypographyScale {
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

export const typographyScale: Record<string, TypographyScale> = {
  // 標題級別
  h1: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    lineHeight: 22,
  },
  
  // 內文級別
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // 輔助文字
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
  },
  
  // 按鈕和標籤
  button: {
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
};

// 創建文字樣式的工具函數
export const createTextStyle = (
  variant: keyof typeof typographyScale,
  theme: Theme,
  options: {
    color?: keyof Theme['colors'];
    weight?: 'normal' | 'bold';
    align?: 'left' | 'center' | 'right';
    transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  } = {}
): TextStyle => {
  const scale = typographyScale[variant];
  const {
    color = 'text',
    weight = 'normal',
    align = 'left',
    transform = 'none'
  } = options;

  return {
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    letterSpacing: scale.letterSpacing,
    fontFamily: theme.fonts.mono,
    color: theme.colors[color],
    fontWeight: weight,
    textAlign: align,
    textTransform: transform,
    // 像素風格特定設定
    includeFontPadding: false, // Android only
    textAlignVertical: 'center', // Android only
  };
};

// 預定義的文字樣式
export const createTypographyStyles = (theme: Theme) => ({
  // 標題樣式
  title: createTextStyle('h1', theme, { color: 'text', weight: 'bold' }),
  subtitle: createTextStyle('h3', theme, { color: 'textSecondary' }),
  heading: createTextStyle('h4', theme, { color: 'text', weight: 'bold' }),
  
  // 內文樣式
  body: createTextStyle('body1', theme, { color: 'text' }),
  bodySecondary: createTextStyle('body2', theme, { color: 'textSecondary' }),
  
  // 特殊樣式
  caption: createTextStyle('caption', theme, { color: 'textMuted' }),
  label: createTextStyle('label', theme, { color: 'textSecondary', transform: 'uppercase' }),
  button: createTextStyle('button', theme, { color: 'text', weight: 'bold', transform: 'uppercase' }),
  
  // 狀態相關樣式
  success: createTextStyle('body2', theme, { color: 'success', weight: 'bold' }),
  warning: createTextStyle('body2', theme, { color: 'warning', weight: 'bold' }),
  error: createTextStyle('body2', theme, { color: 'error', weight: 'bold' }),
  
  // 特殊用途
  code: {
    ...createTextStyle('body2', theme, { color: 'text' }),
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs / 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  // 像素風格的特殊文字效果
  pixelTitle: {
    ...createTextStyle('h2', theme, { color: 'accent', weight: 'bold', align: 'center' }),
    textShadowColor: theme.colors.border,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0, // 像素風格無模糊
  },
});

// 響應式文字大小工具
export const getResponsiveFontSize = (baseSize: number, screenWidth: number): number => {
  // 基於螢幕寬度調整字體大小
  const baseWidth = 375; // iPhone 8 寬度作為基準
  const scale = screenWidth / baseWidth;
  
  // 限制縮放範圍避免文字過大或過小
  const clampedScale = Math.max(0.8, Math.min(1.3, scale));
  
  return Math.round(baseSize * clampedScale);
};

// 行高計算工具
export const calculateLineHeight = (fontSize: number, ratio: number = 1.5): number => {
  return Math.round(fontSize * ratio);
};