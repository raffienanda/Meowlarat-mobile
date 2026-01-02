import { Tabs, useRouter } from 'expo-router'; // Tambahkan useRouter
import React from 'react';
import { Platform, Alert } from 'react-native'; // Tambahkan Alert
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Tambahkan AsyncStorage

export default function TabLayout() {
  const router = useRouter(); // Inisialisasi router

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

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

      {/* TAB 3: LAPOR (DIBERI LOGIC CEK LOGIN) */}
      <Tabs.Screen
        name="lapor"
        options={{
          title: 'Lapor',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={24} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // 1. Cegah pindah tab otomatis
            e.preventDefault();

            // 2. Cek apakah user sudah login
            AsyncStorage.getItem('user_session').then((session) => {
              if (session) {
                // Jika sudah login, izinkan masuk ke halaman Lapor
                router.push('/lapor');
              } else {
                // Jika belum login, tampilkan peringatan
                Alert.alert(
                  "Akses Dibatasi",
                  "Silakan login terlebih dahulu untuk melapor.",
                  [
                    { text: "Batal", style: "cancel" },
                    { 
                      text: "Login", 
                      onPress: () => router.push('/profil') // Arahkan ke Profil/Login
                    }
                  ]
                );
              }
            });
          },
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

      <Tabs.Screen name="riwayat" options={{ href: null }} />
      <Tabs.Screen name="artikel" options={{ href: null }} />
      <Tabs.Screen name="petplace" options={{ href: null }} />
      <Tabs.Screen name="donasi" options={{ href: null }} />
      <Tabs.Screen name="tanggungjawab" options={{ href: null }} />
    </Tabs>
  );
}