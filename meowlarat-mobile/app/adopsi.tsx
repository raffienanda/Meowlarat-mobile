import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, TouchableOpacity, 
  Modal, ActivityIndicator, SafeAreaView, RefreshControl, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import { Colors } from '../constants/Colors';
import { cat } from '../types';
import { API_URL } from '../constants/Config'; 

export default function AdopsiScreen() {
  const router = useRouter();
  
  // State Data
  const [cats, setCats] = useState<cat[]>([]); 
  const [myAdoptions, setMyAdoptions] = useState<cat[]>([]); 
  const [historyCats, setHistoryCats] = useState<cat[]>([]); 
  
  // State UI
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'status' | 'history'>('available');
  const [modalVisible, setModalVisible] = useState(false); // Modal Detail Kucing
  const [selectedCat, setSelectedCat] = useState<cat | null>(null);

  // --- MODAL KHUSUS ---
  const [validationModalVisible, setValidationModalVisible] = useState(false); // Kuning (Profil)

  // --- STATE ALERT CUSTOM (PENGGANTI ALERT BAWAAN) ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info', // 'success' | 'error' | 'info' | 'confirm'
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Oke',
    showCancel: false,
    cancelText: 'Batal'
  });
  
  // State User
  const [userSession, setUserSession] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      checkSession();
    }, [])
  );

  useEffect(() => {
    if (activeTab === 'available') {
      fetchCats();
    } else if (activeTab === 'status') {
      fetchMyAdoptions();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, userSession]);

  const checkSession = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_session');
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        setUserSession(parsed.user || parsed);
      } else {
        setUserSession(null);
      }
    } catch(e) { console.error("Gagal baca sesi"); }
  };

  // --- HELPER UNTUK MEMUNCULKAN CUSTOM ALERT ---
  const showAlert = (
    type: 'success' | 'error' | 'info' | 'confirm', 
    title: string, 
    message: string, 
    onConfirm?: () => void,
    confirmText: string = 'Oke'
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm: onConfirm || (() => setAlertConfig(prev => ({...prev, visible: false}))),
      confirmText,
      showCancel: type === 'confirm', // Cuma tipe confirm yang ada tombol Batal
      cancelText: 'Batal'
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const fetchCats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cats`);
      const data = await response.json();
      setCats(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchMyAdoptions = async () => {
    if (!userSession) return; 
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cats/pending/${userSession.username}`);
      const data = await response.json();
      setMyAdoptions(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    if (!userSession) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cats/history/${userSession.username}`);
      const data = await response.json();
      setHistoryCats(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleAdopt = async () => {
    if (!selectedCat) return;
    if (!userSession) return showAlert('info', 'Login Diperlukan', 'Silakan login terlebih dahulu untuk mengadopsi.');

    try {
        const response = await fetch(`${API_URL}/api/cats/adopt/${selectedCat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: userSession.username,
              message: "Saya berminat adopsi" 
            }), 
        });

        const result = await response.json();

        if (response.ok) {
            setModalVisible(false); // Tutup detail kucing
            // Tampilkan Alert Sukses (Biru)
            showAlert('success', 'Berhasil Dikirim! 🚀', 'Permintaan adopsi kamu sudah masuk antrian. Cek statusnya berkala ya.', () => {
                setAlertConfig(prev => ({...prev, visible: false}));
                setActiveTab('status'); 
            }, 'Siap!');
        } 
        else {
            if (result.code === 'PROFILE_INCOMPLETE') {
                setModalVisible(false);
                setValidationModalVisible(true); // Buka modal kuning profil (Spesial Case)
            } 
            else {
                // Tampilkan Alert Error (Merah)
                showAlert('error', 'Gagal Mengajukan', result.message || "Terjadi kesalahan.");
            }
        }
    } catch (error) { 
        console.error(error);
        showAlert('error', 'Koneksi Gagal', 'Gagal menghubungi server.'); 
    }
  };

  const handleTakeCat = async (catId: number, catName: string) => {
    // Tampilkan Alert Confirm (Biru dengan Cancel)
    showAlert('confirm', 'Jemput Kucing?', `Kamu sudah siap membawa pulang ${catName}? Pastikan kamu sudah di lokasi ya.`, 
        () => executeTakeCat(catId, catName), 
        'Ya, Saya Siap!'
    );
  };

  const executeTakeCat = async (catId: number, catName: string) => {
    closeAlert(); // Tutup confirm sebelumnya
    try {
      const response = await fetch(`${API_URL}/api/cats/take/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (response.ok) {
         showAlert('success', 'Selamat! 🎉', `${catName} resmi jadi milikmu!`, () => {
             setAlertConfig(prev => ({...prev, visible: false}));
             setActiveTab('history');
         });
      } else {
         showAlert('error', 'Gagal', 'Gagal memproses data.');
      }
    } catch(e) { showAlert('error', 'Error', 'Gagal koneksi server.'); }
  };

  // --- RENDER ITEMS ---
  const renderAvailableItem = ({ item }: { item: cat }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedCat(item); setModalVisible(true); }}>
      <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle}>{item.nama}</Text>
        <Text style={{color:'#fff', fontSize:10}}>{item.ras}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStatusItem = ({ item }: { item: cat }) => {
    const isApproved = item.adoptdate !== null; 
    return (
      <View style={styles.statusCard}>
        <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} style={styles.statusImage} />
        <View style={styles.statusContent}>
           <Text style={styles.statusName}>{item.nama}</Text>
           <Text style={styles.statusDetail}>{item.ras} • {item.gender}</Text>
           <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#e8f5e9' : '#fff3e0' }]}>
              <Text style={{ color: isApproved ? '#2e7d32' : '#ef6c00', fontWeight: 'bold', fontSize: 12 }}>
                 {isApproved ? 'DISETUJUI ✅' : 'MENUNGGU VERIFIKASI ⏳'}
              </Text>
           </View>
           {isApproved ? (
             <TouchableOpacity style={styles.btnTake} onPress={() => handleTakeCat(item.id, item.nama)}>
                <Text style={styles.btnTakeText}>Konfirmasi Penjemputan</Text>
             </TouchableOpacity>
           ) : (
             <Text style={styles.waitText}>Mohon tunggu admin memverifikasi.</Text>
           )}
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: cat }) => (
    <View style={styles.historyCard}>
      <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} style={styles.historyImage} />
      <View style={styles.historyContent}>
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <Text style={styles.historyName}>{item.nama}</Text>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        </View>
        <Text style={styles.historyDetail}>{item.ras} • {item.gender}</Text>
        <Text style={styles.historyDate}>
            Diadopsi: {item.adoptdate ? new Date(item.adoptdate).toLocaleDateString('id-ID') : '-'}
        </Text>
        <View style={styles.adoptedBadge}>
            <Text style={styles.adoptedText}>Sudah kamu ambil ✅</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.btnReport} 
          onPress={() => router.push({
            pathname: '/tanggungjawab',
            params: { 
              catId: item.id, 
              catName: item.nama,
              adoptDate: item.adoptdate 
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
        <Text style={styles.headerTitle}>Adopsi Kucing 🐾</Text>
        <Text style={styles.headerSubtitle}>Temukan teman hidup barumu</Text>
      </View>

      <View style={styles.tabContainer}>
        {['available', 'status', 'history'].map(tab => (
          <TouchableOpacity 
             key={tab}
             style={[styles.tabButton, activeTab === tab && styles.tabActive]} 
             onPress={() => {
                if (tab !== 'available' && !userSession) showAlert('info', 'Login Dulu', 'Silakan login untuk mengakses fitur ini.');
                else setActiveTab(tab as any);
             }}
          >
             <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'available' ? 'Tersedia' : tab === 'status' ? 'Status' : 'Riwayat'}
             </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flex: 1}}>
        {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
            <FlatList
              key={activeTab}
              data={activeTab === 'available' ? cats : activeTab === 'status' ? myAdoptions : historyCats}
              renderItem={activeTab === 'available' ? renderAvailableItem : activeTab === 'status' ? renderStatusItem : renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={activeTab === 'available' ? 2 : 1}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {
                  if (activeTab === 'available') fetchCats();
                  else if (activeTab === 'status') fetchMyAdoptions();
                  else fetchHistory();
              }} />}
              ListEmptyComponent={<Text style={styles.emptyText}>Data kosong.</Text>}
            />
        )}
      </View>

      {/* --- MODAL DETAIL KUCING --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCat && (
              <>
                <Image source={{ uri: `${API_URL}/uploads/img-lapor/${selectedCat.img_url}` }} style={styles.modalImage} />
                <Text style={styles.modalName}>{selectedCat.nama}</Text>
                <Text style={styles.bodyText}>Ras: {selectedCat.ras}</Text>
                <Text style={styles.bodyText}>Karakter: {selectedCat.karakteristik}</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                        <Text style={styles.btnCancelText}>Tutup</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAdopt} onPress={handleAdopt}>
                        <Text style={styles.btnAdoptText}>Ajukan</Text>
                    </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* --- MODAL ALERT CUSTOM (BIRU/MERAH SESUAI TEMA) --- */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={alertConfig.visible} 
        onRequestClose={closeAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContent}>
            {/* Ikon Dinamis */}
            <View style={[
                styles.alertIconContainer, 
                { backgroundColor: alertConfig.type === 'error' ? '#ffebee' : '#e3f2fd' }
            ]}>
               <Ionicons 
                  name={
                      alertConfig.type === 'success' ? 'checkmark-circle' : 
                      alertConfig.type === 'error' ? 'alert-circle' : 
                      alertConfig.type === 'confirm' ? 'help-circle' : 'information-circle'
                  } 
                  size={40} 
                  color={alertConfig.type === 'error' ? Colors.danger : Colors.primary} 
               />
            </View>

            <Text style={[
                styles.alertTitle, 
                { color: alertConfig.type === 'error' ? Colors.danger : Colors.primary }
            ]}>
                {alertConfig.title}
            </Text>
            
            <Text style={styles.alertMessage}>
              {alertConfig.message}
            </Text>

            <View style={styles.alertActions}>
                {alertConfig.showCancel && (
                    <TouchableOpacity style={[styles.alertBtn, styles.alertBtnCancel]} onPress={closeAlert}>
                        <Text style={styles.alertBtnTextCancel}>{alertConfig.cancelText}</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                    style={[
                        styles.alertBtn, 
                        styles.alertBtnConfirm,
                        { backgroundColor: alertConfig.type === 'error' ? Colors.danger : Colors.primary }
                    ]} 
                    onPress={alertConfig.onConfirm}
                >
                    <Text style={styles.alertBtnTextConfirm}>{alertConfig.confirmText}</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL WARNING PROFIL (KUNING TETAP DIPERTAHANKAN) --- */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={validationModalVisible} 
        onRequestClose={() => setValidationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalContent}>
            <View style={styles.warningIconContainer}>
               <Ionicons name="clipboard" size={40} color="#fff" />
            </View>
            <Text style={styles.warningTitle}>Profil Belum Lengkap!</Text>
            <Text style={styles.warningMessage}>
              Supaya bisa adopsi kucing, kami butuh data tambahan (Pekerjaan, Gaji, Info Rumah) di profil kamu.
            </Text>
            <View style={styles.warningActionButtons}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setValidationModalVisible(false)}>
                    <Text style={styles.btnSecondaryText}>Nanti Deh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => {
                      setValidationModalVisible(false);
                      router.push('/edit-profile'); 
                  }}>
                    <Text style={styles.btnPrimaryText}>Lengkapi 🚀</Text>
                </TouchableOpacity>
            </View>
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
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 10 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: Colors.primary },
    tabText: { fontSize: 14, color: '#888', fontWeight: 'bold' },
    tabTextActive: { color: Colors.primary },
    listContent: { padding: 10, paddingBottom: 50 },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
    card: { flex: 1, backgroundColor: '#fff', margin: 8, borderRadius: 16, overflow: 'hidden', elevation: 3, height: 220 },
    cardImage: { width: '100%', height: '100%' },
    cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 },
    cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    statusCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 12, elevation: 2, marginHorizontal: 5 },
    statusImage: { width: 90, height: 90, borderRadius: 10, marginRight: 12 },
    statusContent: { flex: 1, justifyContent: 'center' },
    statusName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statusDetail: { fontSize: 12, color: '#666', marginBottom: 6 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
    btnTake: { backgroundColor: Colors.primary, padding: 8, borderRadius: 6, alignItems: 'center' },
    btnTakeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    waitText: { fontSize: 11, color: '#888', fontStyle: 'italic' },
    historyCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 12, elevation: 2, marginHorizontal: 5, borderLeftWidth: 4, borderLeftColor: Colors.primary },
    historyImage: { width: 80, height: 80, borderRadius: 10, marginRight: 12 },
    historyContent: { flex: 1, justifyContent: 'center' },
    historyName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    historyDetail: { fontSize: 12, color: '#666', marginBottom: 4 },
    historyDate: { fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 6 },
    adoptedBadge: { backgroundColor: '#e3f2fd', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    adoptedText: { fontSize: 10, color: Colors.primary, fontWeight: 'bold' },
    btnReport: { marginTop: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center', alignSelf: 'flex-start' },
    btnReportText: { fontSize: 11, color: Colors.primary, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%' },
    modalImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16 },
    modalName: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 10 },
    bodyText: { fontSize: 16, marginBottom: 5, color: '#333' },
    actionButtons: { flexDirection: 'row', marginTop: 20, gap: 10 },
    btnCancel: { flex: 1, padding: 12, borderWidth: 1, borderColor: Colors.danger, borderRadius: 10, alignItems: 'center' },
    btnCancelText: { color: Colors.danger, fontWeight: 'bold' },
    btnAdopt: { flex: 2, padding: 12, backgroundColor: Colors.primary, borderRadius: 10, alignItems: 'center' },
    btnAdoptText: { color: '#fff', fontWeight: 'bold' },

    // === STYLE ALERT CUSTOM ===
    alertContent: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 350,
      alignItems: 'center',
      elevation: 5
    },
    alertIconContainer: {
      padding: 12,
      borderRadius: 50,
      marginBottom: 16
    },
    alertTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center'
    },
    alertMessage: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20
    },
    alertActions: {
      flexDirection: 'row',
      width: '100%',
      gap: 12
    },
    alertBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    alertBtnCancel: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ccc'
    },
    alertBtnConfirm: {
      // Background color set dynamic di inline style
      elevation: 2
    },
    alertBtnTextCancel: {
      color: '#666',
      fontWeight: 'bold'
    },
    alertBtnTextConfirm: {
      color: '#fff',
      fontWeight: 'bold'
    },

    // STYLE MODAL WARNING (KUNING)
    warningModalContent: {
      backgroundColor: Colors.background,
      borderRadius: 20,
      padding: 25,
      width: '90%',
      maxWidth: 400,
      alignItems: 'center',
      elevation: 10,
    },
    warningIconContainer: {
      backgroundColor: Colors.warning,
      padding: 15,
      borderRadius: 50,
      marginBottom: 15,
      elevation: 5
    },
    warningTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 10, textAlign: 'center' },
    warningMessage: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
    warningActionButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    btnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.gray, alignItems: 'center', backgroundColor: '#fff' },
    btnSecondaryText: { color: Colors.gray, fontWeight: 'bold' },
    btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', elevation: 2 },
    btnPrimaryText: { color: '#fff', fontWeight: 'bold' },
});