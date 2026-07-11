import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabBarIcon({ name, color, focused, size = 20 }) {
  return <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;
}
