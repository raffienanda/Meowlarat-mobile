import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ScrollView, ActivityIndicator, Switch 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/Config';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [oldUsername, setOldUsername] = useState(''); 
  
  const [userData, setUserData] = useState({
    username: '', email: '', nama: '', phone: '', bio: '', alamat: '', // ADA ALAMAT
    pekerjaan: '', gaji: '', luas_rumah: 'Sedang', punya_halaman: false, jumlah_kucing: '',
  });

  useFocusEffect(
    useCallback(() => {
      setLoading(true); 
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (!session) { setLoading(false); return; }

      const parsedSession = JSON.parse(session);
      const userToken = parsedSession.token;
      setToken(userToken);

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      const data = await response.json();

      if (response.ok) {
        setOldUsername(data.username || ''); 
        setUserData({
          username: data.username || '',
          email: data.email || '',
          nama: data.nama || '',
          phone: (!data.phone || data.phone === '-') ? '' : data.phone,
          bio: (!data.bio || data.bio === '-') ? '' : data.bio,
          
          alamat: (!data.alamat || data.alamat === '-') ? '' : data.alamat, // LOAD ALAMAT

          pekerjaan: (!data.pekerjaan || data.pekerjaan === '-') ? '' : data.pekerjaan,
          gaji: data.gaji ? String(data.gaji) : '',
          luas_rumah: data.luas_rumah || 'Sedang',
          punya_halaman: data.punya_halaman || false,
          jumlah_kucing: data.jumlah_kucing ? String(data.jumlah_kucing) : '0',
        });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!userData.nama || !userData.phone || !userData.username) {
        Alert.alert("Gagal", "Username, Nama, dan No HP wajib diisi.");
        setLoading(false);
        return;
      }

      if (/\s/.test(userData.username)) {
        Alert.alert("Gagal", "Username tidak boleh mengandung spasi.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/update/${oldUsername}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: userData.username, 
          nama: userData.nama,
          phone: userData.phone,
          bio: userData.bio,
          alamat: userData.alamat, // KIRIM ALAMAT
          pekerjaan: userData.pekerjaan,
          gaji: parseInt(userData.gaji) || 0,
          luas_rumah: userData.luas_rumah,
          punya_halaman: userData.punya_halaman,
          jumlah_kucing: parseInt(userData.jumlah_kucing) || 0
        })
      });

      const res = await response.json();

      if (response.ok) {
        const oldSession = await AsyncStorage.getItem('user_session');
        const parsedOld = JSON.parse(oldSession || '{}');
        
        const activeToken = res.new_token || parsedOld.token; 

        const newSession = {
          token: activeToken, 
          user: { 
              ...parsedOld.user, 
              ...userData, 
              username: userData.username,
              gaji: parseInt(userData.gaji) || 0,
              jumlah_kucing: parseInt(userData.jumlah_kucing) || 0
          }
        };
        
        await AsyncStorage.setItem('user_session', JSON.stringify(newSession));
        
        setToken(activeToken);
        setOldUsername(userData.username);

        Alert.alert("Sukses", "Profil berhasil disimpan!", [
            { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Gagal", res.message || "Gagal update profil.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return (
          <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: '#fff'}}>
              <ActivityIndicator size="large" color={Colors.primary} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil ✏️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={{alignItems:'center', marginBottom: 20}}>
            <View style={{backgroundColor: Colors.primary, width: 80, height: 80, borderRadius: 40, justifyContent:'center', alignItems:'center'}}>
                <Text style={{color:'#fff', fontSize: 30, fontWeight:'bold'}}>
                  {userData.nama ? userData.nama.charAt(0).toUpperCase() : '?'}
                </Text>
            </View>
            <Text style={{marginTop: 10, color: '#888', fontSize: 12}}>
                @{userData.username}
            </Text>
        </View>

        <Text style={styles.sectionLabel}>Data Akun</Text>
        
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Username (Unik)</Text>
            <View style={styles.inputWithIcon}>
                <Ionicons name="at" size={20} color="#888" style={{marginRight: 5}} />
                <TextInput 
                    style={[styles.input, {flex: 1, borderWidth: 0}]} 
                    value={userData.username}
                    autoCapitalize="none"
                    onChangeText={(text) => setUserData({...userData, username: text})}
                />
            </View>
            <Text style={{fontSize: 10, color: '#999', marginTop: 3}}>
                *Mengganti username akan me-refresh akun Anda.
            </Text>
        </View>

        <Text style={styles.sectionLabel}>Data Diri</Text>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput style={styles.input} value={userData.nama} onChangeText={(t) => setUserData({...userData, nama: t})} />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>No. Handphone</Text>
            <TextInput style={styles.input} value={userData.phone} keyboardType="phone-pad" onChangeText={(t) => setUserData({...userData, phone: t})} />
        </View>
        
        {/* INPUT ALAMAT */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat Lengkap</Text>
            <TextInput 
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]} 
                value={userData.alamat}
                multiline
                placeholder="Jalan, Kota, Kode Pos"
                onChangeText={(text) => setUserData({...userData, alamat: text})}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio Singkat</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={userData.bio} multiline onChangeText={(t) => setUserData({...userData, bio: t})} />
        </View>

        <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#856404" />
            <Text style={styles.warningText}>Data di bawah ini <Text style={{fontWeight:'bold'}}>WAJIB DIISI</Text> jika ingin mengadopsi.</Text>
        </View>

        <Text style={styles.sectionLabel}>Info Kondisi (Syarat Adopsi)</Text>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Pekerjaan</Text>
            <TextInput style={styles.input} value={userData.pekerjaan} onChangeText={(t) => setUserData({...userData, pekerjaan: t})} />
        </View>
        <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
                <Text style={styles.label}>Gaji (Rp)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={userData.gaji} onChangeText={(t) => setUserData({...userData, gaji: t})} />
            </View>
            <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Jml Kucing</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={userData.jumlah_kucing} onChangeText={(t) => setUserData({...userData, jumlah_kucing: t})} />
            </View>
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Ukuran Rumah</Text>
            <View style={styles.radioRow}>
                {['Kecil', 'Sedang', 'Besar'].map((size) => (
                    <TouchableOpacity key={size} style={[styles.radioBtn, userData.luas_rumah === size && styles.radioBtnActive]} onPress={() => setUserData({...userData, luas_rumah: size})}>
                        <Text style={[styles.radioText, userData.luas_rumah === size && styles.radioTextActive]}>{size}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
        <View style={styles.switchRow}>
            <Text style={styles.label}>Punya Halaman Rumah?</Text>
            <Switch value={userData.punya_halaman} onValueChange={(val) => setUserData({...userData, punya_halaman: val})} trackColor={{ false: "#767577", true: Colors.primary }} thumbColor={userData.punya_halaman ? "#fff" : "#f4f3f4"} />
        </View>

        <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
            <Text style={styles.btnSaveText}>Simpan Perubahan</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: Colors.primary },
  content: { padding: 20, paddingBottom: 50 },
  sectionLabel: { fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginTop: 10, marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#f9f9f9' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  warningBox: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  warningText: { color: '#856404', fontSize: 12, flex: 1 },
  radioRow: { flexDirection: 'row', gap: 10 },
  radioBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  radioBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioText: { color: '#555' },
  radioTextActive: { color: '#fff', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  btnSave: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});