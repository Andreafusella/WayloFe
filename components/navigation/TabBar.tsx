import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import TabBarButton from './TabBarButton';
import { hapticImpact } from '@/utils/haptics';

const PILL_SPRING = { damping: 20, stiffness: 250, mass: 0.8 };

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const focusedIndex = useSharedValue(state.index);
    const buttonWidth = useSharedValue(0);

    useEffect(() => {
        focusedIndex.value = state.index;
    }, [state.index]);

    // La larghezza va misurata sulla riga reale dei tab, non sul BlurView: altrimenti
    // bordo/BlurView fanno sì che width/n ≠ larghezza effettiva di ogni slot e l'errore
    // si accumula verso destra a ogni indice.
    const onTabRowLayout = useCallback(
        (e: { nativeEvent: { layout: { width: number } } }) => {
            const { width } = e.nativeEvent.layout;
            const n = state.routes.length;
            if (width > 0 && n > 0) {
                buttonWidth.value = width / n;
            }
        },
        [state.routes.length]
    );

    // Il cerchio è centrato nello slot (larghezza = tab) e in verticale nel contenitore:
    // coincide col centro del blocco icona+testo centrato con justifyContent:'center' su ogni tab
    const indicatorWrapperStyle = useAnimatedStyle(() => {
        const w = buttonWidth.value;
        return {
            transform: [{ translateX: withSpring(focusedIndex.value * w, PILL_SPRING) }],
            width: w,
        };
    });

    const indicatorDiscStyle = useAnimatedStyle(() => {
        const w = buttonWidth.value;
        // Cerchio mai più largo del tab; sempre quadrato (borderRadius = metà lato)
        const d = Math.min(50, Math.max(32, w - 10));
        return {
            width: d,
            height: d,
            borderRadius: d / 2,
        };
    });

    const handleTabPress = useCallback((index: number) => {
        hapticImpact('light');
        focusedIndex.value = index;
        const route = state.routes[index];
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

        if (state.index !== index && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
        }
    }, [state.routes, state.index, navigation]);

    return (
        <View style={[styles.wrapper, { bottom: insets.bottom + 10  }]}>
            <BlurView
                intensity={isDark ? 90 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.container,
                    {
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                        backgroundColor: isDark ? 'rgba(31,31,31,0.4)' : 'rgba(255,255,255,0.4)',
                    },
                ]}
            >
                <Animated.View style={[styles.indicatorWrapper, indicatorWrapperStyle]}>
                    <Animated.View style={[styles.indicator, indicatorDiscStyle]} />
                </Animated.View>

                <View style={styles.tabRow} onLayout={onTabRowLayout}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel ?? options.title ?? route.name;

                        return (
                            <TabBarButton
                                key={route.key}
                                index={index}
                                focusedIndex={focusedIndex}
                                onPress={handleTabPress}
                                onLongPress={() => {}}
                                routeName={route.name}
                                color={state.index === index ? '#fff' : (isDark ? '#BBB' : '#666')}
                                label={typeof label === 'string' ? label : ''}
                            />
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 25,
        right: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'stretch',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 40,
        borderWidth: 1,
        overflow: 'hidden',
    },
    tabRow: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    indicatorWrapper: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        backgroundColor: '#D1992E',
    },
});

export default TabBar;