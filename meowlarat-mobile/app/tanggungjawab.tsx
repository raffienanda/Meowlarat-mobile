import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, Alert, ScrollView, ActivityIndicator, SafeAreaView, Platform, Modal 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

// GANTI SESUAI IP KAMU
const API_URL = 'http://192.168.18.12:3000'; 

export default function TanggungJawabScreen() {
  const router = useRouter();
  // Menerima data dari halaman sebelumnya
  const { catId, catName, adoptDate } = useLocalSearchParams(); 

  // State
  const [week, setWeek] = useState(''); // Minggu yang dipilih di dropdown
  const [currentActiveWeek, setCurrentActiveWeek] = useState(0); // Minggu yang seharusnya aktif saat ini
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // State Foto (3 Jenis)
  const [imgMakanan, setImgMakanan] = useState<string | null>(null);
  const [imgAktivitas, setImgAktivitas] = useState<string | null>(null);
  const [imgKotoran, setImgKotoran] = useState<string | null>(null);

  // --- 1. HITUNG MINGGU BERJALAN ---
  useEffect(() => {
    if (adoptDate) {
      const start = new Date(adoptDate as string);
      const now = new Date();
      
      // Hitung selisih waktu dalam hari
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      let activeWeek = 0;
      // Logika penentuan minggu (1 minggu = 7 hari)
      if (diffDays <= 7) activeWeek = 1;
      else if (diffDays <= 14) activeWeek = 2;
      else if (diffDays <= 21) activeWeek = 3;
      else activeWeek = 4; // Minggu ke-4 berarti sudah selesai masa pantau

      setCurrentActiveWeek(activeWeek);
      
      // Otomatis set minggu terpilih ke minggu aktif (jika belum selesai)
      if (activeWeek >= 1 && activeWeek <= 3) {
        setWeek(activeWeek.toString());
      } else {
        setWeek('Selesai');
      }
    }
  }, [adoptDate]);

  // --- 2. FUNGSI PILIH GAMBAR ---
  const pickImage = async (type: 'makanan' | 'aktivitas' | 'kotoran') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6, // Kompres sedikit
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === 'makanan') setImgMakanan(uri);
      if (type === 'aktivitas') setImgAktivitas(uri);
      if (type === 'kotoran') setImgKotoran(uri);
    }
  };

  // --- 3. SUBMIT LAPORAN ---
  const handleSubmit = async () => {
    // Validasi Minggu
    if (currentActiveWeek > 3) {
        return Alert.alert("Selesai", "Masa pemantauan 3 minggu sudah selesai. Terima kasih!");
    }
    // Validasi apakah user mencoba mengakali dropdown
    if (parseInt(week) !== currentActiveWeek) {
        return Alert.alert("Salah Minggu", `Saat ini adalah Minggu ke-${currentActiveWeek}. Kamu hanya bisa laporan untuk minggu ini.`);
    }

    // Validasi Foto Lengkap
    if (!imgMakanan || !imgAktivitas || !imgKotoran) {
      return Alert.alert("Data Belum Lengkap", "Kamu wajib mengupload ketiga foto bukti (Makanan, Aktivitas, Kotoran).");
    }

    setLoading(true);
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (!session) {
        Alert.alert("Error", "Sesi habis, silakan login ulang.");
        return;
      }
      
      const parsedSession = JSON.parse(session);
      const token = parsedSession.token; 

      // Siapkan Form Data
      const formData = new FormData();
      formData.append('cat_id', catId as string);
      formData.append('week', week);
      // 'aktivitas' teks dikosongkan/diisi default karena diganti foto, 
      // tapi backend mungkin masih butuh field ini agar tidak error
      formData.append('aktivitas', 'Laporan Mingguan'); 

      // Helper Append File
      const appendFile = (uri: string, fieldName: string) => {
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        // @ts-ignore
        formData.append(fieldName, { 
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), 
          name: filename, 
          type 
        });
      };

      appendFile(imgMakanan, 'bukti_makanan');
      appendFile(imgAktivitas, 'bukti_aktivitas');
      appendFile(imgKotoran, 'bukti_kotoran');

      // Kirim ke Backend
      const response = await fetch(`${API_URL}/api/tanggungjawab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Berhasil", `Laporan Minggu ke-${week} berhasil dikirim!`);
        router.back(); 
      } else {
        Alert.alert("Gagal", result.message || "Gagal mengirim laporan.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper UI Dropdown
  const getWeekStatus = (w: number) => {
    if (w < currentActiveWeek) return "(Terlewat 🔒)";
    if (w > currentActiveWeek) return "(Belum Mulai 🔒)";
    if (w === currentActiveWeek) return "(Aktif ✅)";
    return "";
  };

  const isWeekDisabled = (w: number) => {
    return w !== currentActiveWeek;
  };

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

        {/* --- INFO ALERT --- */}
        <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#155724" />
            <Text style={styles.infoBoxText}>
                Status: <Text style={{fontWeight:'bold'}}>Minggu ke-{currentActiveWeek > 3 ? 'Selesai' : currentActiveWeek}</Text> sejak adopsi.
            </Text>
        </View>

        {/* --- DROPDOWN MINGGU --- */}
        <Text style={styles.label}>Pilih Minggu Laporan</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDropdownVisible(true)}>
          <Text style={styles.dropdownText}>
             {week && week !== 'Selesai' ? `Minggu ${week}` : week === 'Selesai' ? 'Masa Pantau Selesai' : 'Pilih Minggu...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {/* Modal Pilihan Minggu */}
        <Modal visible={dropdownVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pilih Minggu</Text>
              {['1', '2', '3'].map((item) => {
                const wNum = parseInt(item);
                const disabled = isWeekDisabled(wNum);
                
                return (
                  <TouchableOpacity 
                    key={item} 
                    style={[styles.modalItem, disabled && styles.modalItemDisabled]} 
                    onPress={() => { 
                        if (disabled) {
                            if (wNum < currentActiveWeek) Alert.alert("Terlewat", "Minggu ini sudah lewat.");
                            else Alert.alert("Belum Waktunya", "Kamu belum bisa mengisi laporan ini.");
                        } else {
                            setWeek(item); 
                            setDropdownVisible(false); 
                        }
                    }}
                  >
                    <View>
                        <Text style={[styles.modalItemText, disabled && {color:'#aaa'}]}>
                            Minggu {item}
                        </Text>
                        <Text style={{fontSize:10, color: disabled ? '#ccc' : Colors.primary}}>
                            {getWeekStatus(wNum)}
                        </Text>
                    </View>
                    {week === item && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                    {disabled && <Ionicons name="lock-closed" size={16} color="#ccc" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* --- KONDISI SELESAI ATAU FORM --- */}
        {currentActiveWeek > 3 ? (
            <View style={styles.finishedBox}>
                <Ionicons name="trophy" size={50} color="#FFD700" />
                <Text style={styles.finishedText}>Selamat! Kamu telah menyelesaikan 3 minggu masa pemantauan.</Text>
                <Text style={styles.finishedSub}>Terima kasih sudah menjadi pemilik yang bertanggung jawab.</Text>
            </View>
        ) : (
            <>
                <Text style={styles.sectionTitle}>Bukti Foto Mingguan (Wajib 3)</Text>

                {/* 1. Makanan */}
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>1. Bukti Makanan 🍗</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('makanan')}>
                    {imgMakanan ? (
                      <Image source={{ uri: imgMakanan }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.placeholder}>
                        <Ionicons name="camera-outline" size={32} color="#ccc" />
                        <Text style={styles.placeholderText}>Foto Makanan</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 2. Aktivitas */}
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>2. Bukti Aktivitas 🧶</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('aktivitas')}>
                    {imgAktivitas ? (
                      <Image source={{ uri: imgAktivitas }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.placeholder}>
                        <Ionicons name="camera-outline" size={32} color="#ccc" />
                        <Text style={styles.placeholderText}>Foto Bermain/Tidur</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 3. Kotoran */}
                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>3. Bukti Kebersihan 💩</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('kotoran')}>
                    {imgKotoran ? (
                      <Image source={{ uri: imgKotoran }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.placeholder}>
                        <Ionicons name="camera-outline" size={32} color="#ccc" />
                        <Text style={styles.placeholderText}>Foto Litter Box</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Tombol Kirim */}
                <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Kirim Laporan Minggu {week}</Text>
                  )}
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
  
  // Info Box
  infoBox: { flexDirection:'row', backgroundColor:'#d4edda', padding:10, borderRadius:8, alignItems:'center', marginBottom:20 },
  infoBoxText: { color:'#155724', marginLeft:8, flex:1, fontSize:13 },

  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  
  // Dropdown
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, backgroundColor: '#fafafa', marginBottom: 20 },
  dropdownText: { fontSize: 16, color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight:'bold', marginBottom:15, textAlign:'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems:'center' },
  modalItemDisabled: { backgroundColor: '#f9f9f9' },
  modalItemText: { fontSize: 16, color: '#333' },

  // Upload
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.primary, marginTop: 10, marginBottom: 15, textDecorationLine: 'underline' },
  uploadCard: { marginBottom: 20 },
  uploadLabel: { fontSize: 14, marginBottom: 8, color: '#333', fontWeight: '500' },
  imagePicker: { height: 140, borderWidth: 1, borderColor: '#ccc', borderRadius: 12, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#f9f9f9' },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: '#999', marginTop: 5, fontSize: 12 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Button & Finished State
  btnSubmit: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 50 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  finishedBox: { alignItems: 'center', marginTop: 50, padding: 20 },
  finishedText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15, textAlign: 'center' },
  finishedSub: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }
});