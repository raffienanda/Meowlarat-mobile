import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, TouchableOpacity, 
  Modal, Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { cat } from '../types'; // Menggunakan interface huruf kecil sesuai types.ts

// ⚠️ GANTI DENGAN IP LAPTOP KAMU
const API_URL = 'http://192.168.18.12:3000';  

export default function AdopsiScreen() {
  const [cats, setCats] = useState<cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<cat | null>(null);

  const fetchCats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cats`);
      const data = await response.json();
      setCats(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memuat data kucing. Cek koneksi internet/IP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleAdopt = async () => {
    if (!selectedCat) return;
    const dummyUser = "budi_user"; // Hardcode sementara

    try {
        const response = await fetch(`${API_URL}/api/cats/adopt/${selectedCat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: dummyUser }),
        });

        if (response.ok) {
            Alert.alert("Berhasil", `Permintaan adopsi untuk ${selectedCat.nama} terkirim!`);
            setModalVisible(false);
            fetchCats(); 
        } else {
            const err = await response.json();
            Alert.alert("Gagal", err.message || "Terjadi kesalahan");
        }
    } catch (error) {
        Alert.alert("Error", "Gagal menghubungi server");
    }
  };

  const renderCatItem = ({ item }: { item: cat }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedCat(item); setModalVisible(true); }}>
      <Image 
        source={{ uri: `${API_URL}/uploads/img-lapor/${item.img_url}` }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle}>{item.nama}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kucing Menunggu Kamu</Text>
        <Text style={styles.headerSubtitle}>Temukan teman barumu di sini</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cats}
          renderItem={renderCatItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchCats}
        />
      )}

      {/* MODAL DETAIL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCat && (
              <>
                <Image source={{ uri: `${API_URL}/uploads/img-lapor/${selectedCat.img_url}` }} style={styles.modalImage} />
                <Text style={styles.modalName}>{selectedCat.nama}</Text>
                
                <View style={styles.infoRow}>
                    <View style={styles.badge}><Text>{selectedCat.age}</Text></View>
                    <View style={styles.badge}><Text>{selectedCat.gender}</Text></View>
                </View>
                
                <Text style={styles.bodyText}>Ras: {selectedCat.ras}</Text>
                <Text style={styles.bodyText}>Karakter: {selectedCat.karakteristik}</Text>
                <Text style={[styles.bodyText, { color: selectedCat.isVaccinated ? Colors.success : Colors.danger }]}>
                    {selectedCat.isVaccinated ? 'Sudah Vaksin' : 'Belum Vaksin'}
                </Text>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                        <Text style={styles.btnCancelText}>Tutup</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAdopt} onPress={handleAdopt}>
                        <Text style={styles.btnAdoptText}>Ajukan</Text>
                    </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  listContent: { padding: 10 },
  card: { flex: 1, backgroundColor: Colors.white, margin: 8, borderRadius: 16, overflow: 'hidden', elevation: 3, height: 220 },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 119, 194, 0.8)', padding: 10, alignItems: 'center' },
  cardTitle: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  modalImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16 },
  modalName: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
  badge: { backgroundColor: '#e3f2fd', padding: 8, borderRadius: 8 },
  bodyText: { fontSize: 16, marginBottom: 5, color: '#333' },
  actionButtons: { flexDirection: 'row', marginTop: 20, gap: 10 },
  btnCancel: { flex: 1, padding: 12, borderWidth: 1, borderColor: Colors.danger, borderRadius: 10, alignItems: 'center' },
  btnCancelText: { color: Colors.danger, fontWeight: 'bold' },
  btnAdopt: { flex: 2, padding: 12, backgroundColor: Colors.primary, borderRadius: 10, alignItems: 'center' },
  btnAdoptText: { color: Colors.white, fontWeight: 'bold' },
});