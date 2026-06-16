import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import NavHeader from '../../src/components/NavHeader';

function TabIcon({ char, color }) {
  return <Text style={{ color, fontSize: 16 }}>{char}</Text>;
}

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
      <Tabs.Screen
        name="index"
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon char="⊞" color={color} /> }}
      />
      <Tabs.Screen
        name="request"
        options={{ tabBarLabel: 'New Request', tabBarIcon: ({ color }) => <TabIcon char="+" color={color} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ tabBarLabel: 'History', tabBarIcon: ({ color }) => <TabIcon char="≡" color={color} /> }}
      />
      <Tabs.Screen name="arrival" options={{ href: null }} />
    </Tabs>
  );
}

const SCREEN_TITLES = {
  index:   'Student Dashboard',
  request: 'New Request',
  history: 'Request History',
  arrival: 'Return to Mess',
};
