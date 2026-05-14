import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import TabBarButton from './TabBarButton';
import { hapticImpact } from '@/utils/haptics';

const PILL_SPRING = { damping: 20, stiffness: 250, mass: 0.8 };

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();

    // Forziamo lo stile Light rimuovendo useColorScheme
    const focusedIndex = useSharedValue(state.index);
    const buttonWidth = useSharedValue(0);

    useEffect(() => {
        focusedIndex.value = state.index;
    }, [state.index]);

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

    const indicatorWrapperStyle = useAnimatedStyle(() => {
        const w = buttonWidth.value;
        return {
            transform: [{ translateX: withSpring(focusedIndex.value * w, PILL_SPRING) }],
            width: w,
        };
    });

    const indicatorDiscStyle = useAnimatedStyle(() => {
        const w = buttonWidth.value;
        const d = Math.min(48, Math.max(32, w - 12));
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
        <View style={[styles.wrapper, { bottom: insets.bottom + 15 }]}>
            <BlurView
                intensity={15} // Intensità ridotta per l'effetto "liquid" (più trasparente)
                tint="light"
                style={styles.container}
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
                                onLongPress={() => { }}
                                routeName={route.name}
                                // Colore icone: Oro quando attivo, Grigio scuro/semi-trasparente quando inattivo
                                color={state.index === index ? '#FFFFFF' : 'rgba(0,0,0,0.4)'}
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
        left: 30,
        right: 30,
        alignItems: 'center',
        // Ombra molto morbida e diffusa
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'stretch',
        width: '100%',
        paddingVertical: 10,
        borderRadius: 50, // Più tonda per l'effetto "pillola"
        borderWidth: 1.5,
        // Bordo bianco semi-trasparente per simulare il riflesso del vetro
        borderColor: 'rgba(255, 255, 255, 0.7)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // Sfondo molto tenue
        overflow: 'hidden',
    },
    tabRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicatorWrapper: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        backgroundColor: '#D1992E', // Il tuo color oro
        // Effetto bagliore sotto l'indicatore
        shadowColor: '#D1992E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
});

export default TabBar;