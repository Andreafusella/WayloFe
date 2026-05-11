import { Redirect, Tabs } from 'expo-router';
import React, { useCallback } from 'react';

import TabBar from '@/components/navigation/TabBar';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const renderTabBar = useCallback((props: BottomTabBarProps) => <TabBar {...props} />, []);
  const { authStatus } = useAuth();

  const tabScreenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: false,
      animation: 'fade' as const,
    }),
    [colorScheme],
  );

  if (authStatus !== 'authenticated') {
    return <Redirect href="/" />;
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
