// src/styles/spacing.ts
import { ViewStyle } from 'react-native';
import { Theme } from './theme';

// 間距類型定義
export type SpacingKey = keyof Theme['spacing'];
export type SpacingSide = 'top' | 'right' | 'bottom' | 'left';
export type SpacingAxis = 'horizontal' | 'vertical';

// 間距工具函數
export const createSpacingStyle = (
  theme: Theme,
  config: {
    margin?: SpacingKey | Partial<Record<SpacingSide, SpacingKey>>;
    padding?: SpacingKey | Partial<Record<SpacingSide, SpacingKey>>;
  }
): ViewStyle => {
  const style: ViewStyle = {};

  // 處理 margin
  if (config.margin) {
    if (typeof config.margin === 'string') {
      style.margin = theme.spacing[config.margin];
    } else {
      if (config.margin.top) style.marginTop = theme.spacing[config.margin.top];
      if (config.margin.right) style.marginRight = theme.spacing[config.margin.right];
      if (config.margin.bottom) style.marginBottom = theme.spacing[config.margin.bottom];
      if (config.margin.left) style.marginLeft = theme.spacing[config.margin.left];
    }
  }

  // 處理 padding
  if (config.padding) {
    if (typeof config.padding === 'string') {
      style.padding = theme.spacing[config.padding];
    } else {
      if (config.padding.top) style.paddingTop = theme.spacing[config.padding.top];
      if (config.padding.right) style.paddingRight = theme.spacing[config.padding.right];
      if (config.padding.bottom) style.paddingBottom = theme.spacing[config.padding.bottom];
      if (config.padding.left) style.paddingLeft = theme.spacing[config.padding.left];
    }
  }

  return style;
};

// 軸向間距工具
export const createAxisSpacing = (
  theme: Theme,
  axis: SpacingAxis,
  spacing: SpacingKey,
  type: 'margin' | 'padding' = 'margin'
): ViewStyle => {
  const value = theme.spacing[spacing];
  
  if (axis === 'horizontal') {
    return type === 'margin' 
      ? { marginHorizontal: value }
      : { paddingHorizontal: value };
  } else {
    return type === 'margin'
      ? { marginVertical: value }
      : { paddingVertical: value };
  }
};

// 常用間距組合
export const createCommonSpacing = (theme: Theme) => ({
  // Container 樣式
  container: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
  },
  
  screenPadding: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.xxl, // 額外底部空間避免被底部導航遮蓋
  },
  
  cardPadding: {
    padding: theme.spacing.m,
  },
  
  sectionSpacing: {
    marginBottom: theme.spacing.l,
  },
  
  // 列表間距
  listItemSpacing: {
    marginBottom: theme.spacing.s,
  },
  
  listSectionSpacing: {
    marginBottom: theme.spacing.xl,
  },
  
  // 表單間距
  formFieldSpacing: {
    marginBottom: theme.spacing.m,
  },
  
  formSectionSpacing: {
    marginBottom: theme.spacing.l,
  },
  
  // 按鈕間距
  buttonSpacing: {
    marginVertical: theme.spacing.s,
  },
  
  buttonGroupSpacing: {
    marginBottom: theme.spacing.m,
  },
  
  // 內容間距
  contentSpacing: {
    marginBottom: theme.spacing.m,
  },
  
  textSpacing: {
    marginBottom: theme.spacing.s,
  },
  
  // 像素風格的特殊間距
  pixelBorder: {
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
  },
  
  pixelSeparator: {
    height: theme.borderWidth.normal,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.m,
  },
});

// 響應式間距工具
export const getResponsiveSpacing = (
  baseSpacing: number,
  screenWidth: number,
  breakpoints: { small: number; medium: number; large: number } = {
    small: 320,
    medium: 768,
    large: 1024
  }
): number => {
  if (screenWidth <= breakpoints.small) {
    return Math.round(baseSpacing * 0.75); // 小螢幕減少間距
  } else if (screenWidth <= breakpoints.medium) {
    return baseSpacing; // 中等螢幕保持原始間距
  } else {
    return Math.round(baseSpacing * 1.25); // 大螢幕增加間距
  }
};

// 安全區域工具
export const createSafeAreaSpacing = (
  theme: Theme,
  options: {
    top?: boolean;
    bottom?: boolean;
    horizontal?: boolean;
  } = {}
) => {
  const { top = true, bottom = true, horizontal = true } = options;
  
  return {
    ...(top && { paddingTop: theme.spacing.l }),
    ...(bottom && { paddingBottom: theme.spacing.l }),
    ...(horizontal && { paddingHorizontal: theme.spacing.m }),
  };
};

// Grid 系統工具
export const createGridSpacing = (
  theme: Theme,
  columns: number,
  gap: SpacingKey = 'm'
): ViewStyle => {
  const gapValue = theme.spacing[gap];
  const totalGap = gapValue * (columns - 1);
  
  return {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: gapValue, // 如果支援 gap 屬性
    // 如果不支援 gap，可以使用 marginRight 替代
  };
};

// 常用的間距快捷鍵
export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;