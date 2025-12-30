import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.18.12:3000'; // Ganti IP

export default function LaporScreen() {
  const router = useRouter();
  const [deskripsi, setDeskripsi] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!deskripsi || !lokasi || !image) return Alert.alert("Error", "Semua kolom wajib diisi (termasuk foto).");
    
    // Cek Login
    const session = await AsyncStorage.getItem('user_session');
    if (!session) return Alert.alert("Login Diperlukan", "Silakan login untuk melapor.", [{text: "Login", onPress: () => router.push('/profil')}]);
    const user = JSON.parse(session);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('deskripsi', deskripsi);
      formData.append('lokasi', lokasi);
      formData.append('user_id', user.id || '1'); // Pastikan ID user ada, atau gunakan logic mapping username
      
      // Ambil file name
      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('img', { uri: image, name: filename, type } as any);

      const response = await fetch(`${API_URL}/api/lapor`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const res = await response.json();
      if (response.ok) {
        Alert.alert("Berhasil", "Laporan kamu berhasil dikirim.");
        setDeskripsi(''); setLokasi(''); setImage(null);
      } else {
        Alert.alert("Gagal", res.message || "Gagal mengirim laporan.");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lapor Kucing 🚨</Text>
        <Text style={styles.subtitle}>Temukan kucing yang butuh bantuan? Lapor di sini.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Foto Kondisi Kucing</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? <Image source={{ uri: image }} style={styles.imagePreview} /> : 
            <View style={styles.placeholder}>
              <Ionicons name="camera" size={40} color="#ccc" />
              <Text style={{color: '#999'}}>Ketuk untuk upload</Text>
            </View>
          }
        </TouchableOpacity>

        <Text style={styles.label}>Lokasi Penemuan</Text>
        <TextInput style={styles.input} placeholder="Contoh: Jl. Merdeka No. 10 (Depan Indomaret)" value={lokasi} onChangeText={setLokasi} />

        <Text style={styles.label}>Deskripsi / Kondisi</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Jelaskan kondisi kucing (luka, sakit, dll)" multiline numberOfLines={4} value={deskripsi} onChangeText={setDeskripsi} />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim Laporan</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.danger },
  subtitle: { color: '#666' },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
  textArea: { textAlignVertical: 'top' },
  imagePicker: { height: 200, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  btn: { backgroundColor: Colors.danger, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});