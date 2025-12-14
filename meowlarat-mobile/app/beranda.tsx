import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, 
  RefreshControl, Dimensions, StatusBar, SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Stats } from '../types';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ PENTING: Ganti dengan IP Laptop kamu yang aktif saat ini.
const API_URL = 'http://192.168.18.12:3000'; 

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ available: 0, adopted: 0, shelterCount: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Gagal mengambil statistik. Pastikan IP benar dan Backend jalan:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        
        {/* --- HERO SECTION --- */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Selamat{'\n'}Datang</Text>
            <Text style={styles.heroSubtitle}>Temukan Sahabat Kucingmu di Sini</Text>
            
            <TouchableOpacity 
              style={styles.ctaButton} 
              onPress={() => router.push('/adopsi')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>Dukung Kami!</Text>
              <Ionicons name="paw" size={18} color={Colors.primary} style={{marginLeft: 8}} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroImageContainer}>
            {/* Pastikan gambar 'cat.png' ada di folder assets/images/ */}
            {/* Jika belum ada, ganti require dengan URI gambar online sementara */}
            <Image 
              source={require('../assets/images/beranda-cat.png')} // GANTI INI dengan cat.png jika sudah ada
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* --- STATS SECTION --- */}
        <View style={styles.statsWrapper}>
          <View style={styles.statsCard}>
            <StatItem 
              icon="heart-circle" 
              value={stats.available} 
              label="Siap Adopsi" 
              color={Colors.success} 
            />
            <View style={styles.divider} />
            <StatItem 
              icon="home" 
              value={stats.adopted} 
              label="Telah Diadopsi" 
              color={Colors.primary} 
            />
            <View style={styles.divider} />
            <StatItem 
              icon="business" 
              value={stats.shelterCount} 
              label="Mitra Shelter" 
              color="#f39c12" 
            />
          </View>
        </View>

        {/* --- ADDITIONAL SECTION (Optional) --- */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Kenapa Adopsi?</Text>
          <Text style={styles.infoText}>
            Mengadopsi kucing menyelamatkan nyawa dan memberi kesempatan kedua bagi mereka untuk mendapatkan rumah yang penuh kasih sayang.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Komponen Kecil untuk Item Statistik agar rapi
const StatItem = ({ icon, value, label, color }: { icon: any, value: number, label: string, color: string }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={32} color={color} style={{ marginBottom: 5 }} />
    <Text style={[styles.statNumber, { color: color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Hero Styles
  heroSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60, // Ruang lebih untuk lengkungan/overlap
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomRightRadius: 50, // Efek lengkung
  },
  heroContent: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textLight,
    lineHeight: 42,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 24,
    fontFamily: 'System', 
  },
  ctaButton: {
    backgroundColor: Colors.textLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ctaText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroImageContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Stats Styles
  statsWrapper: {
    marginTop: -40, // Overlap ke atas hero section
    paddingHorizontal: 20,
    zIndex: 10,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8, // Shadow Android
    shadowColor: '#000', // Shadow iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: '#eee',
  },

  // Info Section Styles
  infoSection: {
    padding: 24,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
});