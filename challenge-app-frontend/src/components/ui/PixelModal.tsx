// src/components/ui/PixelModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  ModalProps,
  View,
  ViewStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useStyles } from '../../contexts/ThemeContext';
import { Theme } from '../../styles/theme';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';

export interface PixelModalProps extends Omit<ModalProps, 'style' | 'animationType'> {
  // 模態框變體
  variant?: 'default' | 'fullscreen' | 'bottom' | 'center';
  
  // 模態框大小
  size?: 'small' | 'medium' | 'large' | 'auto';
  
  // 內容
  children: React.ReactNode;
  
  // 標題和動作
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  
  // 底部動作按鈕
  primaryAction?: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  
  secondaryAction?: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  };
  
  // 樣式自定義
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  
  // 背景遮罩
  backdropDismiss?: boolean;
  backdropOpacity?: number;
  
  // 動畫
  animationType?: 'slide' | 'fade' | 'scale';
  animationDuration?: number;
  
  // 滾動支持
  scrollable?: boolean;
  
  // 可見性
  visible: boolean;
}

export const PixelModal: React.FC<PixelModalProps> = ({
  variant = 'center',
  size = 'medium',
  children,
  title,
  subtitle,
  showCloseButton = true,
  onClose,
  primaryAction,
  secondaryAction,
  style,
  containerStyle,
  backdropDismiss = true,
  backdropOpacity = 0.7,
  animationType = 'scale',
  animationDuration = 300,
  scrollable = false,
  visible,
  ...props
}) => {
  const styles = useStyles((theme) => createModalStyles(theme, variant, size));
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  
  // 動畫控制
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);
  
  const showModal = () => {
    Animated.parallel([
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const hideModal = () => {
    Animated.parallel([
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: animationDuration / 2,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // 處理背景點擊
  const handleBackdropPress = () => {
    if (backdropDismiss && onClose) {
      onClose();
    }
  };
  
  // 獲取動畫樣式
  const getAnimatedStyle = () => {
    const baseStyle = {
      opacity: opacityAnimation,
    };
    
    if (animationType === 'scale') {
      return {
        ...baseStyle,
        transform: [{ scale: scaleAnimation }],
      };
    }
    
    return baseStyle;
  };
  
  // 渲染標題區域
  const renderHeader = () => {
    if (!title && !showCloseButton) return null;
    
    return (
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {title && (
            <PixelText variant="h5" weight="bold" color="text">
              {title}
            </PixelText>
          )}
          {subtitle && (
            <PixelText variant="caption" color="textSecondary" style={styles.subtitle}>
              {subtitle}
            </PixelText>
          )}
        </View>
        
        {showCloseButton && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close modal"
          >
            <PixelText variant="h5" color="textSecondary">
              ✕
            </PixelText>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // 渲染底部動作區域
  const renderActions = () => {
    if (!primaryAction && !secondaryAction) return null;
    
    return (
      <View style={styles.actions}>
        {secondaryAction && (
          <PixelButton
            variant="outline"
            title={secondaryAction.title}
            onPress={secondaryAction.onPress}
            disabled={secondaryAction.disabled}
            style={styles.secondaryButton}
          />
        )}
        
        {primaryAction && (
          <PixelButton
            variant="primary"
            title={primaryAction.title}
            onPress={primaryAction.onPress}
            loading={primaryAction.loading}
            disabled={primaryAction.disabled}
            style={styles.primaryButton}
          />
        )}
      </View>
    );
  };
  
  // 渲染內容
  const renderContent = () => {
    const content = (
      <View style={styles.content}>
        {children}
      </View>
    );
    
    if (scrollable) {
      return (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      );
    }
    
    return content;
  };
  
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      {...props}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[styles.backdrop, { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              styles.container,
              getAnimatedStyle(),
              containerStyle,
            ]}>
              <View style={[styles.modal, style]}>
                {renderHeader()}
                {renderContent()}
                {renderActions()}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 樣式創建函數
const createModalStyles = (theme: Theme, variant: string, size: string) => {
  const screenDimensions = Dimensions.get('window');
  const modalDimensions = getModalDimensions(size, screenDimensions);
  
  return {
    backdrop: {
      flex: 1,
      justifyContent: getJustifyContent(variant),
      alignItems: 'center',
      padding: theme.spacing.l,
    } as ViewStyle,
    
    container: {
      ...getContainerStyles(variant, modalDimensions),
    } as ViewStyle,
    
    modal: {
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borderWidth.normal,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius,
      overflow: 'hidden',
      maxWidth: modalDimensions.maxWidth,
      maxHeight: modalDimensions.maxHeight,
      width: '100%',
      // 像素風格陰影
      borderBottomWidth: theme.borderWidth.thick,
      borderRightWidth: theme.borderWidth.thick,
    } as ViewStyle,
    
    // 標題區域
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.m,
      borderBottomWidth: theme.borderWidth.thin,
      borderBottomColor: theme.colors.border,
    } as ViewStyle,
    
    titleContainer: {
      flex: 1,
    } as ViewStyle,
    
    subtitle: {
      marginTop: theme.spacing.xs,
    } as ViewStyle,
    
    closeButton: {
      padding: theme.spacing.s,
      marginLeft: theme.spacing.m,
      minWidth: 32,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,
    
    // 內容區域
    content: {
      padding: theme.spacing.m,
    } as ViewStyle,
    
    scrollView: {
      maxHeight: modalDimensions.maxHeight - 200, // 為標題和動作留空間
    } as ViewStyle,
    
    // 動作區域
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: theme.spacing.m,
      borderTopWidth: theme.borderWidth.thin,
      borderTopColor: theme.colors.border,
    } as ViewStyle,
    
    primaryButton: {
      minWidth: 100,
    } as ViewStyle,
    
    secondaryButton: {
      minWidth: 100,
      marginRight: theme.spacing.s,
    } as ViewStyle,
  };
};

// 工具函數
const getModalDimensions = (size: string, screenDimensions: any) => {
  const { width, height } = screenDimensions;
  
  switch (size) {
    case 'small':
      return {
        maxWidth: Math.min(320, width * 0.8),
        maxHeight: height * 0.6,
      };
    case 'medium':
      return {
        maxWidth: Math.min(480, width * 0.9),
        maxHeight: height * 0.7,
      };
    case 'large':
      return {
        maxWidth: Math.min(640, width * 0.95),
        maxHeight: height * 0.8,
      };
    case 'auto':
      return {
        maxWidth: width * 0.9,
        maxHeight: height * 0.8,
      };
    default:
      return {
        maxWidth: Math.min(480, width * 0.9),
        maxHeight: height * 0.7,
      };
  }
};

const getJustifyContent = (variant: string) => {
  switch (variant) {
    case 'bottom':
      return 'flex-end';
    case 'fullscreen':
      return 'flex-start';
    default:
      return 'center';
  }
};

const getContainerStyles = (variant: string, dimensions: any) => {
  const baseStyle = {
    width: '100%',
  };
  
  switch (variant) {
    case 'fullscreen':
      return {
        ...baseStyle,
        flex: 1,
      };
    case 'bottom':
      return {
        ...baseStyle,
        maxWidth: dimensions.maxWidth,
      };
    default:
      return {
        ...baseStyle,
        maxWidth: dimensions.maxWidth,
      };
  }
};

// 預定義的模態框變體

/**
 * 確認對話框
 */
export const ConfirmModal: React.FC<Omit<PixelModalProps, 'primaryAction' | 'secondaryAction'> & {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}> = ({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  ...props
}) => (
  <PixelModal
    size="small"
    title="Confirm Action"
    primaryAction={{
      title: confirmText,
      onPress: onConfirm,
      loading,
    }}
    secondaryAction={{
      title: cancelText,
      onPress: onCancel,
    }}
    {...props}
  >
    <PixelText variant="body1" color="text" align="center">
      {message}
    </PixelText>
  </PixelModal>
);

/**
 * 警告對話框
 */
export const AlertModal: React.FC<Omit<PixelModalProps, 'primaryAction'> & {
  message: string;
  onOk: () => void;
  okText?: string;
}> = ({
  message,
  onOk,
  okText = 'OK',
  ...props
}) => (
  <PixelModal
    size="small"
    title="Alert"
    primaryAction={{
      title: okText,
      onPress: onOk,
    }}
    showCloseButton={false}
    backdropDismiss={false}
    {...props}
  >
    <PixelText variant="body1" color="text" align="center">
      {message}
    </PixelText>
  </PixelModal>
);

// 預設匯出
export default PixelModal;