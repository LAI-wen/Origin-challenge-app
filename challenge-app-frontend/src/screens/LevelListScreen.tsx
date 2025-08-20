// src/screens/LevelListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  PixelText,
  PixelButton,
  PixelCard,
  PixelInput,
  LoadingSpinner,
  RoomProgress,
  useStyles,
} from '../components/ui';
import { useLevel } from '../contexts/LevelContext';
import { useAuth } from '../contexts/AuthContext';
import { Theme } from '../styles/theme';
import { useTranslation } from 'react-i18next';

interface LevelListScreenProps {
  onNavigateToSettings?: () => void;
  onNavigateToCheckin?: (levelId: string, levelName: string) => void;
}

export const LevelListScreen: React.FC<LevelListScreenProps> = ({ onNavigateToSettings, onNavigateToCheckin }) => {
  const { user } = useAuth();
  const { levels, isLoading, error, loadLevels, createLevel, joinLevelByCode, clearError } = useLevel();
  const styles = useStyles(createLevelListStyles);
  const { t } = useTranslation();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  
  // 表單狀態
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDescription, setNewLevelDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (user) {
      loadLevels();
    }
  }, [user]);

  const handleRefresh = () => {
    clearError();
    loadLevels();
  };

  const handleCreateLevel = async () => {
    if (!newLevelName.trim()) return;
    
    setCreateLoading(true);
    try {
      const result = await createLevel({
        name: newLevelName.trim(),
        description: newLevelDescription.trim() || undefined,
      });
      
      if (result) {
        setNewLevelName('');
        setNewLevelDescription('');
        setShowCreateForm(false);
        // Close any other forms that might be open
        setShowJoinForm(false);
      }
    } catch (error) {
      console.error('Create level error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinLevel = async () => {
    if (!joinCode.trim()) return;
    
    setJoinLoading(true);
    try {
      const result = await joinLevelByCode(joinCode.trim());
      
      if (result) {
        setJoinCode('');
        setShowJoinForm(false);
        // Close any other forms that might be open
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Join level error:', error);
    } finally {
      setJoinLoading(false);
    }
  };

  const renderCreateForm = () => {
    if (!showCreateForm) return null;
    
    return (
      <PixelCard variant="outlined" style={styles.formCard}>
        <PixelText variant="h5" weight="bold" color="accent" style={styles.formTitle}>
          {t('escapeRoom.createNewRoom')}
        </PixelText>
        
        <PixelInput
          label={`${t('escapeRoom.roomName')} *`}
          placeholder={t('escapeRoom.roomNamePlaceholder')}
          value={newLevelName}
          onChangeText={setNewLevelName}
          required
          style={styles.formInput}
        />
        
        <PixelInput
          label={t('escapeRoom.roomDescription')}
          placeholder={t('escapeRoom.roomDescriptionPlaceholder')}
          value={newLevelDescription}
          onChangeText={setNewLevelDescription}
          multiline
          numberOfLines={3}
          style={styles.formInput}
        />
        
        <View style={styles.formActions}>
          <PixelButton
            variant="outline"
            title={t('escapeRoom.cancel')}
            onPress={() => setShowCreateForm(false)}
            style={styles.formButton}
          />
          <PixelButton
            variant="primary"
            title={t('escapeRoom.create')}
            onPress={handleCreateLevel}
            loading={createLoading}
            disabled={!newLevelName.trim()}
            style={styles.formButton}
          />
        </View>
      </PixelCard>
    );
  };

  const renderJoinForm = () => {
    if (!showJoinForm) return null;
    
    return (
      <PixelCard variant="outlined" style={styles.formCard}>
        <PixelText variant="h5" weight="bold" color="accent" style={styles.formTitle}>
          {t('escapeRoom.joinRoom')}
        </PixelText>
        
        <PixelInput
          label={`${t('escapeRoom.inviteCode')} *`}
          placeholder={t('escapeRoom.inviteCodePlaceholder')}
          value={joinCode}
          onChangeText={setJoinCode}
          maxLength={8}
          autoCapitalize="characters"
          required
          style={styles.formInput}
        />
        
        <View style={styles.formActions}>
          <PixelButton
            variant="outline"
            title={t('escapeRoom.cancel')}
            onPress={() => setShowJoinForm(false)}
            style={styles.formButton}
          />
          <PixelButton
            variant="primary"
            title={t('escapeRoom.join')}
            onPress={handleJoinLevel}
            loading={joinLoading}
            disabled={!joinCode.trim()}
            style={styles.formButton}
          />
        </View>
      </PixelCard>
    );
  };

  const renderLevelCard = (level: any) => {
    console.log('📋 Rendering level card:', {
      id: level.id,
      name: level.name,
      isOwner: level.isOwner,
      userRole: level.userRole,
      inviteCode: level.inviteCode,
      hasInviteCode: !!level.inviteCode,
      roomState: level.roomState,
      completedAt: level.completedAt
    });

    // 🏠 生成預設房間狀態 (如果後端沒有提供)
    const defaultRoomState = {
      scene: "default_room",
      theme: "classic",
      items: [],
      progress: 0,
      locked: true,
      escapeCondition: {
        type: "daily_checkin",
        target: 30,
        current: 0,
        description: "連續打卡30天即可逃出房間"
      },
      daysInRoom: 0,
      rewards: []
    };

    const roomState = level.roomState || defaultRoomState;
    const isEscaped = !!level.completedAt;
    
    return (
      <View key={level.id} style={styles.levelCardContainer}>
        <PixelCard variant="elevated" style={styles.levelCard}>
          {/* 🎯 房間狀態進度 */}
          <RoomProgress
            roomState={roomState}
            levelName={level.name}
            showDetails={false}
          />
          
          {/* 原有的關卡資訊 */}
          <View style={styles.levelHeader}>
            <View style={styles.roleContainer}>
              <PixelText variant="caption" color="accent" transform="uppercase">
                {level.userRole}
              </PixelText>
            </View>
          </View>
          
          {level.description && (
            <PixelText variant="body2" color="textSecondary" style={styles.levelDescription}>
              {level.description}
            </PixelText>
          )}
          
          <View style={styles.levelStats}>
            <PixelText variant="caption" color="textMuted">
              👥 {level.memberCount || 0} {t('escapeRoom.members')}
            </PixelText>
            <PixelText variant="caption" color="textMuted">
              📅 {new Date(level.createdAt).toLocaleDateString()}
            </PixelText>
          </View>

          {/* 🎊 逃脫成功標記 */}
          {isEscaped && (
            <View style={styles.escapedBanner}>
              <PixelText variant="caption" color="success" align="center" weight="bold">
                {t('escapeRoom.escaped', { date: new Date(level.completedAt).toLocaleDateString() })}
              </PixelText>
            </View>
          )}
          
          {(level.isOwner || level.userRole === 'CREATOR') && level.inviteCode && (
            <View style={styles.inviteCodeContainer}>
              <PixelText variant="caption" color="textSecondary">
                {t('escapeRoom.inviteCodeLabel')}
              </PixelText>
              <PixelText variant="body2" color="accent" weight="bold" monospace>
                {level.inviteCode}
              </PixelText>
            </View>
          )}

          {/* 🗝️ 打卡按鈕 - PLAYER 和 CREATOR 都可以打卡，只要房間未完成 */}
          {(level.userRole === 'PLAYER' || level.userRole === 'CREATOR') && !isEscaped && onNavigateToCheckin && (
            <View style={styles.checkinButtonContainer}>
              <PixelButton
                variant="primary"
                title={t('checkin.dailyAttempt')}
                onPress={() => onNavigateToCheckin(level.id, level.name)}
                style={styles.checkinButton}
              />
            </View>
          )}
        </PixelCard>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <PixelText variant="h5" color="textMuted" align="center">
        {t('escapeRoom.noRooms')}
      </PixelText>
      <PixelText variant="body1" color="textSecondary" align="center" style={styles.emptyDescription}>
        {t('escapeRoom.noRoomsDescription')}
      </PixelText>
    </View>
  );

  const renderError = () => {
    if (!error) return null;
    
    return (
      <PixelCard variant="outlined" style={styles.errorCard}>
        <PixelText variant="body2" color="error" align="center">
          ❌ {error}
        </PixelText>
        <PixelButton
          variant="outline"
          title={t('common.retry')}
          onPress={handleRefresh}
          size="small"
          style={styles.retryButton}
        />
      </PixelCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <PixelText variant="h3" weight="bold" color="accent">
              {t('escapeRoom.title')}
            </PixelText>
            <PixelText variant="body2" color="textSecondary">
              {t('escapeRoom.subtitle')}
            </PixelText>
          </View>
          <PixelButton
            variant="ghost"
            title={t('common.settings')}
            onPress={() => {
              if (onNavigateToSettings) {
                onNavigateToSettings();
              } else {
                console.log('Settings navigation not available');
              }
            }}
            style={styles.settingsButton}
          />
        </View>
      </View>

      <View style={styles.actionBar}>
        <PixelButton
          variant="primary"
          title={t('escapeRoom.buildRoom')}
          onPress={() => {
            setShowCreateForm(true);
            setShowJoinForm(false);
          }}
          style={styles.actionButton}
        />
        <PixelButton
          variant="outline"
          title={t('escapeRoom.enterRoom')}
          onPress={() => {
            setShowJoinForm(true);
            setShowCreateForm(false);
          }}
          style={styles.actionButton}
        />
      </View>

      {renderError()}
      {renderCreateForm()}
      {renderJoinForm()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#ffffff']}
            tintColor={'#ffffff'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && levels.length === 0 ? (
          <LoadingSpinner
            variant="bars"
            size="medium"
            text={t('common.loadingLevels')}
          />
        ) : levels.length > 0 ? (
          levels.map(renderLevelCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
};

// 樣式創建函數
const createLevelListStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
  
  header: {
    marginBottom: theme.spacing.l,
  },
  
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  
  titleSection: {
    flex: 1,
    alignItems: 'center' as const,
  },
  
  settingsButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  actionBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  
  actionButton: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // 表單樣式
  formCard: {
    marginBottom: theme.spacing.m,
  },
  
  formTitle: {
    marginBottom: theme.spacing.m,
    textAlign: 'center' as const,
  },
  
  formInput: {
    marginBottom: theme.spacing.m,
  },
  
  formActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: theme.spacing.s,
  },
  
  formButton: {
    flex: 1,
  },
  
  // 關卡卡片樣式
  levelCardContainer: {
    marginBottom: theme.spacing.m,
  },
  
  levelCard: {
    padding: theme.spacing.m,
  },
  
  levelHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.s,
  },
  
  roleContainer: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  
  levelDescription: {
    marginBottom: theme.spacing.s,
  },
  
  levelStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.s,
  },
  
  inviteCodeContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.s,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },

  // 🎊 逃脫成功標記樣式
  escapedBanner: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.s,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.success,
    marginBottom: theme.spacing.s,
  },
  
  // 空狀態樣式
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.xxl,
  },
  
  emptyDescription: {
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  
  // 錯誤狀態樣式
  errorCard: {
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    alignItems: 'center' as const,
  },
  
  retryButton: {
    marginTop: theme.spacing.s,
    minWidth: 100,
  },

  // 🗝️ 打卡按鈕樣式
  checkinButtonContainer: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
  },

  checkinButton: {
    backgroundColor: theme.colors.accent,
  },
});

export default LevelListScreen;