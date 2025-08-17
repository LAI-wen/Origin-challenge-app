// src/components/ui/PixelText.tsx
import React from 'react';
import {
  Text,
  TextProps,
  TextStyle,
} from 'react-native';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';
import { createTextStyle, typographyScale } from '../../styles/typography';

export interface PixelTextProps extends Omit<TextProps, 'style'> {
  // 文字變體
  variant?: 
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'body1' | 'body2' 
    | 'caption' | 'overline' 
    | 'button' | 'label';
  
  // 文字顏色
  color?: 
    | 'text' | 'textSecondary' | 'textMuted'
    | 'accent' | 'success' | 'warning' | 'error'
    | 'background' | 'surface';
  
  // 文字粗細
  weight?: 'normal' | 'bold';
  
  // 文字對齊
  align?: 'left' | 'center' | 'right';
  
  // 文字變換
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  // 特殊效果
  pixelShadow?: boolean;
  glow?: boolean;
  
  // 文字截斷
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  
  // 樣式自定義
  style?: TextStyle;
  
  // 內容
  children: React.ReactNode;
  
  // 可選功能
  selectable?: boolean;
  
  // 響應式字體大小
  responsive?: boolean;
  
  // 特殊文字樣式
  monospace?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export const PixelText: React.FC<PixelTextProps> = ({
  variant = 'body1',
  color = 'text',
  weight = 'normal',
  align = 'left',
  transform = 'none',
  pixelShadow = false,
  glow = false,
  numberOfLines,
  ellipsizeMode = 'tail',
  style,
  children,
  selectable = false,
  responsive = false,
  monospace = true, // 預設使用等寬字體以符合像素風格
  italic = false,
  underline = false,
  strikethrough = false,
  ...props
}) => {
  const styles = useStyles((theme) => createTextStyles(theme, {
    variant,
    color,
    weight,
    align,
    transform,
    pixelShadow,
    glow,
    monospace,
    italic,
    underline,
    strikethrough,
    responsive,
  }));
  
  return (
    <Text
      style={[styles.text, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      selectable={selectable}
      {...props}
    >
      {children}
    </Text>
  );
};

// 樣式創建函數
const createTextStyles = (
  theme: Theme, 
  options: {
    variant: PixelTextProps['variant'];
    color: PixelTextProps['color'];
    weight: PixelTextProps['weight'];
    align: PixelTextProps['align'];
    transform: PixelTextProps['transform'];
    pixelShadow: boolean;
    glow: boolean;
    monospace: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    responsive: boolean;
  }
) => {
  const baseStyle = createTextStyle(options.variant!, theme, {
    color: options.color!,
    weight: options.weight!,
    align: options.align!,
    transform: options.transform!,
  });
  
  // 響應式字體大小調整（簡化版）
  const fontSize = options.responsive 
    ? Math.max(12, (baseStyle.fontSize || 16) * 0.9) // 簡單的響應式調整
    : (baseStyle.fontSize || 16);
  
  const textStyle: TextStyle = {
    ...baseStyle,
    fontSize,
    
    // 字體樣式
    fontFamily: options.monospace ? theme.fonts.mono : baseStyle.fontFamily,
    fontStyle: options.italic ? 'italic' : 'normal',
    
    // 文字裝飾
    textDecorationLine: getTextDecorationLine(options.underline, options.strikethrough),
    
    // 像素陰影效果
    ...(options.pixelShadow && {
      textShadowColor: theme.colors.border,
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 0, // 像素風格無模糊
    }),
    
    // 發光效果（用多重陰影模擬）
    ...(options.glow && {
      textShadowColor: theme.colors.accent,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 2,
    }),
  };
  
  return {
    text: textStyle,
  };
};

// 工具函數：獲取文字裝飾線
const getTextDecorationLine = (underline: boolean, strikethrough: boolean): TextStyle['textDecorationLine'] => {
  if (underline && strikethrough) return 'underline line-through';
  if (underline) return 'underline';
  if (strikethrough) return 'line-through';
  return 'none';
};

// 預定義的文字組件變體

/**
 * 標題文字
 */
export const Title: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="h1" weight="bold" {...props} />
);

/**
 * 副標題文字
 */
export const Subtitle: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="h3" color="textSecondary" {...props} />
);

/**
 * 標題文字
 */
export const Heading: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="h4" weight="bold" {...props} />
);

/**
 * 小標題文字
 */
export const Subheading: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="h5" {...props} />
);

/**
 * 正文文字
 */
export const Body: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="body1" {...props} />
);

/**
 * 次要正文文字
 */
export const BodySecondary: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="body2" color="textSecondary" {...props} />
);

/**
 * 說明文字
 */
export const Caption: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="caption" color="textMuted" {...props} />
);

/**
 * 標籤文字
 */
export const Label: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="label" color="textSecondary" transform="uppercase" {...props} />
);

/**
 * 按鈕文字
 */
export const ButtonText: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => (
  <PixelText variant="button" weight="bold" transform="uppercase" {...props} />
);

/**
 * 錯誤文字
 */
export const ErrorText: React.FC<Omit<PixelTextProps, 'variant' | 'color'>> = (props) => (
  <PixelText variant="body2" color="error" weight="bold" {...props} />
);

/**
 * 成功文字
 */
export const SuccessText: React.FC<Omit<PixelTextProps, 'variant' | 'color'>> = (props) => (
  <PixelText variant="body2" color="success" weight="bold" {...props} />
);

/**
 * 警告文字
 */
export const WarningText: React.FC<Omit<PixelTextProps, 'variant' | 'color'>> = (props) => (
  <PixelText variant="body2" color="warning" weight="bold" {...props} />
);

/**
 * 代碼文字
 */
export const CodeText: React.FC<Omit<PixelTextProps, 'variant'>> = (props) => {
  const styles = useStyles((theme) => ({
    code: {
      backgroundColor: theme.colors.surfaceLight,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs / 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius,
    },
  }));
  
  return (
    <PixelText 
      variant="body2" 
      monospace 
      style={styles.code}
      {...props} 
    />
  );
};

/**
 * 像素風格特效文字
 */
export const PixelTitle: React.FC<Omit<PixelTextProps, 'variant' | 'pixelShadow'>> = (props) => (
  <PixelText 
    variant="h2" 
    color="accent" 
    weight="bold" 
    align="center" 
    pixelShadow 
    {...props} 
  />
);

/**
 * 發光文字
 */
export const GlowText: React.FC<Omit<PixelTextProps, 'glow'>> = (props) => (
  <PixelText glow {...props} />
);

// 預設匯出
export default PixelText;