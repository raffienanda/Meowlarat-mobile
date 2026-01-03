import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, TouchableOpacity, 
  Modal, ActivityIndicator, SafeAreaView, RefreshControl, ScrollView, Dimensions 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// GANTI IP SESUAI CONFIG KAMU
const API_URL = 'http://192.168.18.12:3000';

// Tipe Data Artikel sesuai response Backend
interface Artikel {
  id: number;
  nama: string;         // Backend pakai 'nama', bukan 'judul'
  category: string;
  teks_snippet: string; // Backend kirim snippet untuk list
  teks?: string;        // Backend kirim teks full saat detail fetch (opsional di list)
  img_url: string;
  color: string;        // Backend kirim warna kategori
}

export default function ArtikelScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Artikel | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false); // Loading saat buka detail

  // Ambil data setiap kali halaman dibuka
  useFocusEffect(
    useCallback(() => {
      fetchArticles();
    }, [])
  );

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/artikel`);
      const result = await response.json();
      
      if (response.ok) {
        // PERBAIKAN: Ambil array dari property 'data'
        // Backend sudah sort by id desc, jadi tidak perlu sort manual client-side
        setArticles(result.data || []); 
      } else {
        console.error("Gagal mengambil data artikel:", result.message);
      }
    } catch (error) {
      console.error("Error koneksi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk membuka detail artikel (perlu fetch ulang untuk dapat teks lengkap)
  const openArticle = async (item: Artikel) => {
    setModalVisible(true);
    setLoadingDetail(true);
    setSelectedArticle(item); // Tampilkan data awal dulu

    try {
      // Fetch detail untuk dapat full 'teks'
      const response = await fetch(`${API_URL}/api/artikel/${item.id}`);
      const detailData = await response.json();
      if (response.ok) {
        setSelectedArticle(detailData);
      }
    } catch (e) {
      console.error("Gagal load detail", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: Artikel }) => (
    <TouchableOpacity style={styles.card} onPress={() => openArticle(item)}>
      <Image 
        source={{ uri: `${API_URL}/uploads/img-artikel/${item.img_url}` }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      
      {/* Badge Kategori */}
      <View style={[styles.categoryBadge, { backgroundColor: item.color }]}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nama}</Text>
        <Text style={styles.cardPreview} numberOfLines={3}>
          {item.teks_snippet}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.readMore}>Baca Selengkapnya →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Artikel & Tips 💡</Text>
        <Text style={styles.headerSubtitle}>Edukasi merawat anabul kesayangan</Text>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 10, color: '#888' }}>Memuat artikel...</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchArticles} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada artikel.</Text>
            </View>
          }
        />
      )}

      {/* MODAL DETAIL ARTIKEL */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={modalVisible} 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Tombol Tutup */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedArticle && (
                <>
                  <Image 
                    source={{ uri: `${API_URL}/uploads/img-artikel/${selectedArticle.img_url}` }} 
                    style={styles.modalImage} 
                  />
                  
                  <View style={[styles.tagContainer, { backgroundColor: selectedArticle.color }]}>
                     <Text style={styles.tagText}>{selectedArticle.category}</Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedArticle.nama}</Text>
                  
                  <View style={styles.separator} />
                  
                  {loadingDetail ? (
                    <ActivityIndicator color={Colors.primary} style={{marginTop: 20}} />
                  ) : (
                    <Text style={styles.modalBody}>
                      {/* Tampilkan teks full jika ada, kalau tidak fallback ke snippet */}
                      {selectedArticle.teks || selectedArticle.teks_snippet} 
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  // Header
  header: { padding: 20, backgroundColor: '#fff', marginTop: 30, elevation: 2, borderBottomWidth:1, borderBottomColor:'#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },

  // List
  listContainer: { padding: 15, paddingBottom: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Card Styles
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 16, 
    elevation: 3, 
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 160, backgroundColor: '#eee' },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  cardPreview: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 5 },
  readMore: { fontSize: 12, color: Colors.primary, fontWeight: 'bold' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContainer: { 
    backgroundColor: '#fff', 
    height: '95%', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    overflow: 'hidden' 
  },
  closeBtn: { 
    position: 'absolute', 
    top: 15, 
    right: 15, 
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  modalContent: { padding: 0, paddingBottom: 40 },
  modalImage: { width: '100%', height: 250, backgroundColor: '#eee' },
  tagContainer: { 
    alignSelf: 'flex-start', 
    marginHorizontal: 20, 
    marginTop: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 6 
  },
  tagText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginHorizontal: 20, marginTop: 10, marginBottom: 5 },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 15, marginHorizontal: 20 },
  modalBody: { fontSize: 16, color: '#444', lineHeight: 26, textAlign: 'justify', paddingHorizontal: 20 },
});