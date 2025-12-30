// meowlarat-mobile/app/beranda.tsx
import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, 
  RefreshControl, Dimensions, ImageBackground 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// ⚠️ GANTI DENGAN IP LAPTOP KAMU
const API_URL = 'http://192.168.18.12:3000';

const { width } = Dimensions.get('window');

export default function BerandaScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ ready: 0, adopted: 0, shelters: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.log('Gagal ambil stats:', error);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Navbar-like Header */}
        <SafeAreaView style={styles.header}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.appName}>MeowLarat</Text>
            <TouchableOpacity onPress={() => router.push('/profil')}>
                <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
            </TouchableOpacity>
        </SafeAreaView>

        {/* HERO SECTION - Mirip Web */}
        <View style={styles.heroContainer}>
            <ImageBackground 
                source={require('../assets/images/beranda-cat.png')} 
                style={styles.heroImage}
                imageStyle={{ borderRadius: 0 }}
            >
                <View style={styles.heroOverlay}>
                    <Text style={styles.heroTitle}>Temukan Teman Sejati{"\n"}yang Setia Menemanimu</Text>
                    <Text style={styles.heroSubtitle}>
                        Adopsi kucing terlantar dan berikan mereka rumah yang penuh kasih sayang.
                    </Text>
                    <View style={styles.heroButtons}>
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/adopsi')}>
                            <Text style={styles.btnTextPrimary}>Adopsi Sekarang</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/artikel')}>
                            <Text style={styles.btnTextSecondary}>Pelajari Dulu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </View>

        {/* MENU FITUR (Grid Bulat) */}
        <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Layanan Kami</Text>
            <View style={styles.menuGrid}>
                <MenuIcon icon="heart" label="Donasi" color="#ff6b6b" onPress={() => router.push('/donasi')} />
                <MenuIcon icon="book" label="Artikel" color="#4ecdc4" onPress={() => router.push('/artikel')} />
                <MenuIcon icon="map" label="Pet Place" color="#ffe66d" onPress={() => router.push('/petplace')} />
                <MenuIcon icon="shield-checkmark" label="Tanggung Jawab" color="#1a535c" onPress={() => router.push('/lapor')} />
            </View>
        </View>

        {/* STATISTIK SECTION */}
        <View style={styles.statsSection}>
            <Text style={styles.statsHeader}>Dampak Kami Sejauh Ini</Text>
            <View style={styles.statsRow}>
                <StatCard number={stats.ready || 0} label="Siap Adopsi" icon="paw" />
                <StatCard number={stats.adopted || 0} label="Teradopsi" icon="home" />
                <StatCard number={stats.shelters || 0} label="Mitra Shelter" icon="business" />
            </View>
        </View>

        {/* FOOTER SIMPLE */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 MeowLarat Mobile App</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// Komponen Kecil untuk Kerapian
const MenuIcon = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="#fff" />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
);

const StatCard = ({ number, label, icon }: any) => (
    <View style={styles.statCard}>
        <Ionicons name={icon as any} size={28} color={Colors.primary} style={{ marginBottom: 5 }} />
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background }, // Background Kuning Muda
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    backgroundColor: Colors.white,
    elevation: 2
  },
  logo: { width: 35, height: 35, resizeMode: 'contain' },
  appName: { fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginLeft: 10, flex: 1 },
  
  heroContainer: { height: 320, width: '100%' },
  heroImage: { flex: 1, justifyContent: 'center' },
  heroOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  heroTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 10, 
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 10
  },
  heroSubtitle: { 
    fontSize: 14, 
    color: '#eee', 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 20 
  },
  heroButtons: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
  btnPrimary: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  btnSecondary: { borderWidth: 1, borderColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold' },
  btnTextSecondary: { color: '#fff', fontWeight: 'bold' },

  menuContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  menuGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  menuItem: { alignItems: 'center' },
  iconCircle: { width: 55, height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5, elevation: 3 },
  menuLabel: { fontSize: 12, color: Colors.text },

  statsSection: { padding: 20, backgroundColor: Colors.white, marginHorizontal: 20, borderRadius: 15, elevation: 2, marginBottom: 20 },
  statsHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 15, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.gray },

  footer: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  footerText: { color: '#aaa', fontSize: 12 }
});