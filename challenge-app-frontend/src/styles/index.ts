// src/styles/index.ts
// 統一導出所有樣式模組

export * from './theme';
export * from './typography';
export * from './spacing';
export * from './common';

// 重新導出常用的類型和函數以便使用
export type { 
  Theme, 
  ThemeColors, 
  ThemeMode 
} from './theme';

export type { 
  TypographyScale
} from './typography';

export type { 
  SpacingKey, 
  SpacingSide, 
  SpacingAxis 
} from './spacing';

// 導出最常用的工具函數
export { 
  getTheme, 
  createPixelButtonStyle, 
  createPixelCardStyle, 
  createPixelInputStyle 
} from './theme';

export { 
  createTextStyle, 
  createTypographyStyles 
} from './typography';

export { 
  createSpacingStyle, 
  createCommonSpacing 
} from './spacing';

export { 
  createLayoutStyles, 
  createPixelEffects, 
  createSurfaceStyles, 
  createInteractionStyles,
  combineStyles,
  conditionalStyle 
} from './common';