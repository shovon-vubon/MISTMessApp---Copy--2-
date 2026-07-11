import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import NavHeader from '../../src/components/NavHeader';
import TabBarIcon from '../../src/components/TabBarIcon';

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
      <Tabs.Screen name="index"    options={{ tabBarLabel: 'Dashboard', tabBarIcon: (p) => <TabBarIcon name="grid" {...p} /> }} />
      <Tabs.Screen name="notices"  options={{ tabBarLabel: 'Notices',   tabBarIcon: (p) => <TabBarIcon name="megaphone" {...p} /> }} />
      <Tabs.Screen name="records"  options={{ tabBarLabel: 'Records',   tabBarIcon: (p) => <TabBarIcon name="list" {...p} /> }} />
      <Tabs.Screen name="overdue"  options={{ tabBarLabel: 'Overdue',   tabBarIcon: (p) => <TabBarIcon name="warning" {...p} /> }} />
      <Tabs.Screen name="students" options={{ tabBarLabel: 'Students', tabBarIcon: (p) => <TabBarIcon name="people" {...p} /> }} />
    </Tabs>
  );
}
