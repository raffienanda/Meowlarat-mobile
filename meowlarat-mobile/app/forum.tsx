import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, TouchableOpacity, 
  TextInput, Modal, Alert, ActivityIndicator, SafeAreaView, RefreshControl, ScrollView, Keyboard 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// GANTI IP SESUAI CONFIG KAMU
const API_URL = 'http://192.168.100.15:3000';

const FORUM_CATEGORIES = [
  'Adoption Stories', 
  'Cat Health & Care', 
  'Food & Nutrition', 
  'Rescue & Volunteering'
];

interface User {
  nama: string;
  img_url?: string;
}

interface ForumPost {
  id: number;
  user_id: number;
  username: string;
  title: string;       
  teks: string;        
  category: string;
  createdAt: string;
  users?: User;        
  posts?: Comment[];   
  _count?: { posts: number }; // Field dari backend untuk jumlah komentar
}

interface Comment {
  id: number;
  username: string;
  teks: string;       
  createdAt: string;
  users?: User;       
}

export default function ForumScreen() {
  const router = useRouter();
  
  // State Data
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [userSession, setUserSession] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('Semua');

  // State Modal Detail
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // State Modal Buat Post
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCreateCategory, setSelectedCreateCategory] = useState(FORUM_CATEGORIES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [posting, setPosting] = useState(false);

  const getToken = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_session');
      if (jsonValue != null) {
        const session = JSON.parse(jsonValue);
        return session.token; 
      }
      return null;
    } catch(e) { return null; }
  };

  useFocusEffect(
    useCallback(() => {
      checkSession();
      fetchPosts(activeCategory);
    }, [activeCategory])
  );

  const checkSession = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_session');
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        setUserSession(parsed.user || parsed);
      } else {
        setUserSession(null);
      }
    } catch (e) { console.error("Gagal baca sesi"); }
  };

  const fetchPosts = async (category = 'Semua') => {
    if (!refreshing) setLoading(true); 
    try {
      let url = `${API_URL}/api/forum`;
      if (category !== 'Semua') {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const response = await fetch(url); 
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch (error) { 
      console.error("Error fetching posts:", error); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const fetchThreadDetail = async (postId: number) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`${API_URL}/api/forum/${postId}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedPost(data);
        setComments(data.posts || []); 
      } else {
        setComments([]);
      }
    } catch (error) { 
      setComments([]);
    } finally { 
      setLoadingComments(false); 
    }
  };

  const handleOpenDetail = (post: ForumPost) => {
    setSelectedPost(post);
    setComments([]); 
    setModalVisible(true);
    fetchThreadDetail(post.id); 
  };

  const handleReply = async () => {
    if (!userSession) {
      Alert.alert("Akses Dibatasi", "Login dulu untuk membalas.", [
        { text: "Batal", style: "cancel" },
        { text: "Login", onPress: () => { setModalVisible(false); router.push('/profil'); } }
      ]);
      return;
    }
    if (!newComment.trim()) return Alert.alert("Error", "Komentar kosong.");
    if (!selectedPost) return;

    try {
      const token = await getToken(); 
      const response = await fetch(`${API_URL}/api/forum/${selectedPost.id}/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ teks: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchThreadDetail(selectedPost.id); // Refresh komentar di modal
        
        // --- UPDATE JUMLAH KOMENTAR DI LIST UTAMA (REALTIME) ---
        setPosts(currentPosts => 
          currentPosts.map(p => 
            p.id === selectedPost.id 
              ? { ...p, _count: { posts: (p._count?.posts || 0) + 1 } } 
              : p
          )
        );

        Alert.alert("Sukses", "Komentar terkirim!");
      } else {
        Alert.alert("Gagal", "Tidak bisa mengirim komentar.");
      }
    } catch (e) { Alert.alert("Error", "Gagal koneksi server."); }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return Alert.alert("Error", "Judul dan isi wajib diisi.");
    setPosting(true);
    try {
      const token = await getToken(); 
      const response = await fetch(`${API_URL}/api/forum`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPostTitle,
          teks: newPostContent,
          category: selectedCreateCategory 
        }),
      });

      if (response.ok) {
        setCreateModalVisible(false);
        setNewPostTitle('');
        setNewPostContent('');
        setSelectedCreateCategory(FORUM_CATEGORIES[0]); 
        fetchPosts(activeCategory); 
        Alert.alert("Berhasil", "Postingan kamu sudah tayang!");
      } else {
        const errData = await response.json();
        Alert.alert("Gagal", errData.message || "Gagal memposting.");
      }
    } catch (e) { Alert.alert("Error", "Gagal koneksi server."); } 
    finally { setPosting(false); }
  };

  const onFabPress = () => {
    if (userSession) {
      setCreateModalVisible(true);
    } else {
      Alert.alert("Ingin Berdiskusi?", "Silakan login dulu.", [
        { text: "Nanti Saja", style: "cancel" },
        { text: "Login", onPress: () => router.push('/profil') }
      ]);
    }
  };

  // --- RENDER ---
  const renderItem = ({ item }: { item: ForumPost }) => {
    const avatarUrl = item.users?.img_url 
      ? `${API_URL}/uploads/avatars/${item.users.img_url}`
      : `https://ui-avatars.com/api/?name=${item.username}&background=random`;
    
    // HITUNG JUMLAH KOMENTAR: Prioritaskan _count dari backend list
    const commentCount = item._count?.posts || 0;

    let badgeColor = '#e3f2fd';
    let textColor = Colors.primary;
    if (item.category === 'Rescue & Volunteering') { badgeColor = '#fff3e0'; textColor = '#ef6c00'; }
    if (item.category === 'Cat Health & Care') { badgeColor = '#e8f5e9'; textColor = '#2e7d32'; }

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleOpenDetail(item)}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={{flex:1}}>
            <Text style={styles.username}>{item.users?.nama || item.username}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeColor, alignSelf: 'flex-start', marginBottom: 8 }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{item.category || 'Umum'}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody} numberOfLines={3}>{item.teks}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
             <Ionicons name="chatbox-outline" size={18} color="#666" />
             <Text style={styles.footerText}>{commentCount} Komentar</Text>
          </View>
          <Text style={styles.readMore}>Lihat Diskusi →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum Diskusi 💬</Text>
        <Text style={styles.headerSubtitle}>Tanya jawab sesama pecinta kucing</Text>
      </View>

      {/* FILTER BUTTONS */}
      <View style={{ marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {['Semua', ...FORUM_CATEGORIES].map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.filterChip, activeCategory === item && styles.filterChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.filterText, activeCategory === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST FORUM */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(activeCategory); }} />}
          ListEmptyComponent={
             <View style={{alignItems:'center', marginTop:50}}>
                <Ionicons name="chatbubbles-outline" size={50} color="#ccc"/>
                <Text style={styles.emptyText}>Belum ada diskusi.</Text>
             </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onFabPress}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* MODAL DETAIL */}
      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={{flex:1, backgroundColor:'#fff'}}>
            <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Detail Diskusi</Text>
                <View style={{width:24}}/>
            </View>
            <ScrollView contentContainerStyle={{padding: 20}}>
                {selectedPost && (
                    <>
                        <View style={styles.detailHeader}>
                             <Image 
                                source={{ uri: selectedPost.users?.img_url ? `${API_URL}/uploads/avatars/${selectedPost.users.img_url}` : `https://ui-avatars.com/api/?name=${selectedPost.username}` }} 
                                style={styles.avatarLarge} 
                             />
                             <View>
                                 <Text style={styles.detailUsername}>{selectedPost.users?.nama || selectedPost.username}</Text>
                                 <Text style={styles.detailDate}>{new Date(selectedPost.createdAt).toLocaleDateString()}</Text>
                             </View>
                        </View>
                        <View style={[styles.detailBadge, { backgroundColor: '#f0f4f8', alignSelf:'flex-start', marginBottom: 10 }]}>
                             <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.primary }}>{selectedPost.category || 'Umum'}</Text>
                        </View>
                        <Text style={styles.detailTitle}>{selectedPost.title}</Text>
                        <Text style={styles.detailBody}>{selectedPost.teks}</Text>
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>Komentar ({comments.length})</Text>
                        {loadingComments ? (
                            <ActivityIndicator color={Colors.primary} style={{marginTop:20}} />
                        ) : comments.length === 0 ? (
                            <Text style={{color:'#999', fontStyle:'italic', marginTop:10}}>Belum ada komentar.</Text>
                        ) : (
                            comments.map((c) => (
                                <View key={c.id} style={styles.commentItem}>
                                    <Text style={styles.commentUser}>{c.users?.nama || c.username}</Text>
                                    <Text style={styles.commentBody}>{c.teks}</Text>
                                    <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input} 
                    placeholder={userSession ? "Tulis balasan..." : "Login untuk membalas"}
                    value={newComment}
                    onChangeText={setNewComment}
                    editable={!!userSession} 
                />
                <TouchableOpacity style={[styles.sendBtn, !userSession && {backgroundColor:'#ccc'}]} onPress={handleReply} disabled={!userSession}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL BUAT TOPIK (SCROLLABLE FORM) */}
      <Modal animationType="slide" transparent={true} visible={createModalVisible} onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.createModal}>
                <Text style={styles.createTitle}>Buat Topik Baru</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <TextInput 
                      style={styles.inputBox} 
                      placeholder="Judul Topik" 
                      value={newPostTitle} 
                      onChangeText={setNewPostTitle} 
                    />

                    {/* CUSTOM DROPDOWN */}
                    <TouchableOpacity 
                        style={styles.dropdownBtn} 
                        onPress={() => {
                          Keyboard.dismiss(); 
                          setShowDropdown(!showDropdown);
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dropdownText}>{selectedCreateCategory}</Text>
                        <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                    </TouchableOpacity>

                    {showDropdown && (
                        <View style={styles.dropdownContainer}>
                            {FORUM_CATEGORIES.map((cat, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.dropdownItem, selectedCreateCategory === cat && { backgroundColor: '#f0f8ff' }]}
                                    onPress={() => {
                                        setSelectedCreateCategory(cat);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <Text style={{ 
                                        color: selectedCreateCategory === cat ? Colors.primary : '#333',
                                        fontWeight: selectedCreateCategory === cat ? 'bold' : 'normal' 
                                    }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TextInput 
                      style={[styles.inputBox, styles.textArea]} 
                      placeholder="Ceritakan detail masalahnya..." 
                      multiline 
                      numberOfLines={5} 
                      value={newPostContent} 
                      onChangeText={setNewPostContent} 
                    />

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.btnCancel} onPress={() => setCreateModalVisible(false)}>
                            <Text style={{color: Colors.danger, fontWeight:'bold'}}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSubmit} onPress={handleCreatePost} disabled={posting}>
                            {posting ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight:'bold'}}>Posting</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', marginTop: 30, elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  headerSubtitle: { fontSize: 14, color: '#666' },
  listContent: { padding: 15, paddingBottom: 80 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#999' },
  
  filterContainer: { paddingHorizontal: 15, paddingVertical: 10, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor:'#eee' },
  username: { fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#999' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  detailBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  cardBody: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, color: '#666' },
  readMore: { fontSize: 12, color: Colors.primary, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarLarge: { width: 50, height: 50, borderRadius: 25, marginRight: 10, backgroundColor:'#eee' },
  detailUsername: { fontSize: 16, fontWeight: 'bold' },
  detailDate: { fontSize: 12, color: '#999' },
  detailTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: Colors.primary },
  detailBody: { fontSize: 16, lineHeight: 24, color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  commentItem: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 10 },
  commentUser: { fontWeight: 'bold', fontSize: 12, color: Colors.primary, marginBottom: 2 },
  commentBody: { fontSize: 14, color: '#333' },
  commentDate: { fontSize: 10, color: '#999', marginTop: 4, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  sendBtn: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  createModal: { backgroundColor: '#fff', borderRadius: 15, padding: 20, maxHeight: '85%' },
  createTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  inputBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15 },
  
  // STYLE DROPDOWN
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: '#fff' },
  dropdownText: { fontSize: 14, color: '#333' },
  dropdownContainer: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 15, backgroundColor: '#fff' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  
  textArea: { textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { padding: 10 },
  btnSubmit: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
});