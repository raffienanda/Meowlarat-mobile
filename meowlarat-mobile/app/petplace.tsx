import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, Linking, SafeAreaView, Image, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// GANTI IP SESUAI CONFIG KAMU
const API_URL = 'http://192.168.18.12:3000';

export default function PetPlaceScreen() {
  const [activeTab, setActiveTab] = useState('offline'); // 'offline' or 'online'
  const [places, setPlaces] = useState([]);
  const [onlineShops, setOnlineShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil Data Lokasi Fisik
      const resOffline = await fetch(`${API_URL}/api/findplace`);
      const dataOffline = await resOffline.json();
      setPlaces(dataOffline);

      // 2. Ambil Data Toko Online
      const resOnline = await fetch(`${API_URL}/api/findplace/online`);
      const dataOnline = await resOnline.json();
      setOnlineShops(dataOnline);
    } catch (err) {
      console.error('Gagal ambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (latitude: number, longitude: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  // --- RENDER ITEM: LOKASI FISIK (Tanpa Bintang Rating) ---
  const renderPlaceItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => openMap(item.latitude, item.longitude, item.nama)}
    >
      <Image 
        source={{ uri: `${API_URL}/uploads/img-petplace/${item.img_url}` }} 
        style={styles.cardImage} 
      />
      
      <View style={styles.cardContent}>
        {/* Kategori Badge di atas */}
        <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
            <View style={[styles.badge, { backgroundColor: item.category === 'Vet' ? '#e3f2fd' : '#fff3e0' }]}>
                <Text style={[styles.badgeText, { color: item.category === 'Vet' ? Colors.primary : '#ef6c00' }]}>
                    {item.category}
                </Text>
            </View>
        </View>

        <Text style={styles.placeName}>{item.nama}</Text>
        <Text style={styles.placeAddress} numberOfLines={2}>{item.address}</Text>
        
        <View style={styles.actionRow}>
            <Ionicons name="location-outline" size={14} color={Colors.primary} />
            <Text style={styles.distanceText}>Lihat di Peta</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- RENDER ITEM: TOKO ONLINE ---
  const renderOnlineItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.onlineCard} onPress={() => openLink(item.link)}>
        <View style={[styles.iconBox, { backgroundColor: item.source === 'SHOPEE' ? '#feefe0' : '#e0f2f1' }]}>
            <Ionicons 
                name={item.source === 'SHOPEE' ? "bag-handle" : "cart"} 
                size={24} 
                color={item.source === 'SHOPEE' ? '#ee4d2d' : '#03ac0e'} 
            />
        </View>
        <View style={{flex: 1}}>
            <Text style={styles.onlineName}>{item.nama}</Text>
            <Text style={styles.onlineDesc}>{item.deskripsi}</Text>
            {item.notes && <Text style={styles.onlineNote}>Promo: {item.notes}</Text>}
        </View>
        <Ionicons name="open-outline" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cari Pet Place 🏥</Text>
        <Text style={styles.subtitle}>Temukan kebutuhan anabulmu</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'offline' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('offline')}
        >
            <Text style={[styles.tabText, activeTab === 'offline' && styles.tabTextActive]}>Terdekat (Peta)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'online' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('online')}
        >
            <Text style={[styles.tabText, activeTab === 'online' && styles.tabTextActive]}>Toko Online</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={activeTab === 'offline' ? places : onlineShops}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={activeTab === 'offline' ? renderPlaceItem : renderOnlineItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
          ListEmptyComponent={
            <View style={{alignItems:'center', marginTop: 50}}>
                <Ionicons name="search-outline" size={40} color="#ccc"/>
                <Text style={{color:'#999', marginTop:10}}>Data tidak ditemukan.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', marginTop: 30, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  subtitle: { color: '#666' },

  // Tabs
  tabContainer: { flexDirection: 'row', padding: 10, justifyContent:'center', gap: 10 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#eee' },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { color: '#666', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },

  // Card Offline
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden' },
  cardImage: { width: 100, height: '100%', backgroundColor: '#ddd' },
  cardContent: { flex: 1, padding: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  placeName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  placeAddress: { fontSize: 12, color: '#666', marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12, color: Colors.primary, fontWeight: 'bold' },

  // Card Online
  onlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  onlineName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  onlineDesc: { fontSize: 12, color: '#666' },
  onlineNote: { fontSize: 10, color: '#ef6c00', marginTop: 4, fontStyle: 'italic' },
});