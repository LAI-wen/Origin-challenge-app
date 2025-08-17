// src/styles/common.ts
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Theme } from './theme';

// 常用的佈局樣式
export const createLayoutStyles = (theme: Theme) => ({
  // Flexbox 佈局
  flex1: { flex: 1 } as ViewStyle,
  flexRow: { flexDirection: 'row' } as ViewStyle,
  flexColumn: { flexDirection: 'column' } as ViewStyle,
  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  flexBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  flexAround: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as ViewStyle,
  flexWrap: { flexWrap: 'wrap' } as ViewStyle,
  
  // 對齊方式
  alignCenter: { alignItems: 'center' } as ViewStyle,
  alignStart: { alignItems: 'flex-start' } as ViewStyle,
  alignEnd: { alignItems: 'flex-end' } as ViewStyle,
  justifyCenter: { justifyContent: 'center' } as ViewStyle,
  justifyStart: { justifyContent: 'flex-start' } as ViewStyle,
  justifyEnd: { justifyContent: 'flex-end' } as ViewStyle,
  justifyBetween: { justifyContent: 'space-between' } as ViewStyle,
  justifyAround: { justifyContent: 'space-around' } as ViewStyle,
  
  // 定位
  absolute: { position: 'absolute' } as ViewStyle,
  relative: { position: 'relative' } as ViewStyle,
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,
  
  // 隱藏/顯示
  hidden: { opacity: 0 } as ViewStyle,
  visible: { opacity: 1 } as ViewStyle,
  invisible: { opacity: 0, pointerEvents: 'none' } as ViewStyle,
  
  // 溢出處理
  overflowHidden: { overflow: 'hidden' } as ViewStyle,
  overflowVisible: { overflow: 'visible' } as ViewStyle,
});

// 像素風格的邊框和陰影效果
export const createPixelEffects = (theme: Theme) => ({
  // 基礎邊框
  border: {
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
  } as ViewStyle,
  
  borderThin: {
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
  } as ViewStyle,
  
  borderThick: {
    borderWidth: theme.borderWidth.thick,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
  } as ViewStyle,
  
  // 特殊邊框效果
  borderDashed: {
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  } as ViewStyle,
  
  // 像素風格的「陰影」- 使用位移的邊框模擬
  pixelShadow: {
    borderBottomWidth: theme.borderWidth.thick,
    borderRightWidth: theme.borderWidth.thick,
    borderBottomColor: theme.colors.border,
    borderRightColor: theme.colors.border,
  } as ViewStyle,
  
  // 凹陷效果
  inset: {
    borderTopWidth: theme.borderWidth.normal,
    borderLeftWidth: theme.borderWidth.normal,
    borderTopColor: theme.colors.border,
    borderLeftColor: theme.colors.border,
  } as ViewStyle,
  
  // 凸起效果
  raised: {
    borderBottomWidth: theme.borderWidth.normal,
    borderRightWidth: theme.borderWidth.normal,
    borderBottomColor: theme.colors.border,
    borderRightColor: theme.colors.border,
  } as ViewStyle,
});

// 背景和表面樣式
export const createSurfaceStyles = (theme: Theme) => ({
  // 背景色
  backgroundPrimary: { backgroundColor: theme.colors.background } as ViewStyle,
  backgroundSurface: { backgroundColor: theme.colors.surface } as ViewStyle,
  backgroundSurfaceLight: { backgroundColor: theme.colors.surfaceLight } as ViewStyle,
  
  // 透明背景
  backgroundTransparent: { backgroundColor: 'transparent' } as ViewStyle,
  
  // 半透明遮罩
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  } as ViewStyle,
  
  // 漸變效果 (可能需要額外的漸變庫)
  surfaceElevated: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
  } as ViewStyle,
});

// 互動狀態樣式
export const createInteractionStyles = (theme: Theme) => ({
  // 可觸摸元素
  touchable: {
    minHeight: 44, // iOS 建議的最小觸摸區域
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  // 按下狀態
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  } as ViewStyle,
  
  // 停用狀態
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  } as ViewStyle,
  
  // 聚焦狀態
  focused: {
    borderColor: theme.colors.accent,
    borderWidth: theme.borderWidth.thick,
  } as ViewStyle,
  
  // 選中狀態
  selected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  } as ViewStyle,
});

// 圖片樣式
export const createImageStyles = (theme: Theme) => ({
  // 基礎圖片樣式
  image: {
    borderRadius: theme.borderRadius,
  } as ImageStyle,
  
  // 頭像樣式
  avatar: {
    borderRadius: theme.borderRadius,
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
  } as ImageStyle,
  
  // 像素風格圖片
  pixelImage: {
    borderRadius: theme.borderRadius,
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
    // 禁用抗鋸齒以保持像素效果
    resizeMode: 'pixelated' as any, // 這可能需要平台特定處理
  } as ImageStyle,
  
  // 圖標樣式
  icon: {
    tintColor: theme.colors.text,
  } as ImageStyle,
  
  iconAccent: {
    tintColor: theme.colors.accent,
  } as ImageStyle,
});

// 文字相關的通用樣式
export const createTextUtilities = (theme: Theme) => ({
  // 文字對齊
  textLeft: { textAlign: 'left' } as TextStyle,
  textCenter: { textAlign: 'center' } as TextStyle,
  textRight: { textAlign: 'right' } as TextStyle,
  
  // 文字裝飾
  textBold: { fontWeight: 'bold' } as TextStyle,
  textNormal: { fontWeight: 'normal' } as TextStyle,
  textUppercase: { textTransform: 'uppercase' } as TextStyle,
  textLowercase: { textTransform: 'lowercase' } as TextStyle,
  textCapitalize: { textTransform: 'capitalize' } as TextStyle,
  
  // 文字顏色
  textPrimary: { color: theme.colors.text } as TextStyle,
  textSecondary: { color: theme.colors.textSecondary } as TextStyle,
  textMuted: { color: theme.colors.textMuted } as TextStyle,
  textAccent: { color: theme.colors.accent } as TextStyle,
  textSuccess: { color: theme.colors.success } as TextStyle,
  textWarning: { color: theme.colors.warning } as TextStyle,
  textError: { color: theme.colors.error } as TextStyle,
  
  // 截斷文字
  textEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as TextStyle,
  
  // 多行截斷
  textClamp: {
    overflow: 'hidden',
    // React Native 沒有直接支援，需要使用 numberOfLines prop
  } as TextStyle,
});

// 響應式工具
export const createResponsiveUtils = () => ({
  // 根據螢幕尺寸隱藏/顯示
  showOnSmall: (screenWidth: number) => ({
    display: screenWidth < 768 ? 'flex' : 'none',
  }),
  
  showOnMedium: (screenWidth: number) => ({
    display: screenWidth >= 768 && screenWidth < 1024 ? 'flex' : 'none',
  }),
  
  showOnLarge: (screenWidth: number) => ({
    display: screenWidth >= 1024 ? 'flex' : 'none',
  }),
  
  hideOnSmall: (screenWidth: number) => ({
    display: screenWidth < 768 ? 'none' : 'flex',
  }),
});

// 工具函數 - 組合多個樣式
export const combineStyles = (...styles: Array<ViewStyle | TextStyle | ImageStyle | undefined>) => {
  return styles.filter(Boolean);
};

// 工具函數 - 條件樣式
export const conditionalStyle = <T extends ViewStyle | TextStyle | ImageStyle>(
  condition: boolean,
  style: T,
  fallbackStyle?: T
): T | {} => {
  return condition ? style : (fallbackStyle || {});
};

// 工具函數 - 樣式插值
export const interpolateStyle = (
  value: number,
  inputRange: number[],
  outputRange: any[]
): any => {
  // 簡單的線性插值實現
  if (value <= inputRange[0]) return outputRange[0];
  if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
  
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      const progress = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      const startValue = outputRange[i];
      const endValue = outputRange[i + 1];
      
      if (typeof startValue === 'number' && typeof endValue === 'number') {
        return startValue + (endValue - startValue) * progress;
      }
      
      return progress < 0.5 ? startValue : endValue;
    }
  }
  
  return outputRange[0];
};