import { Redirect, Tabs } from 'expo-router';
import React, { useCallback } from 'react';

import TabBar from '@/components/navigation/TabBar';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const renderTabBar = useCallback((props: BottomTabBarProps) => <TabBar {...props} />, []);
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/views/auth/Login" />;
  }

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        animation: 'fade',
        // tabBarButton: HapticTab,
      }}>
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
