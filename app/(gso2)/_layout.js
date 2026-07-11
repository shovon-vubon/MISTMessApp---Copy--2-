import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import NavHeader from '../../src/components/NavHeader';

function TabIcon({ char, color }) {
  return <Text style={{ color, fontSize: 16 }}>{char}</Text>;
}

const TITLES = {
  index:   'GSO-2 Dashboard',
  notices: 'Notices',
  records: 'All Records',
  overdue: 'Overdue Alerts',
  students: 'Students List',
};

export default function GSO2Layout() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }
  if (!profile) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  if (profile.role !== 'gso2') {
    const dest = { student: '/(student)/', depthead: '/(depthead)/', admin: '/(admin)/' }[profile.role] || '/';
    return <Redirect href={dest} />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <NavHeader title={TITLES[route.name] || 'GSO-2'} />,
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
      <Tabs.Screen name="index"   options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon char="⊞" color={color} /> }} />
      <Tabs.Screen name="notices" options={{ tabBarLabel: 'Notices',   tabBarIcon: ({ color }) => <TabIcon char="📢" color={color} /> }} />
      <Tabs.Screen name="records" options={{ tabBarLabel: 'Records',   tabBarIcon: ({ color }) => <TabIcon char="≡" color={color} /> }} />
      <Tabs.Screen name="overdue" options={{ tabBarLabel: 'Overdue',   tabBarIcon: ({ color }) => <TabIcon char="⚠" color={color} /> }} />
      <Tabs.Screen name="students" options={{ tabBarLabel: 'Students', tabBarIcon: ({ color }) => <TabIcon char="👥" color={color} /> }} />
    </Tabs>
  );
}
