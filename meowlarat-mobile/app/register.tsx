import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    Image, Alert, ActivityIndicator, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// ⚠️ GANTI DENGAN IP LAPTOP KAMU
const API_URL = 'http://192.168.18.12:3000';

export default function RegisterScreen() {
    const router = useRouter();

    // State Form
    const [form, setForm] = useState({
        nama: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        // 1. Validasi Input Dasar
        if (!form.nama || !form.username || !form.email || !form.password || !form.phone) {
            return Alert.alert("Peringatan", "Semua kolom wajib diisi!");
        }

        if (form.password !== form.confirmPassword) {
            return Alert.alert("Error", "Konfirmasi password tidak cocok.");
        }

        setLoading(true);

        try {
            // 2. Kirim Data ke Backend
            // Kita kirim default value untuk bio dan img_url agar database tidak menolak
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nama: form.nama,
                    username: form.username,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    bio: "Pengguna Baru Meowlarat", // Default value
                    img_url: "default.png"           // Default value
                }),
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert("Sukses", "Akun berhasil dibuat! Silakan login.", [
                    { text: "Login Sekarang", onPress: () => router.back() } // Kembali ke halaman Login
                ]);
            } else {
                // Tampilkan pesan error dari backend (misal: Username sudah ada)
                Alert.alert("Gagal Daftar", result.message || "Terjadi kesalahan.");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Gagal menghubungi server. Cek koneksi internet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Image source={require('../assets/images/react-logo.png')} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.title}>Daftar Akun Baru</Text>
                        <Text style={styles.subtitle}>Bergabunglah dengan komunitas pecinta kucing</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>

                        <InputItem
                            icon="person-outline"
                            placeholder="Nama Lengkap"
                            value={form.nama}
                            onChangeText={(t: string) => setForm({ ...form, nama: t })}
                        />

                        <InputItem
                            icon="at-outline"
                            placeholder="Username (unik)"
                            value={form.username}
                            onChangeText={(t: string) => setForm({ ...form, username: t })}
                            autoCapitalize="none"
                        />

                        <InputItem
                            icon="mail-outline"
                            placeholder="Email"
                            value={form.email}
                            onChangeText={(t: string) => setForm({ ...form, email: t })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <InputItem
                            icon="call-outline"
                            placeholder="Nomor WhatsApp"
                            value={form.phone}
                            onChangeText={(t: string) => setForm({ ...form, phone: t })}
                            keyboardType="phone-pad"
                        />

                        <InputItem
                            icon="lock-closed-outline"
                            placeholder="Password"
                            value={form.password}
                            onChangeText={(t: string) => setForm({ ...form, password: t })}
                            secureTextEntry
                        />

                        <InputItem
                            icon="lock-closed-outline"
                            placeholder="Ulangi Password"
                            value={form.confirmPassword}
                            onChangeText={(t: string) => setForm({ ...form, confirmPassword: t })}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.btnRegister}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.btnText}>Daftar Sekarang</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.loginRedirect}>
                            <Text style={{ color: '#666' }}>Sudah punya akun? </Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.linkText}>Masuk di sini</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Komponen Input Kecil biar rapi
const InputItem = ({ icon, ...props }: any) => (
    <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#666" style={styles.icon} />
        <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { padding: 24, paddingBottom: 50 },
    header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    logo: { width: 80, height: 80, marginBottom: 15 },
    title: { fontSize: 26, fontWeight: 'bold', color: Colors.primary, marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },

    formSection: { width: '100%' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 20,
        paddingBottom: 8
    },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 5 },

    btnRegister: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4
    },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    loginRedirect: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25
    },
    linkText: { color: Colors.primary, fontWeight: 'bold' }
});