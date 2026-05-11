/*
 *   Copyright (c) 2025 sn0wst0rm
 *   All rights reserved.
 *   Any form of copying or cloning of this code is strictly prohibited and will be criminally prosecuted.
 */
import { hapticImpact, HapticImpactStyle, hapticNotification } from '@/utils/haptics';
import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';


interface BouncyPressableProps {
    onPress?: () => void;
    onLongPress?: () => void;
    children: ReactNode;
    style?: StyleProp<ViewStyle>; // Aggiunta della prop 'style'
    disabled?: boolean;
    isLoading?: boolean;
    loadingColor?: string;
    haptic?: 'light' | 'normal' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'none' | 'success';
    hitSlop?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
    };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BouncyPressable: React.FC<BouncyPressableProps> = ({
    onPress,
    onLongPress,
    children,
    style,
    disabled,
    isLoading,
    loadingColor,
    hitSlop,
    haptic = 'light',
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    };

    const handlePress = async () => {
        if (haptic === 'success') {
            hapticNotification('success');
        } else {
            hapticImpact(haptic as HapticImpactStyle);
        }
        onPress?.();
    }

    return (
        <AnimatedPressable
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={500}
            disabled={disabled}
            style={[styles.button, animatedStyle, style, (disabled || isLoading) && { opacity: 0.5 }]}
            hitSlop={hitSlop}
        >
            {isLoading ? <ActivityIndicator size="small" color={loadingColor} /> : children}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flex: 0
    },
});

export default BouncyPressable;
