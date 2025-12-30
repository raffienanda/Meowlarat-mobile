// meowlarat-mobile/app/register.tsx
import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, Image, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ GANTI IP
const API_URL = 'http://192.168.18.12:3000';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    nama: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password || !form.nama) {
        return Alert.alert("Error", "Mohon lengkapi semua data wajib.");
    }

    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        const result = await response.json();
        
        if (response.ok) {
            Alert.alert("Sukses", "Pendaftaran berhasil! Silakan login.", [
                { text: "Login", onPress: () => router.back() } // Kembali ke halaman Profil/Login
            ]);
        } else {
            Alert.alert("Gagal", result.message || "Terjadi kesalahan.");
        }
    } catch (error) {
        Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Daftar Akun Baru</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Bergabunglah dengan komunitas MeowLarat</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nama Lengkap*</Text>
        <TextInput 
            style={styles.input} 
            placeholder="Contoh: Budi Santoso"
            value={form.nama}
            onChangeText={(t) => setForm({...form, nama: t})}
        />

        <Text style={styles.label}>Username*</Text>
        <TextInput 
            style={styles.input} 
            placeholder="username_unik"
            autoCapitalize="none"
            value={form.username}
            onChangeText={(t) => setForm({...form, username: t})}
        />

        <Text style={styles.label}>Email*</Text>
        <TextInput 
            style={styles.input} 
            placeholder="email@contoh.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(t) => setForm({...form, email: t})}
        />

        <Text style={styles.label}>No. Telepon (Opsional)</Text>
        <TextInput 
            style={styles.input} 
            placeholder="08123456789"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setForm({...form, phone: t})}
        />

        <Text style={styles.label}>Password*</Text>
        <TextInput 
            style={styles.input} 
            placeholder="********"
            secureTextEntry
            value={form.password}
            onChangeText={(t) => setForm({...form, password: t})}
        />

        <TouchableOpacity style={styles.btnRegister} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Daftar Sekarang</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkLogin}>
            <Text style={styles.textLink}>Sudah punya akun? <Text style={{color: Colors.primary, fontWeight:'bold'}}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 80, height: 80, resizeMode: 'contain', marginBottom: 10 },
  subtitle: { color: Colors.gray },
  form: { backgroundColor: Colors.white, padding: 20, borderRadius: 15, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: Colors.text },
  input: { 
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', 
    borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 
  },
  btnRegister: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkLogin: { marginTop: 20, alignItems: 'center' },
  textLink: { color: Colors.gray }
});