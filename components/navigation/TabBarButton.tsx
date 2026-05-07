import { icon } from '@/constants/icon';
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';

interface ITabBarButtonProps {
    index: number;
    focusedIndex: SharedValue<number>;
    onPress: (index: number) => void;
    onLongPress: (index: number) => void;
    label: string;
    routeName: string;
    color: string;
}

const ICON_SPRING = { damping: 16, stiffness: 220, mass: 0.8 };

const TabBarButton = ({ index, focusedIndex, onPress, onLongPress, label, routeName, color }: ITabBarButtonProps) => {
    const scale = useSharedValue(0);

    // Runs on UI thread. wasFocused is null on first call (mount).
    useAnimatedReaction(
        () => focusedIndex.value === index,
        (isFocused, wasFocused) => {
            if (wasFocused === null) {
                // Mount — set immediately, no animation
                scale.value = isFocused ? 1 : 0;
            } else if (isFocused !== wasFocused) {
                scale.value = withSpring(isFocused ? 1 : 0, ICON_SPRING);
            }
        }
    );

    const animatedIconStyle = useAnimatedStyle(() => {
        const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2], Extrapolation.EXTEND);
        const top = interpolate(scale.value, [0, 1], [0, 9], Extrapolation.EXTEND);
        return { transform: [{ scale: scaleValue }], top };
    });

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scale.value, [0, 1], [1, 0]),
    }));

    const handlePress = useCallback(() => onPress(index), [onPress, index]);
    const handleLongPress = useCallback(() => onLongPress(index), [onLongPress, index]);

    const iconElement = useMemo(
        () => icon[routeName as keyof typeof icon]({ color }),
        [routeName, color]
    );

    return (
        <Pressable onPress={handlePress} onLongPress={handleLongPress} style={styles.button}>
            <Animated.View style={animatedIconStyle}>
                {iconElement}
            </Animated.View>
            <Animated.Text numberOfLines={1} style={[animatedTextStyle, styles.label, { color }]}>
                {label}
            </Animated.Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
    },
    label: {
        fontSize: 12,
        lineHeight: 14,
    },
});

export default React.memo(TabBarButton);
