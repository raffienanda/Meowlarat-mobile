import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        // ...style lainnya biarkan sama
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      {/* Tab Beranda */}
      <Tabs.Screen
        name="beranda"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* --- TAMBAHKAN BAGIAN INI (DONASI) --- */}
      <Tabs.Screen
        name="donasi"
        options={{
          title: 'Donasi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      {/* ----------------------------------- */}

      {/* Tab Adopsi */}
      <Tabs.Screen
        name="adopsi"
        options={{
          title: 'Adopsi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="index"
        options={{
          href: null, // <--- INI KUNCINYA: Href null artinya "jangan tampilkan tombol ini"
        }}
      />

      {/* Pastikan Modal/Halaman lain disembunyikan dari tab jika ada */}
      <Tabs.Screen name="modal" options={{ href: null }} />
      {/* Jika kamu pakai beranda.tsx kemarin dan index untuk redirect, sembunyikan juga index */}
    </Tabs>
  );
}