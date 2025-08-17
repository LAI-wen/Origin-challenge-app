// src/components/ui/PixelCard.tsx
import React from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';

export interface PixelCardProps extends Omit<TouchableOpacityProps, 'style'> {
  // 卡片變體
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  
  // 卡片大小
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  // 內容
  children: React.ReactNode;
  
  // 樣式自定義
  style?: ViewStyle;
  
  // 互動性
  touchable?: boolean;
  pressable?: boolean;
  
  // 狀態
  selected?: boolean;
  disabled?: boolean;
  
  // 邊框自定義
  borderColor?: string;
  borderWidth?: number;
  
  // 背景自定義
  backgroundColor?: string;
}

export const PixelCard: React.FC<PixelCardProps> = ({
  variant = 'default',
  padding = 'medium',
  children,
  style,
  touchable = false,
  pressable = false,
  selected = false,
  disabled = false,
  borderColor,
  borderWidth,
  backgroundColor,
  onPress,
  ...props
}) => {
  const styles = useStyles(createCardStyles);
  
  // 計算是否可互動
  const isInteractive = touchable || pressable || !!onPress;
  const isDisabled = disabled;
  
  // 獲取變體和大小樣式
  const variantStyle = styles.variants[variant];
  const paddingStyle = styles.paddings[padding];
  
  // 處理按下事件
  const handlePress = (event: any) => {
    if (!isDisabled && onPress) {
      onPress(event);
    }
  };
  
  // 自定義樣式覆蓋
  const customStyle: ViewStyle = {
    ...(borderColor && { borderColor }),
    ...(borderWidth !== undefined && { borderWidth }),
    ...(backgroundColor && { backgroundColor }),
  };
  
  // 如果可互動，使用 TouchableOpacity
  if (isInteractive) {
    return (
      <TouchableOpacity
        {...props}
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.base,
          variantStyle,
          paddingStyle,
          selected && styles.selected,
          isDisabled && styles.disabled,
          customStyle,
          style,
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  // 否則使用普通 View
  return (
    <View
      style={[
        styles.base,
        variantStyle,
        paddingStyle,
        selected && styles.selected,
        isDisabled && styles.disabled,
        customStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// 樣式創建函數
const createCardStyles = (theme: Theme) => ({
  base: {
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
  } as ViewStyle,
  
  // 變體樣式
  variants: {
    default: {
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borderWidth.normal,
      borderColor: theme.colors.border,
    } as ViewStyle,
    
    elevated: {
      backgroundColor: theme.colors.surfaceLight,
      borderWidth: theme.borderWidth.normal,
      borderColor: theme.colors.border,
      // 像素風格的「陰影」效果
      borderBottomWidth: theme.borderWidth.thick,
      borderRightWidth: theme.borderWidth.thick,
      borderBottomColor: theme.colors.border,
      borderRightColor: theme.colors.border,
    } as ViewStyle,
    
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: theme.borderWidth.normal,
      borderColor: theme.colors.border,
    } as ViewStyle,
    
    flat: {
      backgroundColor: theme.colors.surface,
      borderWidth: 0,
    } as ViewStyle,
  },
  
  // 內邊距樣式
  paddings: {
    none: {
      padding: 0,
    } as ViewStyle,
    
    small: {
      padding: theme.spacing.s,
    } as ViewStyle,
    
    medium: {
      padding: theme.spacing.m,
    } as ViewStyle,
    
    large: {
      padding: theme.spacing.l,
    } as ViewStyle,
  },
  
  // 狀態樣式
  selected: {
    borderColor: theme.colors.accent,
    borderWidth: theme.borderWidth.thick,
    backgroundColor: theme.colors.surfaceLight,
  } as ViewStyle,
  
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});

// 專用的卡片組件變體

/**
 * 級別卡片 - 專門用於顯示挑戰級別
 */
export const LevelCard: React.FC<PixelCardProps> = (props) => {
  return (
    <PixelCard
      variant="elevated"
      padding="medium"
      touchable
      {...props}
    />
  );
};

/**
 * 成員卡片 - 專門用於顯示成員信息
 */
export const MemberCard: React.FC<PixelCardProps> = (props) => {
  return (
    <PixelCard
      variant="outlined"
      padding="small"
      {...props}
    />
  );
};

/**
 * 統計卡片 - 專門用於顯示數據統計
 */
export const StatsCard: React.FC<PixelCardProps> = (props) => {
  return (
    <PixelCard
      variant="flat"
      padding="medium"
      {...props}
    />
  );
};

/**
 * 設置卡片 - 專門用於設置選項
 */
export const SettingCard: React.FC<PixelCardProps> = (props) => {
  return (
    <PixelCard
      variant="default"
      padding="medium"
      touchable
      {...props}
    />
  );
};

// 預設匯出
export default PixelCard;