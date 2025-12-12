import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Stats } from '../types';

// ⚠️ GANTI INI: Cek IP Laptop kamu (cmd -> ipconfig)
// Contoh: 'http://192.168.1.5:3000';
const API_URL = 'http://192.168.18.12:3000'; 

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
      console.error("Gagal mengambil statistik:", error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>Selamat Datang</Text>
          <Text style={styles.heroSubtitle}>Temukan Sahabat Kucingmu di Sini</Text>
          
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={() => router.push('/adopsi')}
          >
            <Text style={styles.ctaText}>Dukung Kami!</Text>
          </TouchableOpacity>
        </View>
        
        {/* Kamu bisa hapus Image ini dulu kalau belum ada gambarnya di folder assets */}
        {/* <Image source={require('../assets/images/cat.png')} style={styles.heroImage} resizeMode="contain" /> */}
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.available}</Text>
          <Text style={styles.statLabel}>Siap Adopsi</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.adopted}</Text>
          <Text style={styles.statLabel}>Telah Diadopsi</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.shelterCount}</Text>
          <Text style={styles.statLabel}>Mitra Shelter</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  hero: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, flexDirection: 'row', alignItems: 'center' },
  heroTextContainer: { flex: 1 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.textLight, marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: Colors.textLight, marginBottom: 24 },
  ctaButton: { backgroundColor: Colors.textLight, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  ctaText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  heroImage: { width: 120, height: 120 },
  statsContainer: { backgroundColor: Colors.background, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 40, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 20, minHeight: 500 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 36, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.secondary, marginTop: 4, textAlign: 'center' },
  statSeparator: { width: 1, height: 40, backgroundColor: '#ccc' },
});