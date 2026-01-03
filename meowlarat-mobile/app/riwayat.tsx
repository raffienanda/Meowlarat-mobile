import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, ActivityIndicator, 
  SafeAreaView, TouchableOpacity, RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { cat } from '../types';

// GANTI SESUAI CONFIG KAMU
const API_URL = 'http://192.168.100.15:3000'; 

export default function RiwayatScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (!session) { setLoading(false); return; }
      const parsed = JSON.parse(session);
      const user = parsed.user || parsed; 
      const response = await fetch(`${API_URL}/api/cats/history/${user.username}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const renderItem = ({ item }: { item: cat }) => (
    <View style={styles.card}>
      <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.headerRow}>
             <Text style={styles.name}>{item.nama}</Text>
             <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
        </View>
        <Text style={styles.detail}>Ras: {item.ras} • {item.gender}</Text>
        
        <View style={styles.dateContainer}>
             <Ionicons name="calendar-outline" size={14} color="#666" />
             <Text style={styles.date}>
                Diadopsi: {item.adoptdate ? new Date(item.adoptdate).toLocaleDateString('id-ID') : '-'}
             </Text>
        </View>

        <View style={styles.badge}>
            <Text style={styles.badgeText}>Sudah kamu ambil ✅</Text>
        </View>

        {/* TOMBOL UPDATE LAPORAN (DENGAN ADOPT DATE) */}
        <TouchableOpacity 
          style={styles.btnReport} 
          onPress={() => router.push({
            pathname: '/tanggungjawab',
            params: { 
              catId: item.id, 
              catName: item.nama,
              adoptDate: item.adoptdate // PENTING: Kirim tanggal adopsi
            }
          })}
        >
          <Text style={styles.btnReportText}>Update Tanggung Jawab 📝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Riwayat Adopsi</Text>
        <View style={{width: 24}}/>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{padding: 20}}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="paw-outline" size={60} color="#ddd" />
                <Text style={styles.empty}>Belum ada riwayat.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', elevation: 2, marginTop: 30 },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, padding: 12, elevation: 3 },
  image: { width: 90, height: 90, borderRadius: 12, marginRight: 15 },
  info: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  detail: { fontSize: 13, color: '#666', marginBottom: 5 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 12, color: '#666', marginLeft: 5 },
  badge: { backgroundColor: '#e3f2fd', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: Colors.primary },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { fontSize: 18, fontWeight: 'bold', color: '#888', marginTop: 10 },
  
  // BUTTON STYLE
  btnReport: { marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', alignSelf: 'flex-start' },
  btnReportText: { fontSize: 12, color: '#fff', fontWeight: 'bold' }
});