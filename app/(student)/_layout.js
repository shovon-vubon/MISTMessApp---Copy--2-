import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import NavHeader from '../../src/components/NavHeader';
import TabBarIcon from '../../src/components/TabBarIcon';

export default function StudentLayout() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }
  if (!profile) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  if (profile.role !== 'student') {
    const dest = { gso2: '/(gso2)/', depthead: '/(depthead)/', admin: '/(admin)/' }[profile.role] || '/';
    return <Redirect href={dest} />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <NavHeader title={SCREEN_TITLES[route.name] || 'Dashboard'} />,
        tabBarStyle: {
          backgroundColor: COLORS.bg2,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 4,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.text3,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
      })}
    >
      <Tabs.Screen name="index"   options={{ tabBarLabel: 'Dashboard',    tabBarIcon: (p) => <TabBarIcon name="grid" {...p} /> }} />
      <Tabs.Screen name="request" options={{ tabBarLabel: 'New Request', tabBarIcon: (p) => <TabBarIcon name="add-circle" {...p} /> }} />
      <Tabs.Screen name="history" options={{ tabBarLabel: 'History',     tabBarIcon: (p) => <TabBarIcon name="time" {...p} /> }} />
      <Tabs.Screen name="notices" options={{ tabBarLabel: 'Notices',     tabBarIcon: (p) => <TabBarIcon name="megaphone" {...p} /> }} />
      <Tabs.Screen name="arrival" options={{ href: null }} />
    </Tabs>
  );
}

const SCREEN_TITLES = {
  index:   'Student Dashboard',
  request: 'New Request',
  history: 'Request History',
  notices: 'Notices',
  arrival: 'Return to Mess',
};
