import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, SafeAreaView } from 'react-native';
import { Colors } from '../constants/Colors';

const API_URL = 'http://192.168.18.12:3000';

export default function ArtikelScreen() {
  const [artikel, setArtikel] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/artikel`)
      .then(res => res.json())
      .then(data => setArtikel(data))
      .catch(console.error);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Artikel & Edukasi 📚</Text>
      </View>
      <FlatList
        data={artikel}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: `${API_URL}/uploads/img-artikel/${item.img_url}` }} style={styles.image} />
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.judul}</Text>
              <Text numberOfLines={2} style={styles.cardDesc}>{item.isi}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 15 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, borderBottomWidth: 1, borderColor: '#eee', marginTop: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  card: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', elevation: 3, padding: 10 },
  image: { width: 100, height: 100, borderRadius: 8, marginRight: 10 },
  textContainer: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { fontSize: 12, color: '#666' }
});