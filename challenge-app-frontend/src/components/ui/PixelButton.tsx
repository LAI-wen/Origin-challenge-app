// src/components/ui/PixelButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';
import { createTextStyle } from '../../styles/typography';

export interface PixelButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  // 按鈕變體
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  // 按鈕大小
  size?: 'small' | 'medium' | 'large';
  
  // 按鈕狀態
  loading?: boolean;
  disabled?: boolean;
  
  // 內容
  title?: string;
  children?: React.ReactNode;
  
  // 樣式自定義
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // 圖標支持
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // 完整寬度
  fullWidth?: boolean;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  title,
  children,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  ...props
}) => {
  const styles = useStyles(createButtonStyles);
  
  // 計算按鈕狀態
  const isDisabled = disabled || loading;
  
  // 獲取變體樣式
  const variantStyle = styles.variants[variant];
  const sizeStyle = styles.sizes[size];
  
  // 處理按下事件
  const handlePress = (event: any) => {
    if (!isDisabled && onPress) {
      onPress(event);
    }
  };
  
  // 渲染內容
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' ? styles.primaryText.color : styles.secondaryText.color}
          />
          {title && (
            <Text style={[styles.text, sizeStyle.text, variantStyle.text, textStyle, styles.loadingText]}>
              {title}
            </Text>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        {title && (
          <Text style={[styles.text, sizeStyle.text, variantStyle.text, textStyle]}>
            {title}
          </Text>
        )}
        
        {children}
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    );
  };
  
  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// 樣式創建函數
const createButtonStyles = (theme: Theme) => {
  const baseText = createTextStyle('button', theme, { weight: 'bold' });
  
  return {
    base: {
      borderRadius: theme.borderRadius,
      borderWidth: theme.borderWidth.normal,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
    } as ViewStyle,
    
    // 變體樣式
    variants: {
      primary: {
        container: {
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.accent,
          // 像素風格陰影效果
          shadowColor: 'transparent',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        } as ViewStyle,
        text: {
          ...baseText,
          color: theme.colors.background,
        } as TextStyle,
      },
      
      secondary: {
        container: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        } as ViewStyle,
        text: {
          ...baseText,
          color: theme.colors.text,
        } as TextStyle,
      },
      
      outline: {
        container: {
          backgroundColor: 'transparent',
          borderColor: theme.colors.accent,
        } as ViewStyle,
        text: {
          ...baseText,
          color: theme.colors.accent,
        } as TextStyle,
      },
      
      ghost: {
        container: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        } as ViewStyle,
        text: {
          ...baseText,
          color: theme.colors.accent,
        } as TextStyle,
      },
    },
    
    // 尺寸樣式
    sizes: {
      small: {
        container: {
          paddingHorizontal: theme.spacing.m,
          paddingVertical: theme.spacing.s,
          minHeight: 32,
        } as ViewStyle,
        text: {
          fontSize: 12,
          lineHeight: 16,
        } as TextStyle,
      },
      
      medium: {
        container: {
          paddingHorizontal: theme.spacing.l,
          paddingVertical: theme.spacing.m,
          minHeight: 48,
        } as ViewStyle,
        text: {
          fontSize: 14,
          lineHeight: 16,
        } as TextStyle,
      },
      
      large: {
        container: {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.l,
          minHeight: 56,
        } as ViewStyle,
        text: {
          fontSize: 16,
          lineHeight: 20,
        } as TextStyle,
      },
    },
    
    // 狀態樣式
    disabled: {
      opacity: 0.5,
    } as ViewStyle,
    
    fullWidth: {
      width: '100%',
    } as ViewStyle,
    
    // 內容佈局
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    
    text: {
      ...baseText,
      textAlign: 'center',
    } as TextStyle,
    
    loadingText: {
      marginLeft: theme.spacing.s,
    } as TextStyle,
    
    leftIcon: {
      marginRight: theme.spacing.s,
    } as ViewStyle,
    
    rightIcon: {
      marginLeft: theme.spacing.s,
    } as ViewStyle,
    
    // 文字顏色快速參考
    primaryText: {
      color: theme.colors.background,
    } as TextStyle,
    
    secondaryText: {
      color: theme.colors.text,
    } as TextStyle,
  };
};

// 預設匯出
export default PixelButton;