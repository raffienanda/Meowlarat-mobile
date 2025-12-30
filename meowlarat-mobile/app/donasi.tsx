import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, 
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { metode } from '../types';

// ⚠️ GANTI IP SESUAI CONFIG KAMU
const API_URL = 'http://192.168.18.12:3000'; 

export default function DonasiScreen() {
  const router = useRouter();
  
  // State Form
  const [nominal, setNominal] = useState('');
  const [pesan, setPesan] = useState('');
  const [selectedMetode, setSelectedMetode] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
  
  // State Data & UI
  const [metodes, setMetodes] = useState<metode[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ambil data metode saat load
  useEffect(() => {
    fetchMetode();
  }, []);

  const fetchMetode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/metode`);
      const data = await response.json();
      setMetodes(data);
    } catch (error) {
      Alert.alert("Error", "Gagal mengambil metode pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, 
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Validasi Input
    if (!nominal) return Alert.alert("Peringatan", "Mohon isi nominal donasi");
    if (!selectedMetode) return Alert.alert("Peringatan", "Pilih metode pembayaran");
    if (!image) return Alert.alert("Peringatan", "Sertakan bukti transfer");

    // CEK SESSION (LOGIN)
    let userSession = null;
    try {
        const jsonValue = await AsyncStorage.getItem('user_session');
        if (jsonValue) {
            userSession = JSON.parse(jsonValue);
        }
    } catch (e) {
        console.error("Gagal baca sesi");
    }

    if (!userSession) {
        Alert.alert(
            "Belum Login", 
            "Mohon login terlebih dahulu untuk melakukan donasi.",
            [
                { text: "Batal", style: "cancel" },
                { text: "Login", onPress: () => router.push('/profil') }
            ]
        );
        return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('nominal', nominal);
      formData.append('pesan', pesan);
      formData.append('metode', selectedMetode.toString()); 
      // GUNAKAN USERNAME ASLI
      formData.append('username', userSession.username); 

      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('img', {
        uri: image,
        name: filename || 'upload.jpg',
        type,
      } as any); 

      const response = await fetch(`${API_URL}/api/donasi`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Terima Kasih!", "Donasi kamu berhasil dikirim dan menunggu verifikasi.", [
            { text: "OK", onPress: () => router.replace('/') } 
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan saat mengirim donasi.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const currentMetode = metodes.find(m => m.id === selectedMetode);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Form Donasi</Text>
          <Text style={styles.headerSubtitle}>Bantuanmu sangat berarti bagi mereka</Text>
        </View>

        <View style={styles.formContainer}>
            {/* Input Nominal */}
            <Text style={styles.label}>Nominal Donasi (Rp)</Text>
            <TextInput 
                style={styles.input}
                placeholder="Contoh: 50000"
                keyboardType="numeric"
                value={nominal}
                onChangeText={setNominal}
            />

            {/* Input Pesan */}
            <Text style={styles.label}>Pesan Semangat (Opsional)</Text>
            <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Tulis pesan untuk para anabul..."
                multiline
                numberOfLines={3}
                value={pesan}
                onChangeText={setPesan}
            />

            {/* Pilih Metode */}
            <Text style={styles.label}>Metode Pembayaran</Text>
            {loading ? (
                <ActivityIndicator color={Colors.primary} />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodScroll}>
                    {metodes.map((m) => (
                        <TouchableOpacity 
                            key={m.id} 
                            style={[
                                styles.methodCard, 
                                selectedMetode === m.id && styles.methodCardActive
                            ]}
                            onPress={() => setSelectedMetode(m.id)}
                        >
                            <Text style={[
                                styles.methodText, 
                                selectedMetode === m.id && styles.methodTextActive
                            ]}>{m.nama}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Detail Rekening */}
            {currentMetode && (
                <View style={styles.rekInfo}>
                    <Text style={styles.rekTitle}>Silakan transfer ke:</Text>
                    <Text style={styles.rekNumber}>{currentMetode.rek}</Text>
                    <Text style={styles.rekName}>a.n {currentMetode.an}</Text>
                </View>
            )}

            {/* Upload Bukti */}
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

            {/* Tombol Submit */}
            <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.btnDisabled]} 
                onPress={handleSubmit}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitText}>Kirim Donasi</Text>
                )}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 25, backgroundColor: Colors.primary, paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { color: '#e0e0e0', marginTop: 5 },
  
  formContainer: {
    backgroundColor: '#fff',
    marginTop: -20,
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 30
  },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#f0f2f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    fontSize: 16
  },
  textArea: { textAlignVertical: 'top' }, 
  
  methodScroll: { flexDirection: 'row', marginBottom: 10 },
  methodCard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  methodCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: Colors.primary
  },
  methodText: { fontWeight: '600', color: '#666' },
  methodTextActive: { color: Colors.primary },

  rekInfo: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center'
  },
  rekTitle: { fontSize: 12, color: '#856404' },
  rekNumber: { fontSize: 22, fontWeight: 'bold', color: '#856404', marginVertical: 5 },
  rekName: { fontSize: 14, color: '#856404' },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed'
  },
  uploadText: { marginLeft: 10, color: '#666' },
  previewImage: { width: '100%', height: 200, marginTop: 15, borderRadius: 8, backgroundColor: '#eee' },

  submitBtn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30
  },
  btnDisabled: { backgroundColor: '#a0c4ff' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});