// src/components/ui/RoomRenderer.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { RoomState } from '../../services/level.service';
import { Theme } from '../../styles/theme';
import { useStyles } from '../../contexts/ThemeContext';
import { PixelText } from './PixelText';
import { useTranslation } from 'react-i18next';

interface RoomRendererProps {
  roomState: RoomState;
  levelName?: string;
  width?: number;
  height?: number;
}

// 簡化版的房間資料結構，基於你的參考 JSON
interface SimpleRoomData {
  name: string;
  theme: string;
  scene: string;
  progress: number;
  locked: boolean;
  daysInRoom: number;
  items: string[];
}

// 顏色調色板 - 基於 8-bit 習慣追踪 app 主題
const ROOM_PALETTE = {
  classic: ['transparent', '#2c3e50', '#ecf0f1', '#e74c3c', '#3498db', '#2ecc71', '#f39c12'],
  dark: ['transparent', '#1a1a1a', '#34495e', '#e74c3c', '#9b59b6', '#e67e22', '#f1c40f'],
  completed: ['transparent', '#27ae60', '#ecf0f1', '#f39c12', '#3498db', '#95a5a6', '#ffffff'],
};

// 簡化版的像素圖案 - 8x8 格式
const PIXEL_PATTERNS = {
  // 房間基本元素
  wall_horizontal: [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
  wall_vertical: [
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
  ],
  locked_door: [
    [0,1,1,1,1,1,1,0],
    [0,1,2,2,2,2,1,0],
    [0,1,2,3,3,2,1,0],
    [0,1,2,3,3,2,1,0],
    [0,1,2,2,4,2,1,0],
    [0,1,2,2,2,2,1,0],
    [0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0],
  ],
  unlocked_door: [
    [0,1,1,1,1,1,1,0],
    [0,1,5,5,5,5,1,0],
    [0,1,5,6,6,5,1,0],
    [0,1,5,6,6,5,1,0],
    [0,1,5,5,6,5,1,0],
    [0,1,5,5,5,5,1,0],
    [0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0],
  ],
  progress_bar: [
    [1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0],
  ],
};

export const RoomRenderer: React.FC<RoomRendererProps> = ({
  roomState,
  levelName = "Room",
  width: propWidth,
  height: propHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const styles = useStyles(createRoomRendererStyles);
  const { t } = useTranslation();

  // 獲取畫布尺寸
  const screenData = Dimensions.get('window');
  const defaultSize = Math.min(screenData.width - 32, 300);
  const canvasWidth = propWidth || defaultSize;
  const canvasHeight = propHeight || defaultSize;

  // 轉換房間狀態為簡化房間資料
  const roomData: SimpleRoomData = {
    name: levelName,
    theme: roomState.theme || 'classic',
    scene: roomState.scene || 'default_room',
    progress: roomState.progress || 0,
    locked: roomState.locked !== false,
    daysInRoom: roomState.daysInRoom || 0,
    items: roomState.items || [],
  };

  // 繪製單個像素圖案
  const drawPattern = (
    ctx: CanvasRenderingContext2D,
    pattern: number[][],
    palette: string[],
    x: number,
    y: number,
    pixelSize: number
  ) => {
    pattern.forEach((row, rowIndex) => {
      row.forEach((colorIndex, colIndex) => {
        if (colorIndex > 0) {
          ctx.fillStyle = palette[colorIndex] || '#000';
          ctx.fillRect(
            x + colIndex * pixelSize,
            y + rowIndex * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      });
    });
  };

  // 繪製進度條
  const drawProgressBar = (
    ctx: CanvasRenderingContext2D,
    palette: string[],
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number
  ) => {
    // 背景
    ctx.fillStyle = palette[1];
    ctx.fillRect(x, y, width, height);
    
    // 邊框
    ctx.strokeStyle = palette[1];
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // 進度填充
    if (progress > 0) {
      const fillWidth = (width - 4) * (progress / 100);
      ctx.fillStyle = progress >= 100 ? palette[5] : palette[4];
      ctx.fillRect(x + 2, y + 2, fillWidth, height - 4);
    }
  };

  // 主要渲染函數
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置畫布尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const palette = ROOM_PALETTE[roomData.theme as keyof typeof ROOM_PALETTE] || ROOM_PALETTE.classic;
    const pixelSize = 4;

    // 清空畫布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 繪製背景
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 繪製房間邊框
    ctx.fillStyle = palette[1];
    ctx.fillRect(0, 0, canvasWidth, 8);
    ctx.fillRect(0, 0, 8, canvasHeight);
    ctx.fillRect(canvasWidth - 8, 0, 8, canvasHeight);
    ctx.fillRect(0, canvasHeight - 8, canvasWidth, 8);

    // 繪製門（根據鎖定狀態）
    const doorX = canvasWidth / 2 - 32;
    const doorY = canvasHeight - 40;
    
    if (roomData.locked) {
      drawPattern(ctx, PIXEL_PATTERNS.locked_door, palette, doorX, doorY, pixelSize);
    } else {
      drawPattern(ctx, PIXEL_PATTERNS.unlocked_door, palette, doorX, doorY, pixelSize);
    }

    // 繪製進度條
    const progressBarX = 20;
    const progressBarY = 20;
    const progressBarWidth = canvasWidth - 40;
    const progressBarHeight = 20;
    
    drawProgressBar(ctx, palette, progressBarX, progressBarY, progressBarWidth, progressBarHeight, roomData.progress);

    // 繪製房間內物品（簡化版）
    if (roomData.items.length > 0) {
      roomData.items.forEach((item, index) => {
        const itemX = 40 + (index * 30);
        const itemY = canvasHeight / 2;
        
        // 簡單的方形物品表示
        ctx.fillStyle = palette[3 + (index % 3)];
        ctx.fillRect(itemX, itemY, 16, 16);
      });
    }

    // 繪製完成效果
    if (roomData.progress >= 100) {
      // 添加閃爍效果或特殊圖案
      ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

  }, [roomState, canvasWidth, canvasHeight, roomData]);

  return (
    <View style={[styles.container, { width: canvasWidth, height: canvasHeight }]}>
      {/* 簡化版的房間視覺化 - 使用 React Native 組件 */}
      <View style={styles.roomDisplay}>
        <PixelText variant="caption" color="textMuted" align="center">
          🏠 {t('escapeRoom.roomTheme')} {roomData.theme}
        </PixelText>
        <View style={styles.doorIcon}>
          <PixelText variant="h2" align="center">
            {roomData.locked ? '🔒' : '🔓'}
          </PixelText>
        </View>
        <View style={styles.progressIndicator}>
          <PixelText variant="caption" color="accent" align="center">
            {roomData.progress.toFixed(0)}% {t('escapeRoom.escapeProgress')}
          </PixelText>
        </View>
      </View>
    </View>
  );
};

const createRoomRendererStyles = (theme: Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.normal,
    borderColor: theme.colors.border,
    borderRadius: 0, // Pixel art style - no rounded corners
  },
  roomDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  doorIcon: {
    marginVertical: theme.spacing.m,
  },
  progressIndicator: {
    marginTop: theme.spacing.s,
  },
});

export default RoomRenderer;