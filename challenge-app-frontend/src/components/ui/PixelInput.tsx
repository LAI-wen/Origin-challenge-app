// src/components/ui/PixelInput.tsx
import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';
import { createTextStyle } from '../../styles/typography';

export interface PixelInputProps extends Omit<TextInputProps, 'style'> {
  // 輸入框變體
  variant?: 'default' | 'outlined' | 'filled' | 'borderless';
  
  // 輸入框大小
  size?: 'small' | 'medium' | 'large';
  
  // 標籤和提示
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  
  // 狀態
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  
  // 樣式自定義
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  
  // 圖標支持
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // 完整寬度
  fullWidth?: boolean;
  
  // 多行文本
  multiline?: boolean;
  numberOfLines?: number;
  
  // 特殊輸入類型
  inputType?: 'text' | 'email' | 'password' | 'numeric' | 'phone';
  
  // 動作按鈕
  actionButton?: {
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel?: string;
  };
}

export interface PixelInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

export const PixelInput = forwardRef<PixelInputRef, PixelInputProps>(({
  variant = 'default',
  size = 'medium',
  label,
  placeholder,
  helperText,
  errorMessage,
  error = false,
  disabled = false,
  required = false,
  style,
  inputStyle,
  labelStyle,
  leftIcon,
  rightIcon,
  fullWidth = true,
  multiline = false,
  numberOfLines = 1,
  inputType = 'text',
  actionButton,
  value,
  onChangeText,
  ...props
}, ref) => {
  const styles = useStyles(createInputStyles);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  // 暴露給父組件的方法
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
    getValue: () => value || '',
  }));
  
  // 計算輸入狀態
  const hasError = error || !!errorMessage;
  const hasValue = !!value;
  
  // 獲取樣式
  const variantStyle = styles.variants[variant];
  const sizeStyle = styles.sizes[size];
  
  // 處理焦點事件
  const handleFocus = (e: any) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };
  
  // 處理密碼可見性切換
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  // 獲取鍵盤類型
  const getKeyboardType = () => {
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'numeric':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };
  
  // 獲取安全文本輸入
  const getSecureTextEntry = () => {
    return inputType === 'password' && !isPasswordVisible;
  };
  
  // 渲染密碼切換按鈕
  const renderPasswordToggle = () => {
    if (inputType !== 'password') return null;
    
    return (
      <TouchableOpacity
        onPress={togglePasswordVisibility}
        style={styles.actionButton}
        accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
      >
        <Text style={styles.passwordToggleText}>
          {isPasswordVisible ? '隐' : '显'}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // 渲染右側內容
  const renderRightContent = () => {
    if (inputType === 'password') {
      return renderPasswordToggle();
    }
    
    if (actionButton) {
      return (
        <TouchableOpacity
          onPress={actionButton.onPress}
          style={styles.actionButton}
          accessibilityLabel={actionButton.accessibilityLabel}
        >
          {actionButton.icon}
        </TouchableOpacity>
      );
    }
    
    if (rightIcon) {
      return <View style={styles.rightIcon}>{rightIcon}</View>;
    }
    
    return null;
  };
  
  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      {/* 標籤 */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      {/* 輸入框容器 */}
      <View style={[
        styles.inputContainer,
        variantStyle,
        sizeStyle.container,
        isFocused && styles.focused,
        hasError && styles.error,
        disabled && styles.disabled,
      ]}>
        {/* 左側圖標 */}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        {/* 文本輸入 */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            sizeStyle.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={styles.placeholder.color}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={getKeyboardType()}
          secureTextEntry={getSecureTextEntry()}
          autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
          autoCorrect={inputType !== 'email' && inputType !== 'password'}
          {...props}
        />
        
        {/* 右側內容 */}
        {renderRightContent()}
      </View>
      
      {/* 幫助文字或錯誤信息 */}
      {(helperText || errorMessage) && (
        <View style={styles.helpTextContainer}>
          <Text style={[
            styles.helpText,
            hasError && styles.errorText,
          ]}>
            {errorMessage || helperText}
          </Text>
        </View>
      )}
    </View>
  );
});

// 樣式創建函數
const createInputStyles = (theme: Theme) => {
  const baseText = createTextStyle('body1', theme);
  const labelText = createTextStyle('label', theme, { color: 'textSecondary' });
  const helpText = createTextStyle('caption', theme, { color: 'textMuted' });
  
  return {
    container: {
      marginBottom: theme.spacing.s,
    } as ViewStyle,
    
    fullWidth: {
      width: '100%',
    } as ViewStyle,
    
    // 標籤樣式
    labelContainer: {
      marginBottom: theme.spacing.xs,
    } as ViewStyle,
    
    label: {
      ...labelText,
      fontWeight: 'bold',
    } as TextStyle,
    
    required: {
      color: theme.colors.error,
    } as TextStyle,
    
    // 輸入框容器
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius,
      borderWidth: theme.borderWidth.normal,
      overflow: 'hidden',
    } as ViewStyle,
    
    // 變體樣式
    variants: {
      default: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      } as ViewStyle,
      
      outlined: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border,
      } as ViewStyle,
      
      filled: {
        backgroundColor: theme.colors.surfaceLight,
        borderColor: theme.colors.surfaceLight,
      } as ViewStyle,
      
      borderless: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderBottomWidth: theme.borderWidth.normal,
        borderBottomColor: theme.colors.border,
        borderRadius: 0,
      } as ViewStyle,
    },
    
    // 尺寸樣式
    sizes: {
      small: {
        container: {
          minHeight: 32,
        } as ViewStyle,
        input: {
          fontSize: 12,
          paddingHorizontal: theme.spacing.s,
          paddingVertical: theme.spacing.xs,
        } as TextStyle,
      },
      
      medium: {
        container: {
          minHeight: 48,
        } as ViewStyle,
        input: {
          fontSize: 16,
          paddingHorizontal: theme.spacing.m,
          paddingVertical: theme.spacing.m,
        } as TextStyle,
      },
      
      large: {
        container: {
          minHeight: 56,
        } as ViewStyle,
        input: {
          fontSize: 18,
          paddingHorizontal: theme.spacing.l,
          paddingVertical: theme.spacing.l,
        } as TextStyle,
      },
    },
    
    // 輸入框樣式
    input: {
      flex: 1,
      ...baseText,
      fontFamily: theme.fonts.mono,
      color: theme.colors.text,
      textAlignVertical: 'center',
      includeFontPadding: false,
    } as TextStyle,
    
    multilineInput: {
      textAlignVertical: 'top',
      paddingTop: theme.spacing.m,
    } as TextStyle,
    
    placeholder: {
      color: theme.colors.textMuted,
    } as TextStyle,
    
    // 圖標樣式
    leftIcon: {
      marginLeft: theme.spacing.s,
      marginRight: theme.spacing.xs,
    } as ViewStyle,
    
    rightIcon: {
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.s,
    } as ViewStyle,
    
    actionButton: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 32,
    } as ViewStyle,
    
    passwordToggleText: {
      ...createTextStyle('caption', theme, { color: 'textSecondary' }),
      fontWeight: 'bold',
    } as TextStyle,
    
    // 狀態樣式
    focused: {
      borderColor: theme.colors.accent,
      borderWidth: theme.borderWidth.thick,
    } as ViewStyle,
    
    error: {
      borderColor: theme.colors.error,
      borderWidth: theme.borderWidth.thick,
    } as ViewStyle,
    
    disabled: {
      opacity: 0.5,
      backgroundColor: theme.colors.background,
    } as ViewStyle,
    
    // 幫助文字
    helpTextContainer: {
      marginTop: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    } as ViewStyle,
    
    helpText: {
      ...helpText,
    } as TextStyle,
    
    errorText: {
      color: theme.colors.error,
    } as TextStyle,
  };
};

// 預設匯出
export default PixelInput;