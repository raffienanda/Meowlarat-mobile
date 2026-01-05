import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, View, Text, FlatList, TouchableOpacity, Linking, SafeAreaView, Image, ActivityIndicator, Alert, Platform
} from 'react-native';
import { WebView } from 'react-native-webview'; 
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// IP KAMU
const API_URL = 'http://192.168.18.12:3000'; 

export default function PetPlaceScreen() {
  const [activeTab, setActiveTab] = useState('offline');
  const [places, setPlaces] = useState([]);
  const [onlineShops, setOnlineShops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const webViewRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // console.log("Fetching from:", API_URL); 
      
      const resOffline = await fetch(`${API_URL}/api/findplace`);
      const dataOffline = await resOffline.json();
      setPlaces(dataOffline);

      const resOnline = await fetch(`${API_URL}/api/findplace/online`);
      const dataOnline = await resOnline.json();
      setOnlineShops(dataOnline);
      
    } catch (err) {
      console.error('Gagal ambil data:', err);
      Alert.alert("Error Koneksi", "Pastikan IP Address benar & Backend jalan.");
    } finally {
      setLoading(false);
    }
  };

  const focusOnMap = (lat, lng) => {
    const runScript = `
      map.setView([${lat}, ${lng}], 16);
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
           var position = layer.getLatLng();
           if (Math.abs(position.lat - ${lat}) < 0.00001 && Math.abs(position.lng - ${lng}) < 0.00001) {
             layer.openPopup();
           }
        }
      });
      true;
    `;
    if (webViewRef.current) {
        webViewRef.current.injectJavaScript(runScript);
    } else {
        Alert.alert("Info", "Peta belum siap");
    }
  };

  const openLink = (url) => {
    if (url) Linking.openURL(url);
  };

  const getMapHTML = (locationsData) => {
    const placesJson = JSON.stringify(locationsData);
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
              body { margin: 0; padding: 0; }
              #map { height: 100vh; width: 100vw; }
              .leaflet-popup-content-wrapper { border-radius: 8px; font-family: sans-serif; }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
              var map = L.map('map').setView([-6.9175, 107.6191], 11);
              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  maxZoom: 19, attribution: '© OpenStreetMap'
              }).addTo(map);

              var places = ${placesJson};
              if(Array.isArray(places)) {
                places.forEach(function(place) {
                    if(place.latitude && place.longitude) {
                        var marker = L.marker([place.latitude, place.longitude]).addTo(map);
                        marker.bindPopup("<b>" + place.nama + "</b><br>" + place.category);
                    }
                });
              }
          </script>
      </body>
      </html>
    `;
  };

  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => focusOnMap(item.latitude, item.longitude)}
    >
      <Image 
        source={{ uri: `${API_URL}/uploads/img-petplace/${item.img_url}` }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      
      <View style={styles.cardContent}>
        <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
            <View style={[styles.badge, { backgroundColor: item.category === 'Vet' ? '#e3f2fd' : '#fff3e0' }]}>
                <Text style={[styles.badgeText, { color: item.category === 'Vet' ? Colors.primary : '#ef6c00' }]}>
                    {item.category}
                </Text>
            </View>
        </View>

        <Text style={styles.placeName}>{item.nama}</Text>
        <Text style={styles.placeAddress} numberOfLines={2}>{item.address}</Text>
        <Text style={styles.onlineDesc}>{item.description}</Text>
        
        <View style={styles.actionRow}>
            <View style={styles.btnSimulasi}>
                <Ionicons name="locate" size={12} color="#fff" />
                <Text style={{color:'#fff', fontSize:10, marginLeft:4}}>Lihat di Peta</Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cari Pet Place 🏥</Text>
        <Text style={styles.subtitle}>Temukan kebutuhan anabulmu</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'offline' && styles.tabBtnActive]} onPress={() => setActiveTab('offline')}>
            <Text style={[styles.tabText, activeTab === 'offline' && styles.tabTextActive]}>Vet & Petshop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'online' && styles.tabBtnActive]} onPress={() => setActiveTab('online')}>
            <Text style={[styles.tabText, activeTab === 'online' && styles.tabTextActive]}>Toko Online</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />
      ) : (
        <View style={{flex: 1}}>
            {activeTab === 'offline' && (
                <FlatList
                    data={places}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderPlaceItem}
                    ListHeaderComponent={
                        <View style={styles.mapContainer}>
                            {Platform.OS === 'web' ? (
                                // VERSI WEB: Pakai iframe
                                <iframe 
                                    srcDoc={getMapHTML(places)}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="Map"
                                />
                            ) : (
                                // VERSI MOBILE: Pakai WebView
                                <WebView
                                    ref={webViewRef}
                                    originWhitelist={['*']}
                                    source={{ html: getMapHTML(places) }}
                                    style={{ flex: 1 }}
                                    nestedScrollEnabled={true}
                                />
                            )}
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}

            {activeTab === 'online' && (
                <FlatList
                    data={onlineShops}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({item}) => (
                      <TouchableOpacity style={styles.onlineCard} onPress={() => openLink(item.link)}>
                          <View style={[styles.iconBox, { backgroundColor: item.source === 'SHOPEE' ? '#feefe0' : '#e0f2f1' }]}>
                              <Ionicons 
                                  name={item.source === 'SHOPEE' ? "bag-handle" : "cart"} 
                                  size={35} 
                                  color={item.source === 'SHOPEE' ? '#ee4d2d' : '#03ac0e'} 
                              />
                          </View>
                          <View style={{flex: 1}}>
                              <Text style={styles.onlineName}>{item.nama}</Text>
                              <Text style={styles.onlineDesc}>{item.deskripsi}</Text>
                              {item.notes && <Text style={styles.onlineNote}>Promo: {item.notes}</Text>}
                          </View>
                          <Ionicons name="open-outline" size={20} color="#ccc" />
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={{ padding: 15 }} // Ini sudah aman
                />
            )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', marginTop: 30, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.primary || '#002b5b' },
  subtitle: { color: '#666' },
  tabContainer: { flexDirection: 'row', padding: 10, justifyContent:'center', gap: 10, backgroundColor: '#fff' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#eee' },
  tabBtnActive: { backgroundColor: Colors.primary || '#002b5b' },
  tabText: { color: '#666', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  
  mapContainer: { 
    height: 400, 
    width: '100%', 
    borderBottomWidth: 1, 
    borderColor: '#ccc',
    marginBottom: 20 // 1. Tambah jarak antara Peta dan Kartu pertama
  },

  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 15, 
    elevation: 2, 
    overflow: 'hidden',
    marginHorizontal: 20 // 2. Tambah ini agar kartu tidak menempel di pinggir layar
  },
  
  cardImage: { width: 150, height: 150, backgroundColor: '#ddd' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  placeName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  placeAddress: { fontSize: 12, color: '#666', marginBottom: 8 },
  placeDesc: { fontSize: 12, color: '#555', marginBottom: 8 },
  actionRow: { flexDirection: 'row', marginTop: 5 },
  btnSimulasi: { flexDirection:'row', backgroundColor: Colors.primary || '#002b5b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems:'center' },
  
  onlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, marginHorizontal: 15 },
  iconBox: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  onlineName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  onlineDesc: { fontSize: 14, color: '#666' },
  onlineNote: { fontSize: 12, color: '#ef6c00', marginTop: 4, fontStyle: 'italic' },
});