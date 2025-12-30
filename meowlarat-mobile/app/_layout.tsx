import { Tabs } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10 },
      }}>
      <Tabs.Screen
        name="beranda"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="adopsi"
        options={{
          title: 'Adopsi',
          tabBarIcon: ({ color }) => <Ionicons name="paw" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lapor"
        options={{
          title: 'Lapor',
          tabBarIcon: ({ color }) => <Ionicons name="alert-circle" size={32} color={color} />,
          tabBarLabelStyle: { fontWeight: 'bold' }
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      
      {/* Sembunyikan route halaman sekunder dari Tab Bar, tapi tetap bisa diakses */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="donasi" options={{ href: null }} />
      <Tabs.Screen name="artikel" options={{ href: null }} />
      <Tabs.Screen name="petplace" options={{ href: null }} />
    </Tabs>
  );
}