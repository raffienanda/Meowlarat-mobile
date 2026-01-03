import React, { useState, useCallback } from 'react'; // TAMBAHKAN useCallback
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; // TAMBAHKAN useFocusEffect
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.18.12:3000'; 

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // === JURUS RESET OTOMATIS ===
  // Setiap kali kamu meninggalkan halaman ini, semua data akan dihapus.
  // Jadi pas balik lagi, pasti mulai dari Step 1.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setStep(1);
        setEmail('');
        setToken('');
        setNewPassword('');
        setLoading(false);
      };
    }, [])
  );
  // ============================

  // --- STEP 1: KIRIM EMAIL ---
  const handleSendEmail = async () => {
    if (!email) return Alert.alert("Error", "Masukkan email dulu");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert("Kode Terkirim", "Cek email untuk kode OTP.");
        setStep(2); 
      } else {
        Alert.alert("Gagal", result.message || "Email tidak ditemukan");
      }
    } catch (err) {
      Alert.alert("Error", "Gagal koneksi server");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: CEK OTP ---
  const handleVerifyOTP = async () => {
    if (token.length !== 6) return Alert.alert("Error", "Kode harus 6 angka");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();

      if (response.ok && result.valid) {
        setStep(3);
      } else {
        Alert.alert("Salah", "Kode OTP salah atau kadaluwarsa.");
      }
    } catch (err) {
      Alert.alert("Error", "Gagal verifikasi kode");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: GANTI PASSWORD ---
  const handleResetPassword = async () => {
    if (!newPassword) return Alert.alert("Error", "Password baru wajib diisi");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }), 
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert("Sukses!", "Password berhasil diubah. Silakan Login.", [
            { text: "Login", onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert("Gagal", result.message);
      }
    } catch (err) {
      Alert.alert("Error", "Gagal update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        
        <TouchableOpacity onPress={() => router.back()} style={{alignSelf:'flex-start', marginBottom:20}}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Text style={styles.title}>Lupa Password? 📧</Text>
            <Text style={styles.subtitle}>Masukkan email yang terdaftar untuk menerima kode OTP.</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Contoh: user@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSendEmail} disabled={loading}>
               {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim Kode</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Text style={styles.title}>Verifikasi OTP 🔐</Text>
            <Text style={styles.subtitle}>Masukkan 6 angka yang dikirim ke email: {email}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color="#666" style={styles.icon} />
              <TextInput style={[styles.input, { letterSpacing: 8, fontSize: 20, fontWeight:'bold', textAlign:'center' }]} placeholder="000000" value={token} onChangeText={setToken} keyboardType="number-pad" maxLength={6} />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP} disabled={loading}>
               {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verifikasi Kode</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={{marginTop:20}}>
                <Text style={{color:'#666', textAlign:'center'}}>Salah email? Kembali</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Text style={styles.title}>Reset Password 🔒</Text>
            <Text style={styles.subtitle}>Silakan buat password baru untuk akunmu.</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Password Baru" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading}>
               {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Simpan Password</Text>}
            </TouchableOpacity>
          </>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 10, textAlign:'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign:'center', lineHeight:20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 25, paddingBottom: 8 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  btn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});