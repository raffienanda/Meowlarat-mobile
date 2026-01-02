import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  Image, Alert, ScrollView, ActivityIndicator, SafeAreaView, Platform, Modal 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

// Pastikan IP ini sesuai dengan IP laptop kamu (jika pakai emulator/device fisik via WiFi)
const API_URL = 'http://192.168.18.12:3000'; 

export default function TanggungJawabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Ambil params dengan aman (handle jika array)
  const catId = Array.isArray(params.catId) ? params.catId[0] : params.catId;
  const catName = params.catName;
  const adoptDate = params.adoptDate;

  const [week, setWeek] = useState(''); 
  const [currentActiveWeek, setCurrentActiveWeek] = useState(0); 
  const [daysPassed, setDaysPassed] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // State 3 Foto
  const [imgMakanan, setImgMakanan] = useState<string | null>(null);
  const [imgAktivitas, setImgAktivitas] = useState<string | null>(null);
  const [imgKotoran, setImgKotoran] = useState<string | null>(null);

  // --- LOGIKA HITUNG HARI ---
  useEffect(() => {
    if (adoptDate) {
      const start = new Date(adoptDate as string);
      const now = new Date();

      const diffTime = now.getTime() - start.getTime();
      // Math.max(1, ...) memastikan minimal hari ke-1
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 
      
      setDaysPassed(diffDays);

      let activeWeek = 0;
      if (diffDays <= 7) activeWeek = 1;
      else if (diffDays <= 14) activeWeek = 2;
      else if (diffDays <= 21) activeWeek = 3;
      else activeWeek = 4; // Lewat 21 hari = Selesai

      setCurrentActiveWeek(activeWeek);
      
      // Set dropdown otomatis ke minggu aktif jika valid (1-3)
      if (activeWeek >= 1 && activeWeek <= 3) {
        setWeek(activeWeek.toString());
      } else {
        setWeek('Selesai');
      }
    }
  }, [adoptDate]);

  // --- PILIH FOTO ---
  const pickImage = async (type: 'makanan' | 'aktivitas' | 'kotoran') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Kompres biar ringan uploadnya
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === 'makanan') setImgMakanan(uri);
      if (type === 'aktivitas') setImgAktivitas(uri);
      if (type === 'kotoran') setImgKotoran(uri);
    }
  };

  // --- SUBMIT DATA (DIPERBAIKI) ---
  const handleSubmit = async () => {
    // 1. Validasi Input
    if (currentActiveWeek > 3) {
        return Alert.alert("Selesai", "Masa pemantauan sudah selesai.");
    }
    // Pastikan week punya nilai
    if (!week || (week !== 'Selesai' && parseInt(week) !== currentActiveWeek)) {
        return Alert.alert("Salah Minggu", `Sekarang hari ke-${daysPassed} (Minggu ke-${currentActiveWeek}). Pastikan pilih minggu yang sesuai.`);
    }
    if (!imgMakanan || !imgAktivitas || !imgKotoran) {
      return Alert.alert("Data Kurang", "Wajib upload 3 foto bukti (Makanan, Aktivitas, Kotoran).");
    }

    setLoading(true);
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (!session) { 
        Alert.alert("Error", "Sesi habis, silakan login ulang."); 
        setLoading(false);
        return; 
      }

      // --- CLEANING TOKEN ---
      const parsedSession = JSON.parse(session);
      let token = parsedSession.token;

      if (!token) {
        Alert.alert("Error", "Token hilang. Silakan Login ulang.");
        return;
      }
      
      // Hapus tanda kutip jika ada (misal "ey..." jadi ey...)
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      console.log("Token Clean:", token);

      // 2. Siapkan FormData
      const formData = new FormData();
      
      // PENTING: Append text sebagai string
      formData.append('cat_id', String(catId));
      formData.append('week', String(week));

      // Fungsi helper append file
      const appendFile = (uri: string, fieldName: string) => {
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        // @ts-ignore (React Native FormData specific)
        formData.append(fieldName, { 
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), 
          name: filename || `upload-${Date.now()}.jpg`, 
          type 
        });
      };

      appendFile(imgMakanan, 'bukti_makanan');
      appendFile(imgAktivitas, 'bukti_aktivitas');
      appendFile(imgKotoran, 'bukti_kotoran');

      // 3. Kirim ke Backend
      const response = await fetch(`${API_URL}/api/tanggungjawab`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
          // JANGAN cantumkan 'Content-Type': 'multipart/form-data' secara manual!
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Berhasil", `Laporan Minggu ke-${week} diterima! Terima kasih.`);
        router.back(); 
      } else {
        console.log("Server Response:", result);
        if (result.message && result.message.includes("token")) {
           Alert.alert("Sesi Error", "Token tidak valid. Coba Logout dan Login lagi.");
        } else {
           Alert.alert("Gagal", result.message || "Gagal mengirim laporan.");
        }
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Error", "Gagal menghubungi server. Periksa koneksi internet.");
    } finally {
      setLoading(false);
    }
  };

  const isWeekDisabled = (w: number) => w !== currentActiveWeek;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Pemilik</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subHeader}>Kucing: <Text style={{fontWeight:'bold', color:Colors.primary}}>{catName}</Text></Text>

        {/* INFO BOX */}
        <View style={styles.infoBox}>
            <Ionicons name="calendar" size={20} color="#004085" />
            <Text style={styles.infoBoxText}>
                Hari ke-<Text style={{fontWeight:'bold', fontSize:14}}>{daysPassed}</Text> pasca adopsi.{'\n'}
                Status: <Text style={{fontWeight:'bold'}}>Minggu ke-{currentActiveWeek > 3 ? 'Selesai' : currentActiveWeek}</Text>
            </Text>
        </View>

        <Text style={styles.label}>Pilih Minggu</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDropdownVisible(true)}>
          <Text style={styles.dropdownText}>
             {week && week !== 'Selesai' ? `Minggu ${week}` : week === 'Selesai' ? 'Selesai' : 'Pilih...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {/* Modal Dropdown */}
        <Modal visible={dropdownVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pilih Minggu</Text>
              {['1', '2', '3'].map((item) => {
                const wNum = parseInt(item);
                const disabled = isWeekDisabled(wNum);
                let statusText = "";
                if (wNum < currentActiveWeek) statusText = "❌ Terlewat";
                else if (wNum > currentActiveWeek) statusText = "🔒 Belum Mulai";
                else statusText = "✅ Aktif";

                return (
                  <TouchableOpacity 
                    key={item} 
                    style={[styles.modalItem, disabled && styles.modalItemDisabled]} 
                    onPress={() => { 
                        if (!disabled) { setWeek(item); setDropdownVisible(false); }
                        else { Alert.alert("Terkunci", `Minggu ini ${statusText}`); }
                    }}
                  >
                    <View>
                        <Text style={[styles.modalItemText, disabled && {color:'#aaa'}]}>Minggu {item}</Text>
                        <Text style={{fontSize:10, color: disabled ? '#888' : Colors.primary}}>{statusText}</Text>
                    </View>
                    {week === item && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {currentActiveWeek > 3 ? (
            <View style={styles.finishedBox}>
                <Ionicons name="medal" size={60} color="#FFD700" />
                <Text style={styles.finishedText}>Selesai!</Text>
                <Text style={styles.finishedSub}>Terima kasih sudah merawatnya.</Text>
            </View>
        ) : (
            <>
                <Text style={styles.sectionTitle}>Upload 3 Bukti Foto</Text>
                
                {/* 1. Makanan */}
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>1. Bukti Makanan 🍗</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('makanan')}>
                    {imgMakanan ? <Image source={{ uri: imgMakanan }} style={styles.previewImage} /> : 
                    <View style={styles.placeholder}><Ionicons name="camera-outline" size={30} color="#ccc"/><Text style={styles.placeholderText}>Foto Makanan</Text></View>}
                  </TouchableOpacity>
                </View>

                {/* 2. Aktivitas */}
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>2. Bukti Aktivitas 🧶</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('aktivitas')}>
                    {imgAktivitas ? <Image source={{ uri: imgAktivitas }} style={styles.previewImage} /> : 
                    <View style={styles.placeholder}><Ionicons name="camera-outline" size={30} color="#ccc"/><Text style={styles.placeholderText}>Foto Aktivitas</Text></View>}
                  </TouchableOpacity>
                </View>

                {/* 3. Kotoran */}
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>3. Bukti Kebersihan 💩</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('kotoran')}>
                    {imgKotoran ? <Image source={{ uri: imgKotoran }} style={styles.previewImage} /> : 
                    <View style={styles.placeholder}><Ionicons name="camera-outline" size={30} color="#ccc"/><Text style={styles.placeholderText}>Foto Litter Box</Text></View>}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim Laporan</Text>}
                </TouchableOpacity>
            </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', marginTop: 30 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  subHeader: { fontSize: 16, marginBottom: 15, textAlign: 'center', color: '#555' },
  infoBox: { flexDirection:'row', backgroundColor:'#cce5ff', padding:12, borderRadius:8, alignItems:'center', marginBottom:20, borderColor:'#b8daff', borderWidth:1 },
  infoBoxText: { color:'#004085', marginLeft:10, flex:1, fontSize:13 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, backgroundColor: '#fafafa', marginBottom: 20 },
  dropdownText: { fontSize: 16, color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight:'bold', marginBottom:15, textAlign:'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems:'center' },
  modalItemDisabled: { backgroundColor: '#f9f9f9' },
  modalItemText: { fontSize: 16, color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.primary, marginTop: 10, marginBottom: 15, textDecorationLine: 'underline' },
  uploadCard: { marginBottom: 20 },
  uploadLabel: { fontSize: 14, marginBottom: 8, color: '#333', fontWeight: '500' },
  imagePicker: { height: 140, borderWidth: 1, borderColor: '#ccc', borderRadius: 12, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#f9f9f9' },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: '#999', marginTop: 5, fontSize: 12 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  btnSubmit: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 50 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  finishedBox: { alignItems: 'center', marginTop: 50, padding: 20 },
  finishedText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15, textAlign: 'center' },
  finishedSub: { fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }
});