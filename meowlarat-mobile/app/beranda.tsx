import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.18.12:3000'; // Ganti IP

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
      console.log('Error stats:', error);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
  }, []);

  const features = [
    { id: 1, name: 'Donasi', icon: 'heart', route: '/donasi', color: '#ff6b6b' },
    { id: 2, name: 'Artikel', icon: 'newspaper', route: '/artikel', color: '#4ecdc4' },
    { id: 3, name: 'Pet Place', icon: 'map', route: '/petplace', color: '#ffe66d' },
    { id: 4, name: 'Tanggung Jawab', icon: 'shield-checkmark', route: '/profil', color: '#1a535c' }, // Link ke profil dulu
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, Cat Lovers! 👋</Text>
            <Text style={styles.subGreeting}>Ayo bantu kucing jalanan.</Text>
          </View>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Image source={require('../assets/images/beranda-cat.png')} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay}>
             <Text style={styles.heroTitle}>MeowLarat</Text>
             <Text style={styles.heroSubtitle}>Platform peduli kucing jalanan.</Text>
          </View>
        </View>

        {/* Feature Grid (Menu Shortcut) */}
        <Text style={styles.sectionTitle}>Fitur Utama</Text>
        <View style={styles.featureGrid}>
          {features.map((item) => (
            <TouchableOpacity key={item.id} style={styles.featureItem} onPress={() => router.push(item.route as any)}>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={28} color="#fff" />
              </View>
              <Text style={styles.featureText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistik */}
        <Text style={styles.sectionTitle}>Statistik Saat Ini</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.ready}</Text>
            <Text style={styles.statLabel}>Siap Adopsi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.adopted}</Text>
            <Text style={styles.statLabel}>Teradopsi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.shelters}</Text>
            <Text style={styles.statLabel}>Mitra Shelter</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  subGreeting: { fontSize: 14, color: '#666' },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  heroCard: { margin: 20, height: 180, borderRadius: 15, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  heroSubtitle: { color: '#eee', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10, marginTop: 10, color: '#333' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  featureItem: { width: '23%', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5, elevation: 3 },
  featureText: { fontSize: 12, textAlign: 'center', color: '#555', fontWeight: '500' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 30 },
  statCard: { width: '31%', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
});