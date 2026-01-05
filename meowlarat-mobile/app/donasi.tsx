import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, 
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { metode } from '../types';
import { API_URL } from '../constants/Config';

// Interface untuk data history donasi
interface DonasiLog {
  id: number;
  username: string;
  nominal: number;
  pesan: string;
  metode_donasi_metodeTometode: {
    nama: string;
  };
}

export default function DonasiScreen() {
  const router = useRouter();
  
  const [nominal, setNominal] = useState('');
  const [pesan, setPesan] = useState('');
  const [selectedMetode, setSelectedMetode] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
  
  const [metodes, setMetodes] = useState<metode[]>([]);
  const [donations, setDonations] = useState<DonasiLog[]>([]); 
  const [totalDonasi, setTotalDonasi] = useState(0); 
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMetode(), fetchDonations()]);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData(); 
    setRefreshing(false);
  }, []);

  const fetchMetode = async () => {
    try {
      const response = await fetch(`${API_URL}/api/metode`);
      const data = await response.json();
      setMetodes(data);
    } catch (error) {
      console.log("Gagal ambil metode");
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/donasi`);
      const res = await response.json();
      if (res.status === 'success') {
        setDonations(res.data);
        setTotalDonasi(res.total);
      }
    } catch (error) {
      console.log("Gagal ambil history donasi");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, 
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!nominal) return Alert.alert("Peringatan", "Mohon isi nominal donasi");
    if (!selectedMetode) return Alert.alert("Peringatan", "Pilih metode pembayaran");
    if (!image) return Alert.alert("Peringatan", "Sertakan bukti transfer");

    let username = null;
    try {
        const jsonValue = await AsyncStorage.getItem('user_session');
        if (jsonValue) {
            const session = JSON.parse(jsonValue);
            // FIX: Ambil username dari struktur yang benar (session.user.username)
            username = session.user?.username || session.username;
        }
    } catch (e) { console.error("Gagal baca sesi"); }

    if (!username) {
        return Alert.alert("Belum Login", "Mohon login terlebih dahulu.", [
            { text: "Batal", style: "cancel" },
            { text: "Login", onPress: () => router.push('/profil') }
        ]);
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('nominal', nominal);
      formData.append('pesan', pesan);
      formData.append('metode', selectedMetode.toString()); 
      formData.append('username', username); // FIX: Kirim username yang sudah valid

      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('img', {
        uri: image,
        name: filename || 'upload.jpg',
        type,
      } as any); 

      // Request tanpa header content-type manual (Biarkan otomatis)
      const response = await fetch(`${API_URL}/api/donasi`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Terima Kasih!", "Donasi berhasil dikirim.", [{ text: "OK" }]);
        setNominal('');
        setPesan('');
        setImage(null);
        setSelectedMetode(null);
        fetchDonations(); 
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan.");
      }

    } catch (error) {
      Alert.alert("Error", "Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  const currentMetode = metodes.find(m => m.id === selectedMetode);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Form Donasi</Text>
          <Text style={styles.headerSubtitle}>Bantuanmu sangat berarti bagi mereka</Text>
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.label}>Nominal Donasi (Rp)</Text>
            <TextInput 
                style={styles.input}
                placeholder="Contoh: 50000"
                keyboardType="numeric"
                value={nominal}
                onChangeText={setNominal}
            />

            <Text style={styles.label}>Pesan Semangat (Opsional)</Text>
            <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Tulis pesan untuk para anabul..."
                multiline
                numberOfLines={3}
                value={pesan}
                onChangeText={setPesan}
            />

            <Text style={styles.label}>Metode Pembayaran</Text>
            {loading && metodes.length === 0 ? (
                <ActivityIndicator color={Colors.primary} />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodScroll}>
                    {metodes.map((m) => {
                        const isActive = m.isActive !== false; 
                        return (
                            <TouchableOpacity 
                                key={m.id} 
                                style={[
                                    styles.methodCard, 
                                    selectedMetode === m.id && styles.methodCardActive,
                                    !isActive && styles.methodCardDisabled
                                ]}
                                onPress={() => {
                                  if(isActive) setSelectedMetode(m.id);
                                  else Alert.alert("Coming Soon", "Metode ini belum tersedia.");
                                }}
                                disabled={!isActive}
                            >
                                <Text style={[
                                    styles.methodText, 
                                    selectedMetode === m.id && styles.methodTextActive,
                                    !isActive && styles.methodTextDisabled
                                ]}>
                                    {m.nama}
                                </Text>
                                
                                {!isActive && (
                                    <View style={styles.comingSoonBadge}>
                                        <Text style={styles.comingSoonText}>Soon</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {currentMetode && (
                <View style={styles.rekInfo}>
                    <Text style={styles.rekTitle}>Silakan transfer ke:</Text>
                    
                    {/* QRIS / E-WALLET (GAMBAR BESAR) */}
                    {currentMetode.logo && (currentMetode.category === 'E-Wallet' || currentMetode.nama.includes('QRIS')) ? (
                        <View style={styles.qrisWrapper}>
                            <Text style={styles.scanTextHeader}>SCAN QRIS DI BAWAH</Text>
                            <Image 
                                source={{ uri: `${API_URL}/uploads/logo/${currentMetode.logo}` }} 
                                style={styles.qrisImage} 
                                resizeMode="contain" 
                            />
                            <Text style={styles.scanText}>a.n {currentMetode.an}</Text>
                        </View>
                    ) : null}

                    {/* BANK (LOGO KECIL) */}
                    {currentMetode.logo && currentMetode.category !== 'E-Wallet' && !currentMetode.nama.includes('QRIS') && (
                         <Image 
                            source={{ uri: `${API_URL}/uploads/logo/${currentMetode.logo}` }} 
                            style={styles.bankLogo} 
                            resizeMode="contain"
                        />
                    )}

                    {currentMetode.rek && (
                        <>
                            <Text style={styles.rekNumber} selectable>{currentMetode.rek}</Text>
                            <Text style={styles.rekName}>a.n {currentMetode.an}</Text>
                        </>
                    )}
                </View>
            )}

            <Text style={styles.label}>Bukti Transfer</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Ionicons name="cloud-upload-outline" size={24} color="#666" />
                <Text style={styles.uploadText}>
                    {image ? "Ganti Gambar" : "Pilih Gambar dari Galeri"}
                </Text>
            </TouchableOpacity>

            {image && (
                <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
            )}

            <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.btnDisabled]} 
                onPress={handleSubmit}
                disabled={submitting}
            >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Kirim Donasi</Text>}
            </TouchableOpacity>
        </View>

        {/* SECTION TRANSPARANSI */}
        <View style={styles.transparencyContainer}>
            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Donasi Terkumpul</Text>
                <Text style={styles.totalValue}>{formatRupiah(totalDonasi)}</Text>
            </View>

            <Text style={styles.historyTitle}>Riwayat Donatur ({donations.length})</Text>
            
            <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, {flex: 3}]}>Nama</Text>
                <Text style={[styles.colHeader, {flex: 2, textAlign: 'right'}]}>Nominal</Text>
            </View>

            {donations.length === 0 ? (
                <Text style={{textAlign:'center', marginTop: 20, color:'#999'}}>Belum ada donasi.</Text>
            ) : (
                donations.map((item) => (
                    <View key={item.id} style={styles.tableRow}>
                        <View style={{flex: 3}}>
                            <Text style={styles.rowName}>{item.username}</Text>
                            {item.pesan !== '-' && item.pesan !== '' && (
                                <Text style={styles.rowMsg} numberOfLines={1}>"{item.pesan}"</Text>
                            )}
                        </View>
                        <Text style={[styles.rowNominal, {flex: 2, textAlign: 'right'}]}>
                            {formatRupiah(item.nominal)}
                        </Text>
                    </View>
                ))
            )}
        </View>
        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 25, backgroundColor: Colors.primary, paddingBottom: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { color: '#e0e0e0', marginTop: 5 },
  
  formContainer: {
    backgroundColor: '#fff',
    marginTop: -30,
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20
  },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f0f2f5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e1e1e1', fontSize: 16 },
  textArea: { textAlignVertical: 'top' }, 
  
  methodScroll: { flexDirection: 'row', marginBottom: 10, paddingVertical: 5 },
  methodCard: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    backgroundColor: '#f0f2f5', 
    borderRadius: 16, 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: '#eee',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', 
    overflow: 'hidden'    
  },
  methodCardActive: { backgroundColor: '#e3f2fd', borderColor: Colors.primary },
  methodCardDisabled: { backgroundColor: '#f8f9fa', borderColor: '#f0f0f0', opacity: 0.7 },
  
  methodText: { fontWeight: '600', color: '#666' },
  methodTextActive: { color: Colors.primary },
  methodTextDisabled: { color: '#bbb' },

  comingSoonBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  comingSoonText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  rekInfo: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  rekTitle: { fontSize: 12, color: '#856404' },
  rekNumber: { fontSize: 22, fontWeight: 'bold', color: '#856404', marginVertical: 5 },
  rekName: { fontSize: 14, color: '#856404' },

  qrisWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    marginHorizontal: -20, // Style untuk full-width QRIS
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2
  },
  qrisImage: { 
    width: 280, 
    height: 280, 
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  scanTextHeader: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  scanText: { fontSize: 12, color: '#666', fontStyle: 'italic' },

  bankLogo: { width: 120, height: 60, marginBottom: 5 },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  uploadText: { marginLeft: 10, color: '#666' },
  previewImage: { width: '100%', height: 200, marginTop: 15, borderRadius: 8, backgroundColor: '#eee' },

  submitBtn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  btnDisabled: { backgroundColor: '#a0c4ff' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  transparencyContainer: { padding: 20, marginTop: 10 },
  totalCard: { 
    backgroundColor: Colors.primary, 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 25,
    elevation: 4
  },
  totalLabel: { color: '#e0e0e0', fontSize: 14, fontWeight: 'bold' },
  totalValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 5 },

  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#eee', marginBottom: 5 },
  colHeader: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  rowName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  rowMsg: { fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 2 },
  rowNominal: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});