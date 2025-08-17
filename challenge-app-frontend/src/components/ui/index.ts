// src/components/ui/index.ts
// 統一導出所有 UI 組件

// 基礎組件
export { default as PixelButton } from './PixelButton';
export type { PixelButtonProps } from './PixelButton';

export { 
  default as PixelCard,
  LevelCard,
  MemberCard,
  StatsCard,
  SettingCard
} from './PixelCard';
export type { PixelCardProps } from './PixelCard';

export { default as PixelInput } from './PixelInput';
export type { PixelInputProps, PixelInputRef } from './PixelInput';

export { 
  default as PixelText,
  Title,
  Subtitle,
  Heading,
  Subheading,
  Body,
  BodySecondary,
  Caption,
  Label,
  ButtonText,
  ErrorText,
  SuccessText,
  WarningText,
  CodeText,
  PixelTitle,
  GlowText
} from './PixelText';
export type { PixelTextProps } from './PixelText';

export { 
  default as LoadingSpinner,
  FullScreenLoader,
  ButtonLoader,
  ContentLoader
} from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

// 重新導出樣式相關的工具
export { useTheme, useStyles, useThemeValue } from '../../contexts/ThemeContext';
export type { Theme, ThemeMode } from '../../styles/theme';