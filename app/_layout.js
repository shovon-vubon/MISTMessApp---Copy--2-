import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { PAPER_THEME } from '../src/constants/theme';

const PROTECTED = ['(student)', '(gso2)', '(depthead)', '(admin)'];

function AuthGate() {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inProtected = PROTECTED.includes(segments[0]);
    if (!user && inProtected) {
      router.replace('/');
    }
  }, [user, loading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider theme={PAPER_THEME}>
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
