import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, 
  Modal, ActivityIndicator, SafeAreaView, FlatList, RefreshControl 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.100.15:3000'; 

// Tipe untuk Alert Custom
type AlertType = 'success' | 'error' | 'warning' | 'info';

export default function LaporScreen() {
  const router = useRouter();
  
  // STATE NAVIGASI TAB
  const [activeTab, setActiveTab] = useState<'form' | 'feed'>('form');

  // STATE FORM LAPOR
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // STATE FEED
  const [feedData, setFeedData] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // USER SESSION
  const [userSession, setUserSession] = useState<any>(null);

  // --- STATE CUSTOM ALERT (ANTI AMPAS) ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as AlertType,
    title: '',
    message: '',
    btnText: 'Oke',
    onPress: () => {}
  });

  useFocusEffect(
    useCallback(() => {
      checkSession();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'feed') {
        fetchAllReports();
      }
    }, [activeTab])
  );

  // --- HELPER SHOW ALERT ---
  const showAlert = (type: AlertType, title: string, message: string, onPress?: () => void) => {
    setAlertConfig({
        type,
        title,
        message,
        btnText: type === 'success' ? 'Mantap' : 'Coba Lagi',
        onPress: onPress || (() => setAlertVisible(false))
    });
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
    if (alertConfig.onPress) alertConfig.onPress();
  };

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (session) {
        const parsed = JSON.parse(session);
        setUserSession(parsed.user || parsed);
      } else {
        showAlert('warning', 'Akses Ditolak', 'Silakan login dulu bos!', () => router.replace('/profil'));
      }
    } catch (e) { console.error(e); }
  };

  const fetchAllReports = async () => {
    setLoadingFeed(true);
    try {
      const response = await fetch(`${API_URL}/api/lapor/all`);
      const data = await response.json();
      setFeedData(data);
    } catch (e) { console.error(e); } finally { setLoadingFeed(false); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!judul || !isi || !location) {
      showAlert('error', 'Data Belum Lengkap', 'Mohon isi Judul, Lokasi, dan Detail laporan.');
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('username', userSession.username);
      formData.append('judul', judul);
      formData.append('isi', isi);
      formData.append('location', location);
      
      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename as string);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        // @ts-ignore
        formData.append('gambar', { 
            uri: image, 
            name: filename, 
            type 
        });
      }

      // === FIX GAGAL KIRIM: JANGAN PAKAI HEADER CONTENT-TYPE MANUAL ===
      const response = await fetch(`${API_URL}/api/lapor`, {
        method: 'POST',
        body: formData,
        // headers: ... (JANGAN DIISI BIAR FETCH YG NGATUR BOUNDARY)
      });

      const result = await response.json();
      
      if (response.ok) {
        showAlert('success', 'Laporan Terkirim! 🎉', 'Terima kasih sudah peduli. Laporanmu akan segera dicek admin.', () => {
            setAlertVisible(false);
            setJudul(''); setIsi(''); setLocation(''); setImage(null);
            setActiveTab('feed'); 
        });
      } else {
        showAlert('error', 'Gagal Mengirim', result.message || "Terjadi kesalahan server.");
      }
    } catch (error) {
      showAlert('error', 'Koneksi Error', 'Gagal menghubungi server. Cek internetmu.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDERER: FORM ---
  const renderForm = () => (
    <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Judul Laporan</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Contoh: Kucing terluka di jalan..." 
                value={judul} onChangeText={setJudul}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Lokasi Kejadian</Text>
            <View style={styles.locationBox}>
                <Ionicons name="location" size={20} color={Colors.primary} style={{marginRight: 8}} />
                <TextInput 
                    style={[styles.input, {borderWidth:0, flex:1, marginBottom:0}]} 
                    placeholder="Nama Jalan / Patokan..." 
                    value={location} onChangeText={setLocation}
                />
            </View>
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Detail Laporan</Text>
            <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                placeholder="Jelaskan kondisi kucing & kronologi..." 
                multiline value={isi} onChangeText={setIsi}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Foto Bukti (Wajib)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="camera" size={40} color="#ccc" />
                        <Text style={{ color: '#aaa', marginTop: 5 }}>Tap untuk upload foto</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>KIRIM LAPORAN 📢</Text>}
        </TouchableOpacity>
    </ScrollView>
  );

  // --- RENDERER: FEED ---
  const renderFeed = () => (
    <FlatList
        data={feedData}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={{ padding: 15 }}
        refreshControl={<RefreshControl refreshing={loadingFeed} onRefresh={fetchAllReports} />}
        ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="newspaper-outline" size={50} color="#ccc" />
                <Text style={{ color: '#888', marginTop: 10 }}>Belum ada laporan masuk.</Text>
            </View>
        }
        renderItem={({ item }: { item: any }) => {
            let statusColor = '#ef6c00'; 
            let statusBg = '#fff3e0';
            let statusText = 'DITINJAU';

            if (item.status === 'PROCESSED') {
                statusColor = '#1976d2'; statusBg = '#e3f2fd'; statusText = 'DIPROSES 🛠️';
            } else if (item.status === 'DONE') {
                statusColor = '#2e7d32'; statusBg = '#e8f5e9'; statusText = 'SELESAI ✅';
            } else if (item.status === 'REJECTED') {
                statusColor = '#c62828'; statusBg = '#ffebee'; statusText = 'DITOLAK ❌';
            }

            return (
                <View style={styles.feedCard}>
                    <View style={styles.feedHeader}>
                         <View style={{flexDirection:'row', alignItems:'center'}}>
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{marginLeft: 8}}>
                                <Text style={styles.feedUsername}>@{item.username}</Text>
                                <Text style={styles.feedDate}>
                                    {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                         </View>
                         <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                             <Text style={{ color: statusColor, fontSize: 10, fontWeight: 'bold' }}>{statusText}</Text>
                         </View>
                    </View>
                    <View style={styles.feedBody}>
                        <Text style={styles.feedTitle}>{item.judul}</Text>
                        <Text style={styles.feedLoc}>📍 {item.location}</Text>
                        <Text style={styles.feedDesc}>{item.isi}</Text>
                        <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} style={styles.feedImg} />
                    </View>
                    {item.response && item.response !== '-' && (
                        <View style={styles.adminResponseBox}>
                            <View style={{flexDirection:'row', alignItems:'center', marginBottom: 4}}>
                                <Ionicons name="shield-checkmark" size={14} color={Colors.primary} style={{marginRight:4}} />
                                <Text style={styles.adminLabel}>Tanggapan Admin</Text>
                            </View>
                            <Text style={styles.adminText}>{item.response}</Text>
                        </View>
                    )}
                </View>
            );
        }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layanan Lapor 🚨</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'form' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('form')}
        >
            <Text style={[styles.tabText, activeTab === 'form' && styles.tabTextActive]}>Buat Laporan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'feed' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('feed')}
        >
            <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Laporan Warga</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
         {activeTab === 'form' ? renderForm() : renderFeed()}
      </View>

      {/* --- CUSTOM MODAL ALERT (PENGGANTI ALERT BAWAAN) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={closeAlert}
      >
        <View style={styles.alertOverlay}>
            <View style={styles.alertContent}>
                {/* ICON */}
                <View style={[
                    styles.alertIconCircle, 
                    { backgroundColor: 
                        alertConfig.type === 'success' ? '#e8f5e9' : 
                        alertConfig.type === 'error' ? '#ffebee' : '#fff3e0' 
                    }
                ]}>
                    <Ionicons 
                        name={
                            alertConfig.type === 'success' ? "checkmark-circle" : 
                            alertConfig.type === 'error' ? "close-circle" : "alert-circle"
                        } 
                        size={45} 
                        color={
                            alertConfig.type === 'success' ? '#2e7d32' : 
                            alertConfig.type === 'error' ? '#c62828' : '#ef6c00'
                        } 
                    />
                </View>

                {/* TEXT */}
                <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                <Text style={styles.alertMessage}>{alertConfig.message}</Text>

                {/* BUTTON */}
                <TouchableOpacity 
                    style={[
                        styles.alertBtnConfirm, 
                        { backgroundColor: alertConfig.type === 'error' ? '#c62828' : Colors.primary }
                    ]} 
                    onPress={closeAlert}
                >
                    <Text style={styles.alertTextConfirm}>{alertConfig.btnText}</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: Colors.primary },
  
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { color: '#888', fontWeight: 'bold' },
  tabTextActive: { color: Colors.primary },

  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  locationBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff' },
  imagePicker: { height: 150, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  previewImage: { width: '100%', height: '100%', borderRadius: 8 },
  btnSubmit: { backgroundColor: Colors.danger, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: Colors.danger, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  feedCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  feedUsername: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  feedDate: { fontSize: 11, color: '#888' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  feedBody: { marginTop: 5 },
  feedTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  feedLoc: { fontSize: 12, color: '#666', marginBottom: 8 },
  feedDesc: { fontSize: 14, color: '#444', marginBottom: 10, lineHeight: 20 },
  feedImg: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#eee' },
  
  adminResponseBox: { marginTop: 12, backgroundColor: '#f0f4f8', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  adminLabel: { fontSize: 11, fontWeight: 'bold', color: Colors.primary },
  adminText: { fontSize: 12, color: '#444' },

  // --- CUSTOM ALERT STYLES ---
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertContent: { backgroundColor: '#fff', width: '85%', maxWidth: 350, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 },
  alertIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  alertBtnConfirm: { width: '100%', paddingVertical: 12, borderRadius: 10, alignItems: 'center', elevation: 2 },
  alertTextConfirm: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});