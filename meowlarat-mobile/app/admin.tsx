import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, SafeAreaView, RefreshControl, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.100.15:3000'; 

interface AdoptionRequest {
  id: number;
  status: string;
  message: string;
  date: string;
  cat: {
    id: number;
    nama: string;
    img_url: string;
    ras: string;
    age: string | number;
    isAdopted: boolean;
  };
  user: {
    nama: string;
    username: string;
    pekerjaan: string;
    gaji: number;
    luas_rumah: string;
    punya_halaman: boolean;
    jumlah_kucing: number;
  };
}

type AdminView = 'MENU_UTAMA' | 'PILIH_KUCING' | 'LIST_KANDIDAT';
type AlertType = 'success' | 'error' | 'confirm' | 'warning';

export default function AdminScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>('MENU_UTAMA');
  const [selectedCatName, setSelectedCatName] = useState<string>('');

  // --- STATE CUSTOM ALERT (SUPAYA TIDAK AMPAS) ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'confirm' as AlertType,
    title: '',
    message: '',
    confirmText: 'Ya',
    cancelText: 'Batal',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cats/requests`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER CUSTOM ALERT ---
  const showAlert = (
    type: AlertType, 
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmText = 'Ya',
    cancelText = 'Batal'
  ) => {
    setAlertConfig({ type, title, message, onConfirm, confirmText, cancelText });
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  const catsWithRequests = useMemo(() => {
    const grouped: Record<string, AdoptionRequest[]> = {};
    requests.forEach((req) => {
      if (!grouped[req.cat.nama]) grouped[req.cat.nama] = [];
      grouped[req.cat.nama].push(req);
    });
    return Object.keys(grouped).map(catName => ({
      catName,
      catDetails: grouped[catName][0].cat,
      totalRequests: grouped[catName].length,
      pendingCount: grouped[catName].filter(r => r.status === 'PENDING').length
    }));
  }, [requests]);

  const candidateList = useMemo(() => {
    if (!selectedCatName) return [];
    return requests.filter(req => req.cat.nama === selectedCatName);
  }, [requests, selectedCatName]);

  const selectedCatDetails = useMemo(() => {
    if (!candidateList.length) return null;
    return candidateList[0].cat;
  }, [candidateList]);

  // --- ACTION HANDLERS ---

  const handleApprove = (reqId: number, userName: string, catName: string) => {
    showAlert(
      'success', // Pakai Style Hijau/Sukses
      'Konfirmasi Pemenang 🏆',
      `Yakin memilih ${userName} sebagai pemilik baru ${catName}? \n(Pelamar lain otomatis ditolak)`,
      async () => {
        closeAlert();
        try {
          const res = await fetch(`${API_URL}/api/cats/requests/approve/${reqId}`, { method: 'PUT' });
          if (res.ok) {
            // Tampilkan notif sukses kecil tanpa tombol cancel
            setTimeout(() => {
                showAlert('success', 'Berhasil!', 'Adopsi telah disahkan.', () => {
                    closeAlert();
                    fetchRequests();
                }, 'Mantap');
            }, 300);
          }
        } catch (e) { console.error(e); }
      },
      'SAH-KAN!'
    );
  };

  const handleReject = (reqId: number) => {
    showAlert(
      'error', // Pakai Style Merah/Bahaya
      'Tolak Pelamar?',
      'Apakah kamu yakin ingin menolak permohonan ini? User bisa mengajukan lagi nanti.',
      async () => {
        closeAlert();
        try {
          const res = await fetch(`${API_URL}/api/cats/requests/reject/${reqId}`, { method: 'PUT' });
          if (res.ok) fetchRequests();
        } catch (e) { console.error(e); }
      },
      'Tolak Aja',
      'Jangan Dulu'
    );
  };

  // --- RENDERER: MENU UTAMA ---
  const renderMainMenu = () => (
    <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Halo Admin! 👋</Text>
        <Text style={styles.menuSubtitle}>Apa yang ingin kamu kerjakan hari ini?</Text>
        <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentView('PILIH_KUCING')}>
                <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                    <Ionicons name="paw" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.menuCardTitle}>Proses Adopsi</Text>
                <Text style={styles.menuCardDesc}>Seleksi pelamar & tentukan pemilik baru.</Text>
                {requests.filter(r => r.status === 'PENDING').length > 0 && (
                    <View style={styles.notifBadge}>
                        <Text style={styles.notifText}>{requests.filter(r => r.status === 'PENDING').length} Baru</Text>
                    </View>
                )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuCard, { opacity: 0.6 }]} onPress={() => showAlert('warning', 'Coming Soon', 'Fitur Laporan User sedang dalam pengembangan.', () => closeAlert(), 'Oke')}>
                <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                    <Ionicons name="document-text" size={32} color="#ef6c00" />
                </View>
                <Text style={styles.menuCardTitle}>Laporan User</Text>
                <Text style={styles.menuCardDesc}>Cek laporan pertanggungjawaban adopter.</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  // --- RENDERER: PILIH KUCING ---
  const renderCatSelection = () => (
    <View style={{ flex: 1, padding: 15 }}>
        <Text style={styles.sectionHeader}>Pilih Kucing yang Dilamar:</Text>
        <FlatList
            data={catsWithRequests}
            keyExtractor={(item) => item.catName}
            numColumns={2}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} />}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
                <TouchableOpacity 
                    style={styles.catCardSelect}
                    onPress={() => {
                        setSelectedCatName(item.catName);
                        setCurrentView('LIST_KANDIDAT');
                    }}
                >
                    <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.catDetails.img_url}` }} style={styles.catCardImage} />
                    <View style={styles.catCardInfo}>
                        <Text style={styles.catCardName}>{item.catName}</Text>
                        <Text style={styles.catCardCount}>{item.totalRequests} Pelamar</Text>
                        {item.pendingCount > 0 && (
                            <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                                {item.pendingCount} Perlu Review
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                    <Ionicons name="file-tray-outline" size={50} color="#ccc" />
                    <Text style={{ color: '#888', marginTop: 10 }}>Belum ada request masuk.</Text>
                </View>
            }
        />
    </View>
  );

  // --- RENDERER: LIST KANDIDAT ---
  const renderCandidateList = () => (
    <View style={{ flex: 1 }}>
         {selectedCatDetails && (
            <View style={styles.catStickyHeader}>
                <Image source={{ uri: `${API_URL}/uploads/img-lapor/${selectedCatDetails.img_url}` }} style={styles.headerCatImg} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerCatName}>{selectedCatDetails.nama}</Text>
                    <Text style={styles.headerCatSub}>{selectedCatDetails.ras}</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentView('PILIH_KUCING')} style={styles.btnChangeCat}>
                    <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: 'bold' }}>Ganti</Text>
                </TouchableOpacity>
            </View>
         )}

         <FlatList
            data={candidateList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 12, paddingBottom: 50 }}
            renderItem={({ item }) => (
                <View style={styles.compactCard}>
                    
                    {/* Header Row */}
                    <View style={styles.compactHeaderRow}>
                        <View style={styles.rowLeft}>
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarTextSmall}>{item.user.nama.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View>
                                <Text style={styles.compactName}>{item.user.nama}</Text>
                                <Text style={styles.compactJob}>{item.user.pekerjaan}</Text>
                            </View>
                        </View>
                        <View style={[
                            styles.statusBadgeCompact, 
                            { backgroundColor: item.status === 'APPROVED' ? '#e8f5e9' : item.status === 'REJECTED' ? '#ffebee' : '#fff3e0' }
                        ]}>
                            <Text style={{ 
                                fontSize: 10, fontWeight: 'bold',
                                color: item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'red' : 'orange'
                            }}>
                                {item.status}
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.compactStatsRow}>
                        <Text style={styles.compactStatItem}>💰 {item.user.gaji?.toLocaleString('id-ID')}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.compactStatItem}>🏠 {item.user.luas_rumah}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.compactStatItem}>🐈 {item.user.jumlah_kucing || 0}</Text>
                        <Text style={styles.separator}>•</Text>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                           <Text style={[styles.compactStatItem, {marginRight: 2}]}>Halaman</Text>
                           <Ionicons 
                                name={item.user.punya_halaman ? "checkmark-circle" : "close-circle"} 
                                size={14} 
                                color={item.user.punya_halaman ? "green" : "red"} 
                            />
                        </View>
                    </View>

                    {/* Msg Row */}
                    {item.message ? (
                        <Text style={styles.compactMsg} numberOfLines={2}>"{item.message}"</Text>
                    ) : null}

                    {/* Action Row */}
                    {item.status === 'PENDING' && (
                        <View style={styles.compactActionRow}>
                            <TouchableOpacity style={styles.btnCompactReject} onPress={() => handleReject(item.id)}>
                                <Text style={styles.btnTextCompactReject}>Tolak</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnCompactApprove} onPress={() => handleApprove(item.id, item.user.nama, item.cat.nama)}>
                                <Text style={styles.btnTextCompactWhite}>Terima</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Tidak ada data.</Text>}
         />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => {
                if (currentView === 'LIST_KANDIDAT') setCurrentView('PILIH_KUCING');
                else if (currentView === 'PILIH_KUCING') setCurrentView('MENU_UTAMA');
                else router.back();
            }}
        >
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
            {currentView === 'MENU_UTAMA' ? 'Admin Dashboard' : 
             currentView === 'PILIH_KUCING' ? 'Pilih Kucing' : 
             'Seleksi Kandidat'}
        </Text>
      </View>

      {currentView === 'MENU_UTAMA' && renderMainMenu()}
      {currentView === 'PILIH_KUCING' && renderCatSelection()}
      {currentView === 'LIST_KANDIDAT' && renderCandidateList()}

      {/* --- CUSTOM MODAL ALERT (PENGGANTI ALERT BAWAAN YANG AMPAS) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={closeAlert}
      >
        <View style={styles.alertOverlay}>
            <View style={styles.alertContent}>
                {/* ICON BAGIAN ATAS */}
                <View style={[
                    styles.alertIconCircle, 
                    { backgroundColor: 
                        alertConfig.type === 'success' ? '#e8f5e9' : 
                        alertConfig.type === 'error' ? '#ffebee' : 
                        alertConfig.type === 'warning' ? '#fff3e0' : '#e3f2fd' 
                    }
                ]}>
                    <Ionicons 
                        name={
                            alertConfig.type === 'success' ? "checkmark-circle" : 
                            alertConfig.type === 'error' ? "close-circle" : 
                            alertConfig.type === 'warning' ? "alert-circle" : "help-circle"
                        } 
                        size={45} 
                        color={
                            alertConfig.type === 'success' ? '#2e7d32' : 
                            alertConfig.type === 'error' ? '#c62828' : 
                            alertConfig.type === 'warning' ? '#ef6c00' : Colors.primary
                        } 
                    />
                </View>

                {/* TEXT CONTENT */}
                <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                <Text style={styles.alertMessage}>{alertConfig.message}</Text>

                {/* BUTTONS */}
                <View style={styles.alertBtnRow}>
                    {/* Tombol Cancel hanya muncul jika bukan notif sukses biasa */}
                    {(alertConfig.type === 'confirm' || alertConfig.type === 'error') && (
                         <TouchableOpacity style={styles.alertBtnCancel} onPress={closeAlert}>
                             <Text style={styles.alertTextCancel}>{alertConfig.cancelText}</Text>
                         </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={[
                            styles.alertBtnConfirm, 
                            { backgroundColor: alertConfig.type === 'error' ? '#c62828' : Colors.primary }
                        ]} 
                        onPress={alertConfig.onConfirm}
                    >
                        <Text style={styles.alertTextConfirm}>{alertConfig.confirmText}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, marginTop: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#333' },

  // MENU UTAMA
  menuContainer: { flex: 1, padding: 20 },
  menuTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 5 },
  menuSubtitle: { fontSize: 14, color: '#666', marginBottom: 25 },
  menuGrid: { gap: 15 },
  menuCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 3, alignItems: 'flex-start' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  menuCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  menuCardDesc: { fontSize: 13, color: '#666' },
  notifBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: '#ef6c00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  notifText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // PILIH KUCING
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 15 },
  catCardSelect: { backgroundColor: '#fff', width: '48%', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden' },
  catCardImage: { width: '100%', height: 120 },
  catCardInfo: { padding: 10 },
  catCardName: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  catCardCount: { fontSize: 12, color: '#666', marginTop: 2 },

  // LIST KANDIDAT HEADER
  catStickyHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, paddingHorizontal: 15, elevation: 2, marginBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  headerCatImg: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerCatName: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  headerCatSub: { fontSize: 12, color: '#666' },
  btnChangeCat: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary, borderRadius: 15 },

  // COMPACT CARD
  compactCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#eee' },
  compactHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarTextSmall: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  compactName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  compactJob: { fontSize: 11, color: '#888' },
  statusBadgeCompact: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 5 },
  compactStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, marginBottom: 8 },
  compactStatItem: { fontSize: 11, fontWeight: 'bold', color: '#555' },
  separator: { fontSize: 10, color: '#ccc', marginHorizontal: 6 },
  compactMsg: { fontSize: 11, fontStyle: 'italic', color: '#666', marginBottom: 10 },
  compactActionRow: { flexDirection: 'row', gap: 8 },
  btnCompactReject: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: Colors.danger, alignItems: 'center' },
  btnCompactApprove: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#28a745', alignItems: 'center' },
  btnTextCompactReject: { color: Colors.danger, fontWeight: 'bold', fontSize: 12 },
  btnTextCompactWhite: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // --- STYLE ALERT MODAL (PREMIUM) ---
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertContent: { backgroundColor: '#fff', width: '85%', maxWidth: 350, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 },
  alertIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  alertBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', backgroundColor: '#fff' },
  alertBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', elevation: 2 },
  alertTextCancel: { color: '#666', fontWeight: 'bold', fontSize: 14 },
  alertTextConfirm: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});