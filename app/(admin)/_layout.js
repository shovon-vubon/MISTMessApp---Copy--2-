import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import NavHeader from '../../src/components/NavHeader';

export default function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }
  if (!profile) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  if (profile.role !== 'admin') {
    const dest = { student: '/(student)/', gso2: '/(gso2)/', depthead: '/(depthead)/' }[profile.role] || '/';
    return <Redirect href={dest} />;
  }

  return (
    <Stack
      screenOptions={({ route }) => ({
        header: () => <NavHeader title={SCREEN_TITLES[route.name] || 'Admin Panel'} />,
      })}
    />
  );
}

const SCREEN_TITLES = {
  index:    'Admin Panel',
  students: 'All Students',
  gso2:     'GSO-2 Officers',
  depthead: 'Dept Heads',
};
