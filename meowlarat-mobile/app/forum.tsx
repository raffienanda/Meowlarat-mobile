import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.18.12:3000'; 

export default function ForumScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const fetchThreads = async () => {
    try {
      const res = await fetch(`${API_URL}/api/forum`); // Pastikan backend punya route ini
      const data = await res.json();
      setThreads(data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchThreads(); }, []);

  const handlePost = async () => {
    const session = await AsyncStorage.getItem('user_session');
    if (!session) return Alert.alert("Login", "Silakan login dulu.");
    const user = JSON.parse(session);

    if (!newTitle || !newContent) return Alert.alert("Isi semua data");

    try {
      await fetch(`${API_URL}/api/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul: newTitle, isi: newContent, user_id: 1, username: user.username }) // Sesuaikan user_id backend
      });
      setModalVisible(false);
      setNewTitle(''); setNewContent('');
      fetchThreads();
    } catch(e) { Alert.alert("Gagal posting"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum Diskusi 💬</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={30} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={threads}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.judul}</Text>
            <Text style={styles.cardUser}>Oleh: {item.username || 'User'}</Text>
            <Text style={styles.cardBody}>{item.isi}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 15 }}
      />

      {/* Modal Tambah Thread */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buat Diskusi Baru</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
          </View>
          <View style={{padding: 20}}>
            <TextInput style={styles.input} placeholder="Judul Topik" value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={[styles.input, {height: 100}]} placeholder="Isi Diskusi..." multiline value={newContent} onChangeText={setNewContent} />
            <TouchableOpacity style={styles.btn} onPress={handlePost}><Text style={{color:'#fff', fontWeight:'bold'}}>Posting</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', alignItems: 'center', marginTop: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardUser: { fontSize: 12, color: '#888', marginBottom: 5 },
  cardBody: { color: '#555' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 15 },
  btn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, alignItems: 'center' }
});