// src/components/ui/RoomAnimations.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// 動畫類型定義
export type AnimationType = 'pulse' | 'glow' | 'float' | 'spin' | 'shake' | 'bounce';

interface RoomAnimationProps {
  children: React.ReactNode;
  type: AnimationType;
  duration?: number;
  intensity?: number;
  delay?: number;
  enabled?: boolean;
}

// 預設動畫配置
const ANIMATION_CONFIGS = {
  pulse: { duration: 1500, intensity: 0.2 },
  glow: { duration: 2000, intensity: 0.3 },
  float: { duration: 3000, intensity: 5 },
  spin: { duration: 4000, intensity: 1 },
  shake: { duration: 500, intensity: 3 },
  bounce: { duration: 1000, intensity: 0.3 },
};

export const RoomAnimation: React.FC<RoomAnimationProps> = ({
  children,
  type,
  duration,
  intensity,
  delay = 0,
  enabled = true,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const config = ANIMATION_CONFIGS[type];
  const animDuration = duration || config.duration;
  const animIntensity = intensity || config.intensity;

  useEffect(() => {
    if (!enabled) return;

    const startAnimation = () => {
      switch (type) {
        case 'pulse':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: animDuration / 2,
                easing: Easing.out(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: animDuration / 2,
                easing: Easing.in(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          );

        case 'glow':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: animDuration / 2,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: animDuration / 2,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
                useNativeDriver: true,
              }),
            ])
          );

        case 'float':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: animDuration / 2,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: -1,
                duration: animDuration / 2,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          );

        case 'spin':
          return Animated.loop(
            Animated.timing(animValue, {
              toValue: 1,
              duration: animDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          );

        case 'shake':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: animDuration / 8,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: -1,
                duration: animDuration / 4,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 1,
                duration: animDuration / 4,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: animDuration / 8,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.delay(animDuration * 2), // 暫停
            ])
          );

        case 'bounce':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: animDuration / 4,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: animDuration / 4,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.delay(animDuration / 2), // 暫停
            ])
          );

        default:
          return Animated.timing(animValue, {
            toValue: 1,
            duration: animDuration,
            useNativeDriver: true,
          });
      }
    };

    const animation = startAnimation();
    
    const timeout = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [type, animDuration, animIntensity, delay, enabled, animValue]);

  // 根據動畫類型計算變換
  const getAnimatedStyle = () => {
    switch (type) {
      case 'pulse':
        return {
          transform: [
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1 + animIntensity],
              }),
            },
          ],
        };

      case 'glow':
        return {
          opacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1 - animIntensity],
          }),
          shadowOpacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.8],
          }),
          shadowRadius: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 8],
          }),
        };

      case 'float':
        return {
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [-1, 1],
                outputRange: [-animIntensity, animIntensity],
              }),
            },
          ],
        };

      case 'spin':
        return {
          transform: [
            {
              rotate: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        };

      case 'shake':
        return {
          transform: [
            {
              translateX: animValue.interpolate({
                inputRange: [-1, 1],
                outputRange: [-animIntensity, animIntensity],
              }),
            },
          ],
        };

      case 'bounce':
        return {
          transform: [
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1 + animIntensity],
              }),
            },
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -animIntensity * 10],
              }),
            },
          ],
        };

      default:
        return {};
    }
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Animated.View style={getAnimatedStyle()}>
      {children}
    </Animated.View>
  );
};

// 組合動畫組件 - 可以同時應用多個動畫
interface CompositeAnimationProps {
  children: React.ReactNode;
  animations: Array<{
    type: AnimationType;
    duration?: number;
    intensity?: number;
    delay?: number;
  }>;
  enabled?: boolean;
}

export const CompositeAnimation: React.FC<CompositeAnimationProps> = ({
  children,
  animations,
  enabled = true,
}) => {
  // 從內到外套用動畫
  return animations.reduce((acc, anim, index) => (
    <RoomAnimation
      key={index}
      type={anim.type}
      duration={anim.duration}
      intensity={anim.intensity}
      delay={anim.delay}
      enabled={enabled}
    >
      {acc}
    </RoomAnimation>
  ), children as React.ReactElement);
};

// 預設動畫組合
export const PulseGlow: React.FC<{ children: React.ReactNode; enabled?: boolean }> = ({ 
  children, 
  enabled = true 
}) => (
  <CompositeAnimation
    animations={[
      { type: 'pulse', duration: 2000, intensity: 0.1 },
      { type: 'glow', duration: 3000, intensity: 0.3, delay: 500 },
    ]}
    enabled={enabled}
  >
    {children}
  </CompositeAnimation>
);

export const FloatSpin: React.FC<{ children: React.ReactNode; enabled?: boolean }> = ({ 
  children, 
  enabled = true 
}) => (
  <CompositeAnimation
    animations={[
      { type: 'float', duration: 4000, intensity: 3 },
      { type: 'spin', duration: 8000, intensity: 1 },
    ]}
    enabled={enabled}
  >
    {children}
  </CompositeAnimation>
);

export default RoomAnimation;