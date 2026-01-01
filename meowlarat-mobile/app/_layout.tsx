import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary, // Menggunakan warna primary
        headerShown: false, // Menyembunyikan header default
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      
      {/* Sembunyikan halaman Index (Splash/Login) dari Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }, // Sembunyikan tab bar di halaman login
        }}
      />

      {/* Sembunyikan halaman Register dari Tabs */}
      <Tabs.Screen
        name="register"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* TAB 1: BERANDA */}
      <Tabs.Screen
        name="beranda"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* TAB 2: ADOPSI */}
      <Tabs.Screen
        name="adopsi"
        options={{
          title: 'Adopsi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'paw' : 'paw-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* TAB 3: LAPOR */}
      <Tabs.Screen
        name="lapor"
        options={{
          title: 'Lapor',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* TAB 4: FORUM */}
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* TAB 5: PROFIL */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* MENU LAIN (Disembunyikan dari Navbar, tapi halaman tetap aktif) */}
      <Tabs.Screen name="riwayat" options={{ href: null }} />  {/* <-- DIUBAH DI SINI */}
      <Tabs.Screen name="artikel" options={{ href: null }} />
      <Tabs.Screen name="petplace" options={{ href: null }} />
      <Tabs.Screen name="donasi" options={{ href: null }} />
      <Tabs.Screen name="tanggungjawab" options={{ href: null }} />
    </Tabs>
  );
}