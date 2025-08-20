// src/screens/CheckinScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  PixelText,
  PixelButton,
  PixelCard,
  PixelInput,
  LoadingSpinner,
  useStyles,
} from '../components/ui';
import { Theme } from '../styles/theme';
import { useTranslation } from 'react-i18next';
import { checkinService, CheckinRequest, TodayStatus } from '../services/checkin.service';

interface CheckinScreenProps {
  levelId: string;
  levelName: string;
  onBack: () => void;
  onCheckinSuccess?: () => void;
}

type CheckinType = 'TEXT' | 'IMAGE' | 'CHECKMARK';

export const CheckinScreen: React.FC<CheckinScreenProps> = ({
  levelId,
  levelName,
  onBack,
  onCheckinSuccess,
}) => {
  const styles = useStyles(createCheckinScreenStyles);
  const { t } = useTranslation();

  // State management
  const [selectedType, setSelectedType] = useState<CheckinType>('CHECKMARK');
  const [textContent, setTextContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Load today's status on component mount
  useEffect(() => {
    loadTodayStatus();
  }, [levelId]);

  // Update time remaining every minute
  useEffect(() => {
    if (!todayStatus?.timeRemaining) {
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(todayStatus.timeRemaining);
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [todayStatus]);

  const loadTodayStatus = async () => {
    try {
      setIsLoading(true);
      console.log(`🔍 CheckinScreen: Loading status for levelId=${levelId}, levelName=${levelName}`);
      const status = await checkinService.getTodayStatus(levelId);
      console.log(`✅ CheckinScreen: Received status for ${levelId}:`, JSON.stringify(status, null, 2));
      setTodayStatus(status);
    } catch (error) {
      console.error('Failed to load today status:', error);
      Alert.alert(
        t('common.error'),
        'Failed to load check-in status. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].base64 || undefined);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!todayStatus?.timeWindow?.isWithinWindow || todayStatus?.hasCheckedIn) {
      Alert.alert(
        'Cannot Check In',
        'Check-in window has closed or you have already checked in today.'
      );
      return;
    }

    // Validate input based on type
    if (selectedType === 'TEXT' && !textContent.trim()) {
      Alert.alert('Missing Content', 'Please write something for your check-in.');
      return;
    }

    if (selectedType === 'IMAGE' && !selectedImage) {
      Alert.alert('Missing Image', 'Please select an image for your check-in.');
      return;
    }

    try {
      setIsSubmitting(true);

      const checkinData: CheckinRequest = {
        type: selectedType,
        content: selectedType === 'TEXT' ? textContent.trim() : undefined,
        image: selectedType === 'IMAGE' ? selectedImage : undefined,
      };

      const response = await checkinService.submitCheckin(levelId, checkinData);

      if (response.success) {
        Alert.alert(
          '🎉 Check-in Successful!',
          response.roomProgress?.escaped 
            ? '🎊 Congratulations! You have escaped the room!'
            : `Progress updated! ${response.roomProgress?.progress.toFixed(1)}% complete`,
          [
            {
              text: 'Continue',
              onPress: () => {
                if (onCheckinSuccess) {
                  onCheckinSuccess();
                }
                onBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Check-in Failed', response.error || response.message || 'Please try again.');
      }
    } catch (error) {
      console.error('Check-in submission error:', error);
      Alert.alert('Error', 'Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner
          variant="bars"
          size="medium"
          text="Loading check-in status..."
        />
      </View>
    );
  }

  // If user has already checked in today
  if (todayStatus?.hasCheckedIn && todayStatus.todayCheckin) {
    const checkin = todayStatus.todayCheckin;
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <PixelText variant="h4" color="accent">{t('checkin.backButton')}</PixelText>
          </TouchableOpacity>
          <PixelText variant="h4" weight="bold" color="accent" align="center">
            ✅ {levelName}
          </PixelText>
        </View>

        <PixelCard variant="elevated" style={styles.completedCard}>
          <PixelText variant="h5" color="success" align="center" weight="bold">
            {t('checkin.alreadyComplete')}
          </PixelText>
          
          <View style={styles.checkinPreview}>
            <PixelText variant="body2" color="textMuted">
              Submitted at: {new Date(checkin.submittedAt).toLocaleTimeString()}
            </PixelText>
            
            {checkin.type === 'TEXT' && checkin.content && (
              <View style={styles.textPreview}>
                <PixelText variant="body1" color="text">
                  "{checkin.content}"
                </PixelText>
              </View>
            )}
            
            {checkin.type === 'IMAGE' && checkin.imageUrl && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: checkin.imageUrl }} style={styles.previewImage} />
              </View>
            )}
            
            {checkin.type === 'CHECKMARK' && (
              <PixelText variant="h2" align="center" color="success">
                ✓
              </PixelText>
            )}
          </View>
        </PixelCard>

        <PixelButton
          variant="outline"
          title="Back to Rooms"
          onPress={onBack}
          style={styles.backToRoomsButton}
        />
      </ScrollView>
    );
  }

  // If check-in window is closed
  if (!todayStatus?.timeWindow?.isWithinWindow && !todayStatus?.hasCheckedIn) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <PixelText variant="h4" color="accent">{t('checkin.backButton')}</PixelText>
          </TouchableOpacity>
          <PixelText variant="h4" weight="bold" color="accent" align="center">
            🔒 {levelName}
          </PixelText>
        </View>

        <PixelCard variant="outlined" style={styles.closedCard}>
          <PixelText variant="h5" color="error" align="center" weight="bold">
            ⏰ Check-in Window Closed
          </PixelText>
          
          <PixelText variant="body1" color="textSecondary" align="center" style={styles.windowInfo}>
            Check-in hours: {todayStatus?.timeWindow.start} - {todayStatus?.timeWindow.end}
          </PixelText>
          
          <PixelText variant="body2" color="textMuted" align="center">
            Come back tomorrow to continue your escape attempt!
          </PixelText>
        </PixelCard>

        <PixelButton
          variant="outline"
          title="Back to Rooms"
          onPress={onBack}
          style={styles.backToRoomsButton}
        />
      </ScrollView>
    );
  }

  // Main check-in interface
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <PixelText variant="h4" color="accent">← Back</PixelText>
        </TouchableOpacity>
        <PixelText variant="h4" weight="bold" color="accent" align="center">
          🗝️ {levelName}
        </PixelText>
      </View>

      {/* Time remaining warning */}
      {timeRemaining > 0 && timeRemaining < 60 && (
        <PixelCard variant="outlined" style={styles.urgentCard}>
          <PixelText variant="body1" color="error" align="center" weight="bold">
            ⚠️ Only {formatTimeRemaining(timeRemaining)} remaining!
          </PixelText>
        </PixelCard>
      )}

      {/* Check-in type selector */}
      <PixelCard variant="outlined" style={styles.selectorCard}>
        <PixelText variant="h6" weight="bold" color="text" style={styles.sectionTitle}>
          Choose Your Escape Attempt:
        </PixelText>
        
        <View style={styles.typeSelector}>
          {(['CHECKMARK', 'TEXT', 'IMAGE'] as CheckinType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                selectedType === type && styles.typeOptionSelected
              ]}
              onPress={() => setSelectedType(type)}
            >
              <PixelText variant="h5">
                {type === 'CHECKMARK' ? '✓' : type === 'TEXT' ? '📝' : '📸'}
              </PixelText>
              <PixelText 
                variant="caption" 
                color={selectedType === type ? 'accent' : 'textMuted'}
                align="center"
              >
                {type === 'CHECKMARK' ? 'Just Done' : type === 'TEXT' ? 'Write Log' : 'Photo Proof'}
              </PixelText>
            </TouchableOpacity>
          ))}
        </View>
      </PixelCard>

      {/* Input area based on selected type */}
      {selectedType === 'TEXT' && (
        <PixelCard variant="outlined" style={styles.inputCard}>
          <PixelText variant="body1" weight="bold" color="text" style={styles.inputLabel}>
            📝 Write your escape log:
          </PixelText>
          <PixelInput
            multiline
            numberOfLines={4}
            placeholder="Describe what you accomplished today..."
            value={textContent}
            onChangeText={setTextContent}
            style={styles.textInput}
          />
          <PixelText variant="caption" color="textMuted">
            {textContent.length}/500 characters
          </PixelText>
        </PixelCard>
      )}

      {selectedType === 'IMAGE' && (
        <PixelCard variant="outlined" style={styles.inputCard}>
          <PixelText variant="body1" weight="bold" color="text" style={styles.inputLabel}>
            📸 Upload proof of your progress:
          </PixelText>
          
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image 
                source={{ uri: `data:image/jpeg;base64,${selectedImage}` }} 
                style={styles.selectedImage} 
              />
              <PixelButton
                variant="outline"
                title="Change Image"
                onPress={handleImagePicker}
                style={styles.changeImageButton}
              />
            </View>
          ) : (
            <PixelButton
              variant="outline"
              title="📷 Select Image"
              onPress={handleImagePicker}
              style={styles.selectImageButton}
            />
          )}
        </PixelCard>
      )}

      {selectedType === 'CHECKMARK' && (
        <PixelCard variant="outlined" style={styles.inputCard}>
          <View style={styles.checkmarkPreview}>
            <PixelText variant="h1" color="success" align="center">
              ✓
            </PixelText>
            <PixelText variant="body1" color="textSecondary" align="center">
              Quick confirmation - I completed my daily challenge!
            </PixelText>
          </View>
        </PixelCard>
      )}

      {/* Submit button */}
      <PixelButton
        variant="primary"
        title={isSubmitting ? "🔄 Escaping..." : "🗝️ Attempt Escape"}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
      />

      {/* Info panel */}
      <PixelCard variant="flat" style={styles.infoCard}>
        <PixelText variant="caption" color="textMuted" align="center">
          ⏰ Check-in window: {todayStatus?.timeWindow.start} - {todayStatus?.timeWindow.end}
        </PixelText>
        {timeRemaining > 0 && (
          <PixelText variant="caption" color="accent" align="center">
            Time remaining: {formatTimeRemaining(timeRemaining)}
          </PixelText>
        )}
      </PixelCard>
    </ScrollView>
  );
};

const createCheckinScreenStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.l,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.m,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    position: 'absolute' as const,
    left: theme.spacing.m,
    zIndex: 1,
  },
  urgentCard: {
    margin: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.error,
  },
  selectorCard: {
    margin: theme.spacing.m,
  },
  sectionTitle: {
    marginBottom: theme.spacing.m,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  typeOption: {
    alignItems: 'center' as const,
    padding: theme.spacing.m,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minWidth: 80,
  },
  typeOptionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceLight,
  },
  inputCard: {
    margin: theme.spacing.m,
  },
  inputLabel: {
    marginBottom: theme.spacing.s,
  },
  textInput: {
    marginBottom: theme.spacing.s,
  },
  imagePreview: {
    alignItems: 'center' as const,
    marginTop: theme.spacing.s,
  },
  selectedImage: {
    width: 200,
    height: 200,
    marginBottom: theme.spacing.s,
  },
  changeImageButton: {
    width: 150,
  },
  selectImageButton: {
    marginTop: theme.spacing.s,
  },
  checkmarkPreview: {
    alignItems: 'center' as const,
    paddingVertical: theme.spacing.l,
  },
  submitButton: {
    margin: theme.spacing.m,
    marginTop: theme.spacing.l,
  },
  infoCard: {
    margin: theme.spacing.m,
    padding: theme.spacing.s,
  },
  completedCard: {
    margin: theme.spacing.m,
    alignItems: 'center' as const,
  },
  checkinPreview: {
    marginTop: theme.spacing.m,
    alignItems: 'center' as const,
  },
  textPreview: {
    marginTop: theme.spacing.s,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    width: '100%' as const,
  },
  previewImage: {
    width: 150,
    height: 150,
    marginTop: theme.spacing.s,
  },
  closedCard: {
    margin: theme.spacing.m,
    alignItems: 'center' as const,
  },
  windowInfo: {
    marginVertical: theme.spacing.m,
  },
  backToRoomsButton: {
    margin: theme.spacing.m,
    marginTop: theme.spacing.l,
  },
});

export default CheckinScreen;