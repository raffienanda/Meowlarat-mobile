// meowlarat-mobile/app/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        headerShown: false,
        tabBarStyle: { 
          height: Platform.OS === 'ios' ? 85 : 65, 
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' }
      }}>
      <Tabs.Screen
        name="beranda"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="adopsi"
        options={{
          title: 'Adopsi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "paw" : "paw-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lapor"
        options={{
          title: 'Lapor',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "megaphone" : "megaphone-outline"} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Halaman yang disembunyikan dari Tab Bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="donasi" options={{ href: null }} />
      <Tabs.Screen name="artikel" options={{ href: null }} />
      <Tabs.Screen name="petplace" options={{ href: null }} />
    </Tabs>
  );
}