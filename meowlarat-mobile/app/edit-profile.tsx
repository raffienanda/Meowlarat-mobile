import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, Alert, ScrollView, SafeAreaView, ActivityIndicator, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// IP LAPTOP KAMU (Updated)
const API_URL = 'http://192.168.100.15:3000'; 

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // State Form
  const [image, setImage] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [token, setToken] = useState('');

  // 1. Ambil Data User Saat Ini
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (session) {
        const parsed = JSON.parse(session);
        let userToken = parsed.token;
        if (userToken.startsWith('"')) userToken = userToken.slice(1, -1);
        setToken(userToken);

        // Fetch Data Terbaru dari Server
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await response.json();

        if (response.ok) {
          setNama(data.nama || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setBio(data.bio || '');
          
          // --- LOGIKA MENAMPILKAN FOTO DARI FOLDER img-profil ---
          if (data.img_url && data.img_url !== 'default.png') {
            setImage(`${API_URL}/uploads/img-profil/${data.img_url}`);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  // 2. Pilih Foto dari Galeri
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 3. Simpan Perubahan (PUT)
  const handleSave = async () => {
    if (!nama || !email) {
      return Alert.alert("Peringatan", "Nama dan Email tidak boleh kosong.");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama', nama);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('bio', bio);

      // Cek apakah image adalah file baru (dari HP)
      if (image && (image.startsWith('file://') || image.startsWith('content://'))) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-ignore
        formData.append('photo', { 
          uri: Platform.OS === 'android' ? image : image.replace('file://', ''), 
          name: filename, 
          type 
        });
      }

      const response = await fetch(`${API_URL}/api/auth/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Content-Type otomatis diurus oleh FormData
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Update Session Lokal biar sinkron
        const session = await AsyncStorage.getItem('user_session');
        if (session) {
            const parsed = JSON.parse(session);
            parsed.user = result.user; 
            await AsyncStorage.setItem('user_session', JSON.stringify(parsed));
        }

        Alert.alert("Sukses", "Profil berhasil diperbarui!", [
          { text: "OK", onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Gagal update profil");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary}/></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{width:24}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Foto Profil */}
        <View style={styles.imageContainer}>
            <TouchableOpacity onPress={pickImage}>
                <Image 
                    source={image ? { uri: image } : require('../assets/images/react-logo.png')} 
                    style={styles.avatar} 
                />
                <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={20} color="#fff" />
                </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Ketuk untuk ganti foto</Text>
        </View>

        {/* Form Input */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput style={styles.input} value={nama} onChangeText={setNama} />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio Singkat</Text>
            <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                value={bio} 
                onChangeText={setBio} 
                multiline 
                placeholder="Ceritakan sedikit tentang dirimu..."
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>No. Telepon / WhatsApp</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
        </View>

        <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Simpan Perubahan</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', marginTop: 30 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 150, },
  
  imageContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#eee' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 110, backgroundColor: Colors.primary, padding: 8, borderRadius: 20 },
  changePhotoText: { marginTop: 10, color: Colors.primary, fontWeight: '600' },

  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight:'600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  
  btnSave: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});