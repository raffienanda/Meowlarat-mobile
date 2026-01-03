import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, Alert, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Pastikan IP Address ini sesuai dengan backend (laptop) kamu
const API_URL = 'http://192.168.100.15:3000'; 

export default function RegisterScreen() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // 1. Validasi Input Kosong
    if (!username || !password || !email || !nama || !phone) {
      Alert.alert("Data Tidak Lengkap", "Mohon isi semua kolom pendaftaran.");
      return;
    }

    setLoading(true);

    try {
      // 2. Kirim Data ke Backend
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          nama,
          phone
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Berhasil", "Registrasi berhasil! Silakan login.", [
          { text: "OK", onPress: () => router.replace('/') } // Kembali ke Login setelah sukses
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan saat registrasi.");
      }
    } catch (error) {
      console.error("Register Error:", error);
      Alert.alert("Error", "Gagal menghubungi server. Cek koneksi internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header / Logo Area */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/images/logo.png')} // Pastikan logo ada
              style={styles.logo}
            />
            <Text style={styles.title}>Daftar Akun</Text>
            <Text style={styles.subtitle}>Bergabunglah dengan komunitas MeowLarat</Text>
          </View>

          {/* Form Input */}
          <View style={styles.form}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Contoh: Raffie Ananda"
                value={nama}
                onChangeText={setNama}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Username unik"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input} 
                placeholder="email@contoh.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>No. WhatsApp / HP</Text>
              <TextInput 
                style={styles.input} 
                placeholder="08xxxxxxxx"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.inputPassword} 
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tombol Register */}
            <TouchableOpacity 
              style={styles.btnRegister} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnRegisterText}>Daftar Sekarang</Text>
              )}
            </TouchableOpacity>

            {/* --- FIX TOMBOL LOGIN DISINI --- */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => router.replace('/profil')}>
                <Text style={styles.loginLink}>Login disini</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  header: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  logo: { width: 80, height: 80, resizeMode: 'contain', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
  input: { 
    backgroundColor: '#f9f9f9', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 16 
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputPassword: { flex: 1, paddingVertical: 12, fontSize: 16 },
  btnRegister: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  btnRegisterText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#666', fontSize: 14 },
  loginLink: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
});