import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Linking, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.18.12:3000';

export default function PetPlaceScreen() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/findplace`) // Pastikan route ini benar di backend (mungkin perlu disesuaikan dengan /petplace)
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.log('Backend mungkin belum ada route /findplace, cek server.js'));
  }, []);

  const openMap = (alamat: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alamat)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cari Pet Place 🏥</Text>
        <Text style={styles.subtitle}>Temukan Vet, Petshop, & Shelter terdekat</Text>
      </View>
      <FlatList
        data={places}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20}}>Data belum tersedia.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openMap(item.alamat)}>
            <View style={styles.iconBox}>
                <Ionicons name="location" size={24} color="#fff" />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.placeName}>{item.nama}</Text>
                <Text style={styles.placeAddress}>{item.alamat}</Text>
                <Text style={styles.placeType}>{item.kategori || 'Pet Place'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 15 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', marginTop: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  subtitle: { color: '#666' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  iconBox: { width: 50, height: 50, backgroundColor: Colors.primary, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  placeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  placeAddress: { fontSize: 12, color: '#666', marginVertical: 2 },
  placeType: { fontSize: 10, color: Colors.primary, fontWeight: 'bold', textTransform: 'uppercase' }
});