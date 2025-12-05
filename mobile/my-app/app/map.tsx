import { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

export default function MapScreen() {
  // 📌 Google Maps Key 확인용
  const GOOGLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  console.log("### GOOGLE KEY:", GOOGLE_KEY);

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("위치 권한이 필요합니다.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setLocation(current.coords);
    })();
  }, []);

  const moveToMyLocation = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateCamera({
      center: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      zoom: 17,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        initialRegion={{
          latitude: location?.latitude || 37.5665,
          longitude: location?.longitude || 126.9780,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      />

      <TouchableOpacity style={styles.myLocationButton} onPress={moveToMyLocation}>
        <Ionicons name="locate" size={28} color="#789970" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  myLocationButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
  },
});
