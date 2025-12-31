import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, 
  TextInput, Alert, SafeAreaView, ScrollView, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
// Import tipe data
import { threads as ThreadModel, posts as PostModel } from '../types'; 

// Ganti dengan IP Address laptop kamu yang benar
const API_URL = 'http://192.168.18.12:3000'; 

// Daftar Kategori Tetap
const CATEGORIES = [
  'Adoption Stories',
  'Cat Health & Care',
  'Food & Nutrition',
  'Rescue & Volunteering'
];

export default function ForumScreen() {
  const router = useRouter();
  
  // === STATE DATA ===
  const [threads, setThreads] = useState<ThreadModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');

  // === STATE MODAL BUAT THREAD ===
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedPostCategory, setSelectedPostCategory] = useState('');

  // === STATE MODAL DETAIL & REPLY ===
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ThreadModel | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // --- 1. Fetch Data List Forum ---
  const fetchThreads = async (categoryFilter = 'Semua') => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/forum`;
      if (categoryFilter !== 'Semua') {
        url += `?category=${encodeURIComponent(categoryFilter)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setThreads(data);
    } catch(e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchThreads(activeCategory); 
  }, [activeCategory]);

  // --- 2. Buka Detail Thread (Termasuk Komentar) ---
  const openThreadDetail = async (threadId: number) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      // Fetch detail lengkap dari backend (termasuk relasi posts/komentar)
      const res = await fetch(`${API_URL}/api/forum/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedThread(data);
      } else {
        Alert.alert("Error", "Gagal memuat detail diskusi.");
        setDetailVisible(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server.");
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- 3. Handle Post Thread Baru ---
  const handlePost = async () => {
    const session = await AsyncStorage.getItem('user_session');
    if (!session) return Alert.alert("Login", "Silakan login terlebih dahulu.");
    
    const sessionData = JSON.parse(session);
    const token = sessionData.token;

    if (!token) return Alert.alert("Sesi Kadaluwarsa", "Silakan Logout dan Login kembali.");
    if (!newTitle || !newContent || !selectedPostCategory) return Alert.alert("Perhatian", "Lengkapi semua data.");

    try {
      const res = await fetch(`${API_URL}/api/forum`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTitle, teks: newContent, category: selectedPostCategory 
        }) 
      });

      if (res.ok) {
        setCreateModalVisible(false);
        setNewTitle(''); setNewContent(''); setSelectedPostCategory('');
        setActiveCategory(selectedPostCategory); 
        fetchThreads(selectedPostCategory);
        Alert.alert("Berhasil", "Diskusi berhasil dibuat!");
      } else {
        Alert.alert("Gagal", "Gagal memposting diskusi.");
      }
    } catch(e) { 
      Alert.alert("Error", "Terjadi kesalahan jaringan."); 
    }
  };

  // --- 4. Handle Kirim Balasan (Reply) ---
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    if (!selectedThread) return;

    const session = await AsyncStorage.getItem('user_session');
    if (!session) return Alert.alert("Login", "Silakan login untuk membalas.");

    const sessionData = JSON.parse(session);
    const token = sessionData.token;

    if (!token) return Alert.alert("Sesi Kadaluwarsa", "Silakan Logout dan Login kembali.");

    setReplyLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forum/${selectedThread.id}/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teks: replyContent })
      });

      if (res.ok) {
        setReplyContent('');
        // Refresh detail thread untuk menampilkan komentar baru
        await openThreadDetail(selectedThread.id); 
      } else {
        const err = await res.json();
        Alert.alert("Gagal", err.message || "Gagal mengirim balasan.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengirim balasan.");
    } finally {
      setReplyLoading(false);
    }
  };

  // --- RENDER UTAMA ---
  const renderItem = ({ item }: { item: ThreadModel }) => (
    <TouchableOpacity style={styles.card} onPress={() => openThreadDetail(item.id)}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.cardDate}>Baru saja</Text> 
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.userInfo}>
        <Ionicons name="person-circle-outline" size={20} color="#888" />
        <Text style={styles.cardUser}>{item.username || 'User'}</Text>
      </View>
      <Text style={styles.cardBody} numberOfLines={3}>{item.teks}</Text>
      <Text style={styles.readMoreText}>Lihat Selengkapnya & Balas...</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Utama */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum Diskusi 💬</Text>
        <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Kategori */}
      <View style={{ height: 60 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {['Semua', ...CATEGORIES].map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List Thread */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada diskusi.</Text>}
        />
      )}

      {/* === MODAL 1: BUAT THREAD BARU === */}
      <Modal visible={createModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buat Diskusi Baru</Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={styles.label}>Judul Topik</Text>
            <TextInput style={styles.input} placeholder="Judul..." value={newTitle} onChangeText={setNewTitle} />
            <Text style={styles.label}>Pilih Kategori</Text>
            <View style={styles.categorySelectContainer}>
              {CATEGORIES.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx}
                  style={[styles.categoryOption, selectedPostCategory === cat && styles.categoryOptionActive]}
                  onPress={() => setSelectedPostCategory(cat)}
                >
                  <Text style={[styles.categoryOptionText, selectedPostCategory === cat && styles.categoryOptionTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Isi Diskusi</Text>
            <TextInput style={[styles.input, {height: 150, textAlignVertical: 'top'}]} placeholder="Isi..." multiline value={newContent} onChangeText={setNewContent} />
            <TouchableOpacity style={styles.btn} onPress={handlePost}>
              <Text style={styles.btnText}>Posting Sekarang</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* === MODAL 2: DETAIL THREAD & REPLY === */}
      <Modal visible={detailVisible} animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <SafeAreaView style={styles.detailContainer}>
          {/* Header Modal Detail */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detail Diskusi</Text>
            <View style={{width: 24}} /> 
          </View>

          {detailLoading || !selectedThread ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
          ) : (
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
              style={{ flex: 1 }}
            >
              <FlatList
                data={selectedThread.posts || []}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                // --- Header List: Menampilkan Konten Utama Thread ---
                ListHeaderComponent={
                  <View style={styles.detailHeaderContent}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{selectedThread.category}</Text>
                    </View>
                    <Text style={styles.detailTitle}>{selectedThread.title}</Text>
                    
                    <View style={styles.detailUserInfo}>
                      <Image 
                        source={{ uri: selectedThread.users?.img_url ? `${API_URL}/uploads/${selectedThread.users.img_url}` : 'https://via.placeholder.com/50' }} 
                        style={styles.detailAvatar} 
                      />
                      <View>
                        <Text style={styles.detailUsername}>{selectedThread.users?.nama || selectedThread.username}</Text>
                        <Text style={styles.detailDate}>Penulis</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.detailBody}>{selectedThread.teks}</Text>
                    
                    <View style={styles.divider} />
                    <Text style={styles.commentSectionTitle}>Komentar ({selectedThread.posts?.length || 0})</Text>
                  </View>
                }
                // --- Item List: Menampilkan Komentar ---
                renderItem={({ item }: { item: PostModel }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{item.users?.nama || item.username}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.teks}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyComment}>Belum ada komentar. Jadilah yang pertama!</Text>
                }
              />

              {/* --- Input Balasan (Sticky di Bawah) --- */}
              <View style={styles.replyInputContainer}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Tulis balasan..."
                  value={replyContent}
                  onChangeText={setReplyContent}
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleReply} disabled={replyLoading}>
                  {replyLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', alignItems: 'center', marginTop: 30, elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  
  // Filter Styles
  filterContainer: { paddingHorizontal: 15, alignItems: 'center' },
  filterChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: '#666', fontSize: 13 },
  filterTextActive: { color: '#fff' },

  // Card Styles
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2, marginHorizontal: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  categoryText: { fontSize: 10, color: '#1976d2', fontWeight: 'bold', textTransform: 'uppercase' },
  cardDate: { fontSize: 10, color: '#aaa' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardUser: { fontSize: 12, color: '#666', marginLeft: 4 },
  cardBody: { color: '#555', fontSize: 14, lineHeight: 20 },
  readMoreText: { color: Colors.primary, fontSize: 12, marginTop: 8, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  // Modal Common Styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  
  // Create Thread Styles
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, backgroundColor: '#fafafa' },
  categorySelectContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  categoryOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryOptionText: { fontSize: 12, color: '#555' },
  categoryOptionTextActive: { color: '#fff', fontWeight: 'bold' },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Detail & Reply Styles
  detailContainer: { flex: 1, backgroundColor: '#fff' },
  detailHeaderContent: { marginBottom: 20 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 10 },
  detailUserInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#eee' },
  detailUsername: { fontWeight: 'bold', fontSize: 14 },
  detailDate: { fontSize: 12, color: '#888' },
  detailBody: { fontSize: 15, lineHeight: 24, color: '#444' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  commentSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  
  // Comment Item
  commentItem: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, marginBottom: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontWeight: 'bold', fontSize: 13, color: Colors.primary },
  commentText: { fontSize: 14, color: '#333' },
  emptyComment: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },

  // Reply Input
  replyInputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff', alignItems: 'center' },
  replyInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100, marginRight: 10 },
  sendButton: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});