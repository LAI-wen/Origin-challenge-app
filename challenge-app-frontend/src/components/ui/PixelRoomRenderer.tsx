// src/components/ui/PixelRoomRenderer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { RoomState } from '../../services/level.service';
import { Theme } from '../../styles/theme';
import { useStyles } from '../../contexts/ThemeContext';
import { PixelText } from './PixelText';
import { useTranslation } from 'react-i18next';
import { RoomAnimation, PulseGlow, FloatSpin } from './RoomAnimations';

interface PixelRoomRendererProps {
  roomState: RoomState;
  levelName?: string;
  width?: number;
  height?: number;
  animated?: boolean;
  onElementPress?: (element: string) => void;
}

// 房間主題定義
interface RoomTheme {
  name: string;
  palette: string[];
  patterns: RoomPatterns;
  animations?: AnimationConfig[];
}

interface RoomPatterns {
  wall: number[][];
  floor: number[][];
  door_locked: number[][];
  door_unlocked: number[][];
  window: number[][];
  furniture: number[][];
  items: { [key: string]: number[][] };
  decorations: number[][];
}

interface AnimationConfig {
  element: string;
  type: 'pulse' | 'float' | 'glow' | 'spin';
  duration: number;
  intensity: number;
}

// 像素圖案 - 16x16 高解析度
const PIXEL_SIZE = 3;
const ROOM_WIDTH = 32;
const ROOM_HEIGHT = 24;

// 經典主題
const CLASSIC_THEME: RoomTheme = {
  name: 'classic',
  palette: [
    'transparent',    // 0 - 透明
    '#2c3e50',       // 1 - 深藍灰 (牆壁)
    '#34495e',       // 2 - 中灰 (地板)
    '#ecf0f1',       // 3 - 淺灰 (高光)
    '#e74c3c',       // 4 - 紅色 (鎖/危險)
    '#3498db',       // 5 - 藍色 (水/魔法)
    '#2ecc71',       // 6 - 綠色 (成功/自然)
    '#f39c12',       // 7 - 橙色 (光/溫暖)
    '#9b59b6',       // 8 - 紫色 (神秘)
    '#95a5a6',       // 9 - 中性灰
    '#ffffff',       // 10 - 純白
  ],
  patterns: {
    wall: generateWallPattern(),
    floor: generateFloorPattern(),
    door_locked: generateLockedDoorPattern(),
    door_unlocked: generateUnlockedDoorPattern(),
    window: generateWindowPattern(),
    furniture: generateFurniturePattern(),
    items: {
      key: generateKeyPattern(),
      lamp: generateLampPattern(),
      book: generateBookPattern(),
    },
    decorations: generateDecorationsPattern(),
  },
  animations: [
    { element: 'door_unlocked', type: 'glow', duration: 2000, intensity: 0.3 },
    { element: 'key', type: 'pulse', duration: 1500, intensity: 0.2 },
    { element: 'lamp', type: 'glow', duration: 3000, intensity: 0.4 },
  ]
};

// 暗黑主題
const DARK_THEME: RoomTheme = {
  name: 'dark',
  palette: [
    'transparent',    // 0
    '#1a1a1a',       // 1 - 深黑
    '#2d2d2d',       // 2 - 深灰
    '#404040',       // 3 - 中灰
    '#ff6b6b',       // 4 - 深紅
    '#4ecdc4',       // 5 - 青色
    '#45b7d1',       // 6 - 藍色
    '#feca57',       // 7 - 金色
    '#a55eea',       // 8 - 紫色
    '#778ca3',       // 9 - 藍灰
    '#f1f2f6',       // 10 - 淺色
  ],
  patterns: {
    wall: generateWallPattern(),
    floor: generateFloorPattern(),
    door_locked: generateLockedDoorPattern(),
    door_unlocked: generateUnlockedDoorPattern(),
    window: generateWindowPattern(),
    furniture: generateFurniturePattern(),
    items: {
      key: generateKeyPattern(),
      lamp: generateLampPattern(),
      book: generateBookPattern(),
    },
    decorations: generateDecorationsPattern(),
  },
  animations: [
    { element: 'door_unlocked', type: 'pulse', duration: 2500, intensity: 0.4 },
    { element: 'key', type: 'glow', duration: 2000, intensity: 0.3 },
  ]
};

// 主題映射
const THEMES: { [key: string]: RoomTheme } = {
  classic: CLASSIC_THEME,
  dark: DARK_THEME,
};

export const PixelRoomRenderer: React.FC<PixelRoomRendererProps> = ({
  roomState,
  levelName = "Room",
  width = 320,
  height = 240,
  animated = true,
  onElementPress,
}) => {
  const styles = useStyles(createPixelRoomRendererStyles);
  const { t } = useTranslation();
  
  // 動畫值
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // 渲染狀態
  const [renderFrame, setRenderFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 獲取主題
  const theme = THEMES[roomState.theme || 'classic'] || THEMES.classic;
  
  // 計算房間狀態
  const progress = roomState.escapeCondition?.current || 0;
  const target = roomState.escapeCondition?.target || 30;
  const progressPercentage = Math.min(100, (progress / target) * 100);
  const isLocked = roomState.locked !== false;
  const isNearComplete = progressPercentage >= 75;
  const isComplete = progressPercentage >= 100;

  // 動畫效果
  useEffect(() => {
    if (!animated) return;

    // 脈衝動畫
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // 發光動畫
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [animated, pulseAnim, glowAnim]);

  // 渲染房間場景
  const renderRoom = () => {
    // 這裡將實現實際的像素渲染邏輯
    // 暫時用簡化版本展示結構
  };

  // 處理元素點擊
  const handleElementPress = (element: string) => {
    if (onElementPress) {
      onElementPress(element);
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {/* 房間畫布 */}
      <View style={styles.roomCanvas}>
        {/* 背景 */}
        <View style={[styles.background, { backgroundColor: theme.palette[2] }]} />
        
        {/* 牆壁 */}
        <View style={[styles.walls, { borderColor: theme.palette[1] }]} />
        
        {/* 門 */}
        <TouchableOpacity 
          style={styles.door}
          onPress={() => handleElementPress('door')}
          activeOpacity={0.8}
        >
          <PulseGlow enabled={isComplete}>
            <RoomAnimation 
              type="glow" 
              enabled={!isLocked && isNearComplete}
              duration={2000}
              intensity={0.4}
            >
              <View 
                style={[
                  styles.doorElement,
                  { 
                    backgroundColor: isLocked ? theme.palette[4] : theme.palette[6],
                  }
                ]}
              >
                <PixelText variant="h3" align="center" color="text">
                  {isLocked ? '🔒' : '🔓'}
                </PixelText>
              </View>
            </RoomAnimation>
          </PulseGlow>
        </TouchableOpacity>

        {/* 進度指示器 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: isComplete ? theme.palette[6] : theme.palette[5]
                }
              ]}
            />
          </View>
          
          <PixelText variant="caption" color="text" align="center" style={styles.progressText}>
            {progress}/{target}
          </PixelText>
        </View>

        {/* 房間物品 */}
        {roomState.items && roomState.items.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            style={[
              styles.roomItem,
              { 
                left: 40 + (index * 30),
                top: height * 0.6 + (index % 2) * 20
              }
            ]}
            onPress={() => handleElementPress(item)}
          >
            <FloatSpin enabled={index % 2 === 0}>
              <RoomAnimation
                type="pulse"
                enabled={true}
                duration={1500 + (index * 200)}
                intensity={0.15}
                delay={index * 100}
              >
                <View
                  style={[
                    styles.itemElement,
                    { 
                      backgroundColor: theme.palette[3 + (index % 4)],
                    }
                  ]}
                >
                  <PixelText variant="caption" color="text" align="center">
                    {getItemIcon(item)}
                  </PixelText>
                </View>
              </RoomAnimation>
            </FloatSpin>
          </TouchableOpacity>
        ))}

        {/* 特效層 */}
        {isComplete && (
          <Animated.View 
            style={[
              styles.completionEffect,
              { 
                opacity: glowAnim,
                backgroundColor: theme.palette[7]
              }
            ]}
          />
        )}
      </View>

      {/* 房間信息 */}
      <View style={styles.roomInfo}>
        <PixelText variant="body2" color="text" align="center" weight="bold">
          {levelName}
        </PixelText>
        <PixelText variant="caption" color="textMuted" align="center">
          {t('escapeRoom.theme')}: {theme.name}
        </PixelText>
        {isComplete && (
          <PixelText variant="caption" color="success" align="center" weight="bold">
            🎉 {t('escapeRoom.escaped')}
          </PixelText>
        )}
      </View>
    </View>
  );
};

// 輔助函數 - 生成像素圖案
function generateWallPattern(): number[][] {
  // 生成16x16的牆壁圖案
  const pattern = Array(16).fill(null).map(() => Array(16).fill(1));
  // 添加一些紋理
  for (let i = 0; i < 16; i += 4) {
    for (let j = 0; j < 16; j += 4) {
      pattern[i][j] = 3; // 高光點
    }
  }
  return pattern;
}

function generateFloorPattern(): number[][] {
  return Array(16).fill(null).map(() => Array(16).fill(2));
}

function generateLockedDoorPattern(): number[][] {
  const pattern = Array(16).fill(null).map(() => Array(16).fill(0));
  // 繪製門的基本形狀
  for (let i = 2; i < 14; i++) {
    for (let j = 4; j < 12; j++) {
      pattern[i][j] = 1; // 門框
      if (i > 3 && i < 13 && j > 5 && j < 11) {
        pattern[i][j] = 4; // 門內部 (紅色表示鎖定)
      }
    }
  }
  // 門把手
  pattern[8][10] = 9;
  return pattern;
}

function generateUnlockedDoorPattern(): number[][] {
  const pattern = generateLockedDoorPattern();
  // 將內部顏色改為綠色 (解鎖)
  for (let i = 4; i < 13; i++) {
    for (let j = 6; j < 11; j++) {
      if (pattern[i][j] === 4) {
        pattern[i][j] = 6; // 綠色表示解鎖
      }
    }
  }
  return pattern;
}

function generateWindowPattern(): number[][] {
  const pattern = Array(16).fill(null).map(() => Array(16).fill(0));
  // 窗框
  for (let i = 1; i < 15; i++) {
    pattern[1][i] = pattern[14][i] = 1;
    pattern[i][1] = pattern[i][14] = 1;
  }
  // 玻璃
  for (let i = 2; i < 14; i++) {
    for (let j = 2; j < 14; j++) {
      pattern[i][j] = 5; // 藍色玻璃
    }
  }
  // 窗格
  for (let i = 2; i < 14; i++) {
    pattern[i][7] = pattern[i][8] = 1;
  }
  for (let j = 2; j < 14; j++) {
    pattern[7][j] = pattern[8][j] = 1;
  }
  return pattern;
}

function generateFurniturePattern(): number[][] {
  // 簡單的桌子圖案
  const pattern = Array(16).fill(null).map(() => Array(16).fill(0));
  // 桌面
  for (let j = 2; j < 14; j++) {
    pattern[6][j] = pattern[7][j] = 7; // 橙色桌面
  }
  // 桌腿
  pattern[8][3] = pattern[9][3] = 1;
  pattern[8][12] = pattern[9][12] = 1;
  return pattern;
}

function generateKeyPattern(): number[][] {
  const pattern = Array(8).fill(null).map(() => Array(8).fill(0));
  // 鑰匙頭
  for (let i = 2; i < 6; i++) {
    for (let j = 1; j < 4; j++) {
      pattern[i][j] = 7; // 金色
    }
  }
  // 鑰匙柄
  for (let j = 4; j < 7; j++) {
    pattern[3][j] = pattern[4][j] = 7;
  }
  // 鑰匙齒
  pattern[2][6] = pattern[5][6] = 7;
  return pattern;
}

function generateLampPattern(): number[][] {
  const pattern = Array(8).fill(null).map(() => Array(8).fill(0));
  // 燈罩
  for (let i = 1; i < 4; i++) {
    for (let j = 2; j < 6; j++) {
      pattern[i][j] = 7; // 發光效果
    }
  }
  // 燈座
  for (let i = 4; i < 7; i++) {
    pattern[i][3] = pattern[i][4] = 1;
  }
  return pattern;
}

function generateBookPattern(): number[][] {
  const pattern = Array(8).fill(null).map(() => Array(8).fill(0));
  // 書本
  for (let i = 2; i < 6; i++) {
    for (let j = 1; j < 6; j++) {
      pattern[i][j] = 8; // 紫色書本
    }
  }
  // 書頁
  for (let i = 2; i < 6; i++) {
    pattern[i][5] = 10; // 白色書頁
  }
  return pattern;
}

function generateDecorationsPattern(): number[][] {
  return Array(8).fill(null).map(() => Array(8).fill(0));
}

// 獲取物品圖標
function getItemIcon(item: string): string {
  const iconMap: { [key: string]: string } = {
    key: '🗝️',
    lamp: '💡',
    book: '📖',
    mirror: '🪞',
    clock: '🕐',
    painting: '🖼️',
    chest: '📦',
    scroll: '📜',
    gem: '💎',
    sword: '⚔️',
  };
  return iconMap[item] || '📦';
}

const createPixelRoomRendererStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  
  roomCanvas: {
    flex: 1,
    position: 'relative',
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  walls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 8,
  },
  
  door: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 64,
  },
  
  doorElement: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  
  progressContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    minWidth: 2,
  },
  
  progressText: {
    fontSize: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  
  roomItem: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  
  itemElement: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  
  completionEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  roomInfo: {
    padding: theme.spacing.s,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
});

export default PixelRoomRenderer;