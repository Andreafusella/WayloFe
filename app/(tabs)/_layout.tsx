import { Redirect, Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';

import TabBar from '@/components/navigation/TabBar';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { hasPreciseLocationAccess } from '@/utils/position';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

export default function TabLayout() {
  const { authStatus } = useAuth();

  if (authStatus !== 'authenticated') {
    return <Redirect href="/" />;
  }

  return <TabsWithLocation />;
}

function TabsWithLocation() {
  const colorScheme = useColorScheme();
  const renderTabBar = useCallback((props: BottomTabBarProps) => <TabBar {...props} />, []);

  const [locationOk, setLocationOk] = useState<boolean | null>(null);

  useEffect(() => {
    void hasPreciseLocationAccess().then(setLocationOk);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hasPreciseLocationAccess().then(setLocationOk);
      }
    });
    return () => sub.remove();
  }, []);

  const tabScreenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: false,
      animation: 'fade' as const,
    }),
    [colorScheme],
  );

  if (locationOk === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!locationOk) {
    return <Redirect href="/views/position/PositionRequest" />;
  }

  return (
    <Tabs tabBar={renderTabBar} screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
    </Tabs>
  );
}
