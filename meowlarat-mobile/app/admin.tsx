import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, SafeAreaView, RefreshControl, TextInput, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.18.12:3000'; 

// --- INTERFACES ---
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

interface LaporanUser {
  id: number;
  username: string;
  judul: string;
  isi: string;
  location: string;
  img_url: string;
  status: string;
  response: string;
  date: string;
}

type AdminView = 'MENU_UTAMA' | 'PILIH_KUCING' | 'LIST_KANDIDAT' | 'LIST_LAPORAN';
type AlertType = 'success' | 'error' | 'confirm' | 'warning';

export default function AdminScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [laporan, setLaporan] = useState<LaporanUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>('MENU_UTAMA');
  const [selectedCatName, setSelectedCatName] = useState<string>('');
  
  // State untuk menyimpan teks balasan admin per laporan
  const [adminResponse, setAdminResponse] = useState<Record<number, string>>({});

  // --- STATE CUSTOM ALERT ---
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
    loadAllData();
  }, []);

  const loadAllData = () => {
    fetchRequests();
    fetchLaporan();
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cats/requests`);
      const data = await response.json();
      setRequests(data.filter((r: AdoptionRequest) => r.status === 'PENDING'));
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lapor/all`);
      const data = await response.json();
      // Filter: Tampilkan yang PENDING atau DIPROSES (SELESAI disembunyikan)
      setLaporan(data.filter((l: LaporanUser) => l.status !== 'SELESAI'));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const showAlert = (type: AlertType, title: string, message: string, onConfirm: () => void, confirmText = 'Ya', cancelText = 'Batal') => {
    setAlertConfig({ type, title, message, onConfirm, confirmText, cancelText });
    setAlertVisible(true);
  };

  const closeAlert = () => setAlertVisible(false);

  // --- LOGIC ADOPSI ---
  const catsWithRequests = useMemo(() => {
    const grouped: Record<string, AdoptionRequest[]> = {};
    requests.forEach((req) => {
      if (!grouped[req.cat.nama]) grouped[req.cat.nama] = [];
      grouped[req.cat.nama].push(req);
    });
    return Object.keys(grouped).map(catName => ({
      catName,
      catDetails: grouped[catName][0].cat,
      totalRequests: grouped[catName].length
    }));
  }, [requests]);

  const candidateList = useMemo(() => {
    return requests.filter(req => req.cat.nama === selectedCatName);
  }, [requests, selectedCatName]);

  const handleApprove = (reqId: number, userName: string, catName: string) => {
    showAlert('success', 'Konfirmasi Pemenang 🏆', `Jadikan ${userName} pemilik baru ${catName}?`, async () => {
      closeAlert();
      try {
        const res = await fetch(`${API_URL}/api/cats/requests/approve/${reqId}`, { method: 'PUT' });
        if (res.ok) fetchRequests();
      } catch (e) { console.error(e); }
    }, 'SETUJU');
  };

  const handleReject = (reqId: number) => {
    showAlert('error', 'Tolak?', 'Yakin menolak pelamar ini?', async () => {
      closeAlert();
      try {
        const res = await fetch(`${API_URL}/api/cats/requests/reject/${reqId}`, { method: 'PUT' });
        if (res.ok) fetchRequests();
      } catch (e) { console.error(e); }
    });
  };

  // --- LOGIC LAPORAN (DENGAN TAHAP PROSES) ---
  const handleUpdateStatusLaporan = (id: number, nextStatus: string) => {
    const responTxt = adminResponse[id] || "Sedang dalam tindak lanjut admin.";
    const title = nextStatus === 'DIPROSES' ? 'Proses Laporan?' : 'Selesaikan Laporan?';
    const msg = nextStatus === 'DIPROSES' ? 'Status akan berubah menjadi DIPROSES.' : 'Laporan akan ditandai SELESAI dan diarsipkan.';

    showAlert('confirm', title, msg, async () => {
      closeAlert();
      try {
        const res = await fetch(`${API_URL}/api/lapor/status/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, response: responTxt })
        });
        if (res.ok) {
           // Jika selesai, hapus dari state input agar bersih
           if (nextStatus === 'SELESAI') {
              setAdminResponse(prev => { const n = {...prev}; delete n[id]; return n; });
           }
           fetchLaporan();
        }
      } catch (e) { console.error(e); }
    });
  };

  // --- RENDERERS ---
  const renderMainMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Halo Admin! 👋</Text>
      <Text style={styles.menuSubtitle}>Kelola sistem MeowLarat:</Text>
      
      <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentView('PILIH_KUCING')}>
        <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}><Ionicons name="paw" size={30} color={Colors.primary} /></View>
        <Text style={styles.menuCardTitle}>Proses Adopsi</Text>
        <Text style={styles.menuCardDesc}>{requests.length} Permintaan baru</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuCard, { marginTop: 15 }]} onPress={() => { fetchLaporan(); setCurrentView('LIST_LAPORAN'); }}>
        <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}><Ionicons name="document-text" size={30} color="#ef6c00" /></View>
        <Text style={styles.menuCardTitle}>Laporan User</Text>
        <Text style={styles.menuCardDesc}>{laporan.length} Laporan aktif</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLaporanList = () => (
    <View style={{ flex: 1, padding: 15 }}>
      <Text style={styles.sectionHeader}>Daftar Laporan (Belum Selesai):</Text>
      <FlatList
        data={laporan}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLaporan} />}
        renderItem={({ item }) => (
          <View style={styles.compactCard}>
            <View style={styles.compactHeaderRow}>
               <Text style={styles.compactName}>{item.judul}</Text>
               <View style={[styles.statusBadge, { backgroundColor: item.status === 'DIPROSES' ? '#e3f2fd' : '#fff3e0' }]}>
                  <Text style={{ fontSize: 10, color: item.status === 'DIPROSES' ? '#1976d2' : '#ef6c00', fontWeight: 'bold' }}>{item.status}</Text>
               </View>
            </View>
            
            <Image source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} style={styles.reportImg} />
            <Text style={styles.compactMsg}>"{item.isi}"</Text>
            <Text style={{ fontSize: 11, color: '#888' }}>📍 {item.location}</Text>
            
            <TextInput 
              style={styles.inputRespon} 
              placeholder="Tulis balasan/tindakan admin..." 
              value={adminResponse[item.id] || ""}
              onChangeText={txt => setAdminResponse(p => ({...p, [item.id]: txt}))}
            />

            <View style={styles.compactActionRow}>
              {item.status === 'PENDING' && (
                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: '#1976d2' }]} 
                  onPress={() => handleUpdateStatusLaporan(item.id, 'DIPROSES')}
                >
                  <Text style={styles.btnTextWhite}>Proses</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.btnAction, { backgroundColor: '#28a745' }]} 
                onPress={() => handleUpdateStatusLaporan(item.id, 'SELESAI')}
              >
                <Text style={styles.btnTextWhite}>Selesaikan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );

  // --- RENDER LIST KUCING & KANDIDAT ---
  const renderCatSelection = () => (
    <View style={{ flex: 1, padding: 15 }}>
      <FlatList data={catsWithRequests} keyExtractor={i=>i.catName} numColumns={2} renderItem={({item})=>(
        <TouchableOpacity style={styles.catCardSelect} onPress={()=>{setSelectedCatName(item.catName); setCurrentView('LIST_KANDIDAT');}}>
          <Image source={{uri:`${API_URL}/uploads/img-lapor/${item.catDetails.img_url}`}} style={styles.catCardImage}/>
          <View style={styles.catCardInfo}><Text style={styles.catCardName}>{item.catName}</Text><Text style={styles.catCardCount}>{item.totalRequests} Pelamar</Text></View>
        </TouchableOpacity>
      )}/>
    </View>
  );

  const renderCandidateList = () => (
    <View style={{ flex: 1, padding: 15 }}>
      <FlatList data={candidateList} keyExtractor={i=>i.id.toString()} renderItem={({item})=>(
        <View style={styles.compactCard}>
          <Text style={styles.compactName}>{item.user.nama}</Text>
          <Text style={styles.compactMsg}>"{item.message}"</Text>
          <View style={styles.compactActionRow}>
            <TouchableOpacity style={styles.btnCompactReject} onPress={()=>handleReject(item.id)}><Text style={styles.btnTextCompactReject}>Tolak</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnCompactApprove} onPress={()=>handleApprove(item.id, item.user.nama, item.cat.nama)}><Text style={styles.btnTextCompactWhite}>Terima</Text></TouchableOpacity>
          </View>
        </View>
      )}/>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (currentView === 'LIST_KANDIDAT') setCurrentView('PILIH_KUCING');
          else if (currentView !== 'MENU_UTAMA') setCurrentView('MENU_UTAMA');
          else router.back();
        }}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {currentView === 'MENU_UTAMA' && renderMainMenu()}
      {currentView === 'PILIH_KUCING' && renderCatSelection()}
      {currentView === 'LIST_KANDIDAT' && renderCandidateList()}
      {currentView === 'LIST_LAPORAN' && renderLaporanList()}

      <Modal animationType="fade" transparent visible={alertVisible} onRequestClose={closeAlert}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <View style={styles.alertBtnRow}>
              <TouchableOpacity style={styles.alertBtnCancel} onPress={closeAlert}><Text>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtnConfirm, { backgroundColor: Colors.primary }]} onPress={alertConfig.onConfirm}><Text style={{ color: '#fff' }}>Ya</Text></TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  menuContainer: { flex: 1, padding: 20 },
  menuTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  menuSubtitle: { color: '#666', marginBottom: 20 },
  menuCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  menuCardTitle: { fontSize: 18, fontWeight: 'bold' },
  menuCardDesc: { color: '#888' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  catCardSelect: { backgroundColor: '#fff', width: '47%', margin: '1.5%', borderRadius: 10, elevation: 2 },
  catCardImage: { width: '100%', height: 100, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  catCardInfo: { padding: 10 },
  catCardName: { fontWeight: 'bold', color: Colors.primary },
  catCardCount: { fontSize: 12, color: '#666' },
  compactCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  compactHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  compactName: { fontWeight: 'bold', fontSize: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  reportImg: { width: '100%', height: 150, borderRadius: 8, marginVertical: 10 },
  compactMsg: { fontStyle: 'italic', marginBottom: 5, color: '#444' },
  inputRespon: { backgroundColor: '#f0f0f0', borderRadius: 5, padding: 10, marginTop: 10, fontSize: 13 },
  compactActionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btnAction: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnCompactReject: { flex: 1, padding: 10, borderRadius: 5, borderWidth: 1, borderColor: 'red', alignItems: 'center' },
  btnCompactApprove: { flex: 1, padding: 10, borderRadius: 5, backgroundColor: '#28a745', alignItems: 'center' },
  btnTextWhite: { color: '#fff', fontWeight: 'bold' },
  btnTextCompactWhite: { color: '#fff', fontWeight: 'bold' },
  btnTextCompactReject: { color: 'red', fontWeight: 'bold' },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertContent: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 15, alignItems: 'center' },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  alertMessage: { textAlign: 'center', color: '#666', marginBottom: 20 },
  alertBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  alertBtnCancel: { flex: 1, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  alertBtnConfirm: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 }
});