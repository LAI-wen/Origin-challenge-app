// src/components/ui/LoadingSpinner.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';
import { PixelText } from './PixelText';

export interface LoadingSpinnerProps {
  // 載入動畫變體
  variant?: 'dots' | 'bars' | 'square' | 'text';
  
  // 大小
  size?: 'small' | 'medium' | 'large';
  
  // 顏色
  color?: string;
  
  // 載入文字
  text?: string;
  
  // 樣式自定義
  style?: ViewStyle;
  
  // 動畫速度
  duration?: number;
  
  // 是否顯示
  visible?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'dots',
  size = 'medium',
  color,
  text,
  style,
  duration = 1200,
  visible = true,
}) => {
  const styles = useStyles((theme) => createSpinnerStyles(theme, size, color));
  
  if (!visible) return null;
  
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner styles={styles} duration={duration} />;
      case 'bars':
        return <BarsSpinner styles={styles} duration={duration} />;
      case 'square':
        return <SquareSpinner styles={styles} duration={duration} />;
      case 'text':
        return <TextSpinner styles={styles} duration={duration} />;
      default:
        return <DotsSpinner styles={styles} duration={duration} />;
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {renderSpinner()}
      {text && (
        <PixelText 
          variant="caption" 
          color="textSecondary" 
          align="center"
          style={styles.text}
        >
          {text}
        </PixelText>
      )}
    </View>
  );
};

// 點狀載入動畫
const DotsSpinner: React.FC<{ styles: any; duration: number }> = ({ styles, duration }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animateDot = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration / 3,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration / 3,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, duration / 6),
      animateDot(dot3, duration / 3),
    ]).start();
  }, [dot1, dot2, dot3, duration]);
  
  const animatedStyle = (animValue: Animated.Value) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [{
      scale: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.2],
      }),
    }],
  });
  
  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, animatedStyle(dot1)]} />
      <Animated.View style={[styles.dot, animatedStyle(dot2)]} />
      <Animated.View style={[styles.dot, animatedStyle(dot3)]} />
    </View>
  );
};

// 條狀載入動畫
const BarsSpinner: React.FC<{ styles: any; duration: number }> = ({ styles, duration }) => {
  const bars = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  useEffect(() => {
    const animateBar = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration / 4,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration / 4,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    Animated.parallel(
      bars.map((bar, index) => animateBar(bar, index * (duration / 8)))
    ).start();
  }, [bars, duration]);
  
  const animatedBarStyle = (animValue: Animated.Value) => ({
    transform: [{
      scaleY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
      }),
    }],
  });
  
  return (
    <View style={styles.barsContainer}>
      {bars.map((bar, index) => (
        <Animated.View 
          key={index} 
          style={[styles.bar, animatedBarStyle(bar)]} 
        />
      ))}
    </View>
  );
};

// 方塊旋轉動畫
const SquareSpinner: React.FC<{ styles: any; duration: number }> = ({ styles, duration }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation, duration]);
  
  const animatedStyle = {
    transform: [{
      rotate: rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    }],
  };
  
  return (
    <View style={styles.squareContainer}>
      <Animated.View style={[styles.square, animatedStyle]} />
    </View>
  );
};

// 文字動畫
const TextSpinner: React.FC<{ styles: any; duration: number }> = ({ styles, duration }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity, duration]);
  
  const animatedStyle = { opacity };
  
  return (
    <View style={styles.textContainer}>
      <Animated.View style={animatedStyle}>
        <PixelText variant="h6" color="accent" align="center">
          LOADING
        </PixelText>
      </Animated.View>
    </View>
  );
};

// 樣式創建函數
const createSpinnerStyles = (theme: Theme, size: string, customColor?: string) => {
  const color = customColor || theme.colors.accent;
  const dimensions = getSizeDimensions(size);
  
  return {
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
    } as ViewStyle,
    
    text: {
      marginTop: theme.spacing.s,
    } as ViewStyle,
    
    // 點狀動畫樣式
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: dimensions.width,
      height: dimensions.height,
    } as ViewStyle,
    
    dot: {
      width: dimensions.dotSize,
      height: dimensions.dotSize,
      backgroundColor: color,
      borderRadius: 0, // 像素風格不用圓角
    } as ViewStyle,
    
    // 條狀動畫樣式
    barsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      width: dimensions.width,
      height: dimensions.height,
    } as ViewStyle,
    
    bar: {
      width: dimensions.barWidth,
      height: dimensions.height,
      backgroundColor: color,
      borderRadius: 0,
    } as ViewStyle,
    
    // 方塊動畫樣式
    squareContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: dimensions.width,
      height: dimensions.height,
    } as ViewStyle,
    
    square: {
      width: dimensions.squareSize,
      height: dimensions.squareSize,
      backgroundColor: 'transparent',
      borderWidth: theme.borderWidth.thick,
      borderColor: color,
      borderRadius: 0,
    } as ViewStyle,
    
    // 文字動畫樣式
    textContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: dimensions.width,
      height: dimensions.height,
    } as ViewStyle,
  };
};

// 獲取尺寸配置
const getSizeDimensions = (size: string) => {
  switch (size) {
    case 'small':
      return {
        width: 32,
        height: 16,
        dotSize: 4,
        barWidth: 3,
        squareSize: 16,
      };
    case 'medium':
      return {
        width: 48,
        height: 24,
        dotSize: 6,
        barWidth: 4,
        squareSize: 24,
      };
    case 'large':
      return {
        width: 64,
        height: 32,
        dotSize: 8,
        barWidth: 6,
        squareSize: 32,
      };
    default:
      return {
        width: 48,
        height: 24,
        dotSize: 6,
        barWidth: 4,
        squareSize: 24,
      };
  }
};

// 預定義的載入組件變體

/**
 * 全屏載入
 */
export const FullScreenLoader: React.FC<Omit<LoadingSpinnerProps, 'style'>> = (props) => {
  const styles = useStyles((theme) => ({
    fullscreen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background + 'E6', // 90% 透明度
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    } as ViewStyle,
  }));
  
  return (
    <View style={styles.fullscreen}>
      <LoadingSpinner size="large" {...props} />
    </View>
  );
};

/**
 * 按鈕載入
 */
export const ButtonLoader: React.FC<Omit<LoadingSpinnerProps, 'size' | 'variant'>> = (props) => (
  <LoadingSpinner size="small" variant="dots" {...props} />
);

/**
 * 內容載入
 */
export const ContentLoader: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner variant="bars" text="Loading content..." {...props} />
);

// 預設匯出
export default LoadingSpinner;