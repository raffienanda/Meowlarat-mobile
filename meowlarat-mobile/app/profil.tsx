import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, Alert, ActivityIndicator, SafeAreaView, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// ⚠️ GANTI DENGAN IP LAPTOP KAMU
const API_URL = 'http://192.168.18.12:3000'; 

export default function ProfilScreen() {
  const router = useRouter();
  
  // State Aplikasi
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // State Form Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 1. Cek Status Login saat aplikasi dibuka
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_session');
      if (jsonValue != null) {
        setUserData(JSON.parse(jsonValue));
        setIsLoggedIn(true);
      }
    } catch(e) {
      console.error("Gagal membaca data login");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fungsi Login (Konek ke Backend)
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Username dan Password wajib diisi");
      return;
    }

    setLoginLoading(true);

    try {
      // Panggil API Login Backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // Simpan data user ke HP
        const userToSave = result.data || result.user; // Sesuaikan dengan response backend kamu
        await AsyncStorage.setItem('user_session', JSON.stringify(userToSave));
        
        setUserData(userToSave);
        setIsLoggedIn(true);
        Alert.alert("Berhasil", "Selamat datang kembali!");
      } else {
        Alert.alert("Gagal Login", result.message || "Username/Password salah");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal menghubungi server. Cek koneksi internet.");
    } finally {
      setLoginLoading(false);
    }
  };

  // 3. Fungsi Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      setIsLoggedIn(false);
      setUserData(null);
      setUsername('');
      setPassword('');
      Alert.alert("Logout", "Kamu telah keluar.");
    } catch(e) {
      console.error("Gagal logout");
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary}/></View>;
  }

  // --- TAMPILAN JIKA BELUM LOGIN (FORM LOGIN) ---
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContent}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Masuk Meowlarat</Text>
          <Text style={styles.subtitle}>Kelola adopsi dan pantau kucingmu</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Username" 
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.btn, styles.btnLogin]} 
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
               <ActivityIndicator color="white" />
            ) : (
               <Text style={styles.btnText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={{color: '#666'}}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
               <Text style={styles.linkText}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- TAMPILAN JIKA SUDAH LOGIN (PROFIL USER) ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={styles.headerProfile}>
          <Image 
            source={{ uri: userData?.img_url ? `${API_URL}/uploads/${userData.img_url}` : 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <Text style={styles.userName}>{userData?.nama || userData?.username}</Text>
          <Text style={styles.userBio}>{userData?.bio || "Pecinta Kucing Sejati"}</Text>
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="paw" text="Riwayat Adopsi Saya" />
          <MenuItem icon="heart" text="Donasi Saya" />
          <MenuItem icon="settings" text="Pengaturan Akun" />
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnLogout]} onPress={handleLogout}>
          <Text style={styles.btnText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Komponen Menu Kecil
const MenuItem = ({ icon, text }: { icon: any, text: string }) => (
  <TouchableOpacity style={styles.menuItem}>
    <Ionicons name={icon} size={24} color={Colors.primary} />
    <Text style={styles.menuText}>{text}</Text>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Login Styles
  loginContent: { flex: 1, padding: 30, justifyContent: 'center' },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 20, paddingBottom: 5 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8 },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { color: Colors.primary, fontWeight: 'bold' },

  // Profile Styles
  profileContent: { padding: 20, alignItems: 'center' },
  headerProfile: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 3, borderColor: Colors.primary },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userBio: { fontSize: 14, color: '#666', marginTop: 5 },
  menuSection: { width: '100%', marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { flex: 1, fontSize: 16, marginLeft: 15, color: '#333' },

  // Buttons
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', width: '100%' },
  btnLogin: { backgroundColor: Colors.primary, marginTop: 10 },
  btnLogout: { backgroundColor: Colors.danger, marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});