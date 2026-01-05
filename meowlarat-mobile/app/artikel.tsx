import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, TouchableOpacity, 
  Modal, ActivityIndicator, SafeAreaView, RefreshControl, ScrollView, useWindowDimensions, StatusBar
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import RenderHtml from 'react-native-render-html'; // <--- IMPORT LIBRARY HTML

// ⚠️ GANTI IP SESUAI IP LAPTOP KAMU
const API_URL = 'http://192.168.18.12:3000';

interface Artikel {
  id: number;
  nama: string;
  category: string;
  teks_snippet: string;
  teks?: string;
  img_url: string;
  color: string;
}

export default function ArtikelScreen() {
  const { width } = useWindowDimensions(); // Pakai hook ini utk responsif HTML
  const [articles, setArticles] = useState<Artikel[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Artikel | null>(null); 
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Artikel | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
      
      if (response.ok && result.data) {
        let allData = result.data;
        if (allData.length > 0) {
           const randomIndex = Math.floor(Math.random() * allData.length);
           setFeaturedArticle(allData[randomIndex]);
           setArticles(allData); 
        } else {
           setArticles([]);
        }
      }
    } catch (error) {
      console.error("Error koneksi:", error);
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (item: Artikel) => {
    setModalVisible(true);
    setLoadingDetail(true);
    setSelectedArticle(item); 

    try {
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

  // --- HEADER HERO ---
  const renderHeader = () => (
    <View>
       <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
             <Text style={{color: '#ffeeb3'}}>Cat</Text>Pedia
          </Text>
          <Text style={styles.heroSubtitle}>Pusat panduan & fakta unik kucing.</Text>
       </View>

       {featuredArticle && (
         <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Artikel Pilihan 🌟</Text>
            <TouchableOpacity 
               style={[styles.featuredCard, { backgroundColor: featuredArticle.color || '#d1fae5' }]} 
               onPress={() => openArticle(featuredArticle)}
            >
               <View style={styles.featuredContent}>
                  <Text style={styles.featuredBadge}>{featuredArticle.category}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{featuredArticle.nama}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>{featuredArticle.teks_snippet}</Text>
                  <Text style={styles.readMore}>Baca Sekarang →</Text>
               </View>
               <Image 
                  source={{ uri: `${API_URL}/uploads/img-artikel/${featuredArticle.img_url}` }} 
                  style={styles.featuredImage}
               />
            </TouchableOpacity>
         </View>
       )}

       <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Artikel Terbaru</Text>
       </View>
    </View>
  );

  // --- RENDER ITEM LIST (GRID) ---
  // Kalkulasi lebar: (Layar - (Padding Kiri 20 + Padding Kanan 20 + Gap Tengah 15)) / 2 Kolom
  const CARD_GAP = 15;
  const PADDING_HORIZONTAL = 20;
  const cardWidth = (width - (PADDING_HORIZONTAL * 2) - CARD_GAP) / 2;

  const renderItem = ({ item }: { item: Artikel }) => (
    <TouchableOpacity 
        style={[styles.card, { width: cardWidth }]} 
        onPress={() => openArticle(item)}
    >
      <Image 
        source={{ uri: `${API_URL}/uploads/img-artikel/${item.img_url}` }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
         <View style={[styles.miniBadge, { backgroundColor: item.color }]}>
            <Text style={styles.miniBadgeText}>{item.category}</Text>
         </View>
         <Text style={styles.cardTitle} numberOfLines={3}>{item.nama}</Text>
      </View>
    </TouchableOpacity>
  );

  // --- CONFIG HTML RENDERER ---
  // Kamu bisa styling tag HTML spesifik disini
  const tagsStyles = {
    p: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 10, textAlign: 'justify' },
    h1: { fontSize: 22, color: '#333', marginBottom: 10 },
    h2: { fontSize: 20, color: '#333', marginBottom: 10 },
    li: { fontSize: 16, color: '#555', marginBottom: 5 },
    img: { borderRadius: 10, marginVertical: 10 }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002b5b" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 10, color: '#666' }}>Sedang memuat...</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2} 
          // columnWrapperStyle: Mengatur layout baris (row) dalam grid
          columnWrapperStyle={{ 
              justifyContent: 'space-between', // Pastikan mentok kiri-kanan
              paddingHorizontal: 20,           // Jarak dari layar kiri-kanan
              gap: 15                          // Jarak antar item (tengah) - Support Expo SDK 48+
          }} 
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchArticles} />}
        />
      )}

      {/* --- MODAL DETAIL --- */}
      <Modal 
        animationType="slide" 
        visible={modalVisible} 
        onRequestClose={() => setModalVisible(false)}
      >
         <View style={styles.modalHeaderBar}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backButton}>
               <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>Detail Artikel</Text>
            <View style={{width:24}} /> 
         </View>

         <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
           {selectedArticle && (
             <>
               <Image 
                 source={{ uri: `${API_URL}/uploads/img-artikel/${selectedArticle.img_url}` }} 
                 style={styles.modalImage} 
               />
               
               <View style={styles.modalContent}>
                  <View style={[styles.tagPill, { backgroundColor: selectedArticle.color }]}>
                     <Text style={styles.tagText}>{selectedArticle.category}</Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedArticle.nama}</Text>
                  
                  {loadingDetail ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={{marginTop:20}} />
                  ) : (
                    <View style={{ marginTop: 10 }}>
                        {/* RENDER HTML DISINI */}
                        {selectedArticle.teks ? (
                            <RenderHtml
                                contentWidth={width - 50} // Lebar konten dikurangi padding modal
                                source={{ html: selectedArticle.teks }}
                                tagsStyles={tagsStyles} // Masukkan custom style CSS
                            />
                        ) : (
                            <Text style={styles.modalBody}>{selectedArticle.teks_snippet}</Text>
                        )}
                    </View>
                  )}
               </View>
             </>
           )}
         </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e5f2ff' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // HERO SECTION
  heroSection: {
    padding: 25,
    backgroundColor: '#002b5b', 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    alignItems: 'center',
    paddingTop: 40
  },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  heroSubtitle: { color: '#dbeafe', marginTop: 5, fontSize: 14 },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#002b5b', marginBottom: 10 },

  // FEATURED CARD
  featuredCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width:0, height:2 }
  },
  featuredContent: { flex: 1, paddingRight: 10 },
  featuredBadge: { 
     fontSize: 10, fontWeight: 'bold', color: '#000', 
     backgroundColor: 'rgba(255,255,255,0.5)', alignSelf: 'flex-start', 
     paddingHorizontal:8, paddingVertical:2, borderRadius:8, marginBottom: 5 
  },
  featuredTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  featuredDesc: { fontSize: 12, color: '#000', opacity: 0.8, marginBottom: 8 },
  readMore: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  featuredImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff' },

  // GRID ITEM CARD
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20, // Jarak vertikal antar baris
    elevation: 2,
    overflow: 'hidden'
    // Width diatur dinamis di renderItem
  },
  cardImage: { width: '100%', height: 120, backgroundColor: '#eee' },
  cardContent: { padding: 12 },
  miniBadge: { 
    alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, 
    borderRadius: 4, marginBottom: 6 
  },
  miniBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  // --- MODAL STYLES ---
  modalHeaderBar: {
     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
     padding: 15, backgroundColor: '#fff', elevation: 2
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  backButton: { padding: 5 },
  
  modalImage: { width: '100%', height: 250, backgroundColor: '#eee' },
  modalContent: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -20 },
  tagPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 15 },
  tagText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  modalBody: { fontSize: 16, color: '#555', lineHeight: 26, textAlign: 'justify' }
});