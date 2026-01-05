import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/Config';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [phone, setPhone] = useState('');
  const [alamat, setAlamat] = useState(''); // STATE BARU
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !nama || !alamat) { // CEK ALAMAT
      Alert.alert('Gagal', 'Mohon isi semua data (termasuk Alamat)!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username, email, nama, phone, password, alamat 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Berhasil', 'Akun berhasil dibuat! Silakan login.', [
          { text: 'OK', onPress: () => router.replace('/profil') }
        ]);
      } else {
        Alert.alert('Gagal', data.message || 'Terjadi kesalahan saat mendaftar.');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Daftar Akun</Text>
          <Text style={styles.subtitle}>Gabung komunitas pecinta kucing</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="id-card-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Nama Lengkap" value={nama} onChangeText={setNama} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="No. Handphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          {/* INPUT ALAMAT BARU */}
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
            <TextInput 
                style={styles.input} 
                placeholder="Alamat Lengkap" 
                value={alamat} 
                onChangeText={setAlamat} 
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.btnRegister} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Daftar Sekarang</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={{color: '#666'}}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => router.replace('/profil')}>
            <Text style={styles.linkText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 30, paddingBottom: 50 },
  backButton: { marginBottom: 20, alignSelf: 'flex-start' },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666' },
  form: { marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 20, paddingBottom: 5 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, color: '#333' },
  btnRegister: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  linkText: { color: Colors.primary, fontWeight: 'bold' },
});