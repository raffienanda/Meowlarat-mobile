import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Image, Alert, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/Config';

export default function ProfilScreen() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const checkLoginStatus = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_session');
      if (jsonValue != null) {
        const session = JSON.parse(jsonValue);
        let token = session.token;
        if (token && token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1);
        }

        setUserData(session.user || session); 
        setIsLoggedIn(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const newData = await response.json();
            if (response.ok) {
                setUserData(newData); 
                const newSession = { token: token, user: newData };
                await AsyncStorage.setItem('user_session', JSON.stringify(newSession));
                if (newData.role) await AsyncStorage.setItem('role', newData.role);
            }
        } catch (err) {
            console.log("Background fetch error");
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch(e) {
      console.error("Login Check Error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) return Alert.alert("Error", "Isi semua data");
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (response.ok) {
        const sessionData = { token: result.token, user: result.user };
        await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
        await AsyncStorage.setItem('role', result.user.role);

        setUserData(sessionData.user);
        setIsLoggedIn(true);
        Alert.alert("Berhasil", "Selamat datang kembali!");

        if (result.user.role === 'ADMIN') {
           router.replace('/admin'); 
        }
      } else {
        Alert.alert("Gagal", result.message || "Login gagal");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal koneksi server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      await AsyncStorage.removeItem('role'); 
      setIsLoggedIn(false);
      setUserData(null);
      setUsername('');
      setPassword('');
      Alert.alert("Logout", "Kamu telah keluar.");
    } catch(e) {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary}/></View>;

  // --- TAMPILAN BELUM LOGIN ---
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
                placeholderTextColor="#999"  
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
                placeholderTextColor="#999" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
            />
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/forgot-password')} 
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}
          >
            <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Lupa Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnLogin]} onPress={handleLogin} disabled={loginLoading}>
            {loginLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Masuk</Text>}
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

  // --- TAMPILAN SUDAH LOGIN ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.profileContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); checkLoginStatus(); }} />
        }
      >
        <View style={styles.headerProfile}>
          <Image 
            source={{ uri: userData?.img_url && userData.img_url !== 'default.png' 
                ? `${API_URL}/uploads/img-profil/${userData.img_url}` 
                : 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <Text style={styles.userName}>{userData?.nama || userData?.username}</Text>
          <Text style={styles.userBio}>{userData?.bio || "Pecinta Kucing Sejati"}</Text>
          
          {userData?.role === 'ADMIN' && (
            <View style={{ backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 5 }}>
                <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 12 }}>ADMINISTRATOR</Text>
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          {userData?.role === 'ADMIN' && (
             <MenuItem 
               icon="shield-checkmark" 
               text="Dashboard Admin" 
               onPress={() => router.push('/admin')} 
             />
          )}

          <MenuItem 
            icon="paw" 
            text="Riwayat Adopsi Saya" 
            onPress={() => router.push('/riwayat')} 
          />

          {/* MENU BARU: RIWAYAT LAPORAN */}
          <MenuItem 
            icon="document-text" 
            text="Riwayat Laporan Saya" 
            onPress={() => router.push('/lapor')} 
          />

          <MenuItem icon="heart" text="Donasi Saya" onPress={() => router.push('/donasi')} />
          
          <MenuItem 
            icon="settings" 
            text="Pengaturan Akun" 
            onPress={() => router.push('/edit-profile')} 
          />
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnLogout]} onPress={handleLogout}>
          <Text style={styles.btnText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuItem = ({ icon, text, onPress }: { icon: any, text: string, onPress?: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={Colors.primary} />
    <Text style={styles.menuText}>{text}</Text>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: { flex: 1, padding: 30, justifyContent: 'center' },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 20, paddingBottom: 5 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, color: '#333' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { color: Colors.primary, fontWeight: 'bold' },
  profileContent: { padding: 20, alignItems: 'center' },
  headerProfile: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 3, borderColor: Colors.primary },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userBio: { fontSize: 14, color: '#666', marginTop: 5 },
  menuSection: { width: '100%', marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { flex: 1, fontSize: 16, marginLeft: 15, color: '#333' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', width: '100%' },
  btnLogin: { backgroundColor: Colors.primary, marginTop: 10 },
  btnLogout: { backgroundColor: '#ef5350', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});