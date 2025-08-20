// src/components/ui/RoomProgress.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PixelText } from './PixelText';
import { PixelCard } from './PixelCard';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';
import { RoomState } from '../../services/level.service';
import { useTranslation } from 'react-i18next';

interface RoomProgressProps {
  roomState: RoomState;
  levelName: string;
  showDetails?: boolean;
}

export const RoomProgress: React.FC<RoomProgressProps> = ({
  roomState,
  levelName,
  showDetails = true,
}) => {
  const styles = useStyles(createRoomProgressStyles);
  const { t } = useTranslation();

  // 計算剩餘天數
  const remainingDays = Math.max(0, (roomState.escapeCondition?.target || 30) - (roomState.escapeCondition?.current || 0));
  const progressPercentage = roomState.progress || 0;
  const isCompleted = progressPercentage >= 100;
  const isLocked = roomState.locked !== false;

  // 獲取進度狀態
  const getProgressStatus = () => {
    if (isCompleted) return 'escaped';
    if (progressPercentage >= 75) return 'close';
    if (progressPercentage >= 25) return 'progress';
    return 'starting';
  };

  const getProgressIcon = () => {
    const status = getProgressStatus();
    switch (status) {
      case 'escaped': return '🎉';
      case 'close': return '🔓';
      case 'progress': return '⚡';
      default: return '🔒';
    }
  };

  const getProgressColor = () => {
    const status = getProgressStatus();
    switch (status) {
      case 'escaped': return 'success';
      case 'close': return 'warning';
      case 'progress': return 'accent';
      default: return 'textMuted';
    }
  };

  const getStatusMessage = () => {
    if (isCompleted) {
      return `🎊 ${t('escapeRoom.congratulations')}`;
    }
    if (remainingDays === 0) {
      return t('escapeRoom.progressMessages.today');
    }
    if (remainingDays <= 3) {
      return t('escapeRoom.progressMessages.soon', { days: remainingDays });
    }
    return t('escapeRoom.progressMessages.remaining', { days: remainingDays });
  };

  return (
    <PixelCard variant="outlined" style={styles.container}>
      {/* 房間標題 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <PixelText variant="h6" weight="bold" color="text">
            {getProgressIcon()} {levelName}
          </PixelText>
          <View style={styles.lockStatus}>
            <PixelText 
              variant="caption" 
              color={isLocked ? 'error' : 'success'}
              weight="bold"
              transform="uppercase"
            >
              {isLocked ? t('escapeRoom.locked') : t('escapeRoom.unlocked')}
            </PixelText>
          </View>
        </View>
        
        <PixelText variant="body2" color="textSecondary" style={styles.description}>
          {t('escapeRoom.escapeCondition', { target: roomState.escapeCondition?.target || 30 })}
        </PixelText>
      </View>

      {/* 進度條 */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <PixelText variant="caption" color="textMuted">
            {t('escapeRoom.escapeProgress')}
          </PixelText>
          <PixelText variant="caption" color={getProgressColor()} weight="bold">
            {progressPercentage.toFixed(0)}%
          </PixelText>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: isCompleted ? '#2ecc71' : '#3498db'
              }
            ]} 
          />
        </View>

        <View style={styles.progressInfo}>
          <PixelText variant="caption" color="textMuted">
            {roomState.escapeCondition?.current || 0} / {roomState.escapeCondition?.target || 30} {t('escapeRoom.days')}
          </PixelText>
          <PixelText variant="caption" color={getProgressColor()}>
            {getStatusMessage()}
          </PixelText>
        </View>
      </View>

      {/* 詳細信息 */}
      {showDetails && (
        <View style={styles.detailsSection}>
          <View style={styles.statRow}>
            <PixelText variant="caption" color="textMuted">
              {t('escapeRoom.roomTheme')}
            </PixelText>
            <PixelText variant="caption" color="text" transform="capitalize">
              {roomState.theme}
            </PixelText>
          </View>
          
          <View style={styles.statRow}>
            <PixelText variant="caption" color="textMuted">
              {t('escapeRoom.daysTrapped')}
            </PixelText>
            <PixelText variant="caption" color="accent" weight="bold">
              {roomState.daysInRoom} {t('escapeRoom.days')}
            </PixelText>
          </View>

          {roomState.items && roomState.items.length > 0 && (
            <View style={styles.statRow}>
              <PixelText variant="caption" color="textMuted">
                {t('escapeRoom.roomItems')}
              </PixelText>
              <PixelText variant="caption" color="text">
                {roomState.items.length} {t('escapeRoom.items')}
              </PixelText>
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedBanner}>
              <PixelText variant="body2" color="success" align="center" weight="bold">
                {t('escapeRoom.congratulations')}
              </PixelText>
            </View>
          )}
        </View>
      )}
    </PixelCard>
  );
};

const createRoomProgressStyles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.m,
  },
  
  header: {
    marginBottom: theme.spacing.m,
  },
  
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  
  lockStatus: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs / 2,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  
  description: {
    fontStyle: 'italic',
  },
  
  progressSection: {
    marginBottom: theme.spacing.m,
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    minWidth: 2,
  },
  
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  detailsSection: {
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.m,
  },
  
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  completedBanner: {
    marginTop: theme.spacing.s,
    padding: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.success,
  },
});

export default RoomProgress;