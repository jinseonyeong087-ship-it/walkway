import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ViewToken } from "react-native";

import AppHeader from "../components/AppHeader";
import { API_BASE } from "../constants/api";

const { width } = Dimensions.get("window");

type NearPark = {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  cctv: number;
};

export default function HappyWalk() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [nearParks, setNearParks] = useState<NearPark[]>([]);

  /* ⭐ 현재 보이는 카드 index */
  const [currentIndex, setCurrentIndex] = useState(0);

  /* 📌 도보 계산 */
  const getWalkMinutes = (distanceKm: number) => {
    if (!distanceKm) return 0;
    const meters = distanceKm * 1000;
    const minutes = Math.round(meters / 28);
    return Math.max(1, minutes);
  };

  /* ⭐ GPS 빠른 첫 좌표 + 고정밀 보정 */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한이 필요합니다.");
        return;
      }

      // ⭐ 매우 빠른 최초 위치 (1초 미만)
      const fast = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const first = {
        latitude: fast.coords.latitude,
        longitude: fast.coords.longitude,
      };

      setUserLocation(first);
      setLoading(false);

      // 지도 이동
      mapRef.current?.animateToRegion({
        ...first,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // ⭐ 1.5초 후 고정밀 위치로 교체
      timeoutId = setTimeout(async () => {
        const high = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        const better = {
          latitude: high.coords.latitude,
          longitude: high.coords.longitude,
        };

        setUserLocation(better);

        mapRef.current?.animateToRegion({
          ...better,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }, 1500);
    })();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  /* 근처 공원 API */
  useEffect(() => {
    if (!userLocation) return;

    const fetchNear = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/routes/near?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
        );
        const data = await res.json();

        console.log("근처 공원:", data);
        setNearParks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log("❌ HappyWalk 근처 공원 로드 오류:", err);
      }
    };

    fetchNear();
  }, [userLocation]);

  /* ⭐ 현재 카드가 바뀌면 지도 위치 이동 */
  useEffect(() => {
    if (nearParks.length === 0) return;

    const park = nearParks[currentIndex];
    if (!park) return;

    mapRef.current?.animateCamera(
      {
        center: {
          latitude: park.lat,
          longitude: park.lng,
        },
        zoom: 16,
      },
      { duration: 500 }
    );
  }, [currentIndex]);

  /* ⭐ 현재 보이는 카드 감지 함수 */
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[] }) => {
      if (info.viewableItems.length > 0) {
        const index = info.viewableItems[0].index;
        if (index !== null && index !== undefined) {
          setCurrentIndex(index);
        }
      }
    }
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 60 };

  if (loading || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  /* ⭐ 현재 보여지는 공원 */
  const currentPark = nearParks[currentIndex];

  return (
    <View style={styles.container}>
      <AppHeader back transparent />

      {/* 지도 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={false}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={userLocation} pinColor="green" />

        {/* ⭐ 현재 보여지는 카드를 따라가는 공원 핀 */}
        {currentPark && (
          <Marker
            coordinate={{
              latitude: currentPark.lat,
              longitude: currentPark.lng,
            }}
            pinColor="red"
          />
        )}
      </MapView>

      {/* 내 위치 버튼 */}
      <TouchableOpacity
        style={styles.locateBtn}
        onPress={() =>
          mapRef.current?.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          })
        }
      >
        <Image
          source={require("../assets/images/locate.png")}
          style={{ width: 50, height: 50 }}
        />
      </TouchableOpacity>

      {/* 카드 */}
      <View style={styles.cardSlider}>
        <FlatList
          data={nearParks.slice(0, 5)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/TrackingWalk",
                  params: {
                    parkName: item.name,
                    lat: item.lat,
                    lng: item.lng,
                  },
                })
              }
            >
              <Text style={styles.cardTitle}>{item.name ?? "이름 없음"}</Text>

              <Text style={styles.cardRegion}>
                거리 {item.distance} km | CCTV {item.cctv ?? 0}개
              </Text>

              <View style={styles.walkRow}>
                <Image
                  source={require("../assets/images/walk.png")}
                  style={styles.walkIcon}
                />
                <Text style={styles.walkTimeText}>
                  도보 약 {getWalkMinutes(item.distance)}분
                </Text>
              </View>

              <Image
                source={require("../assets/images/arrow.png")}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          )}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  locateBtn: {
    position: "absolute",
    bottom: 170,
    right: 30,
    zIndex: 20,
  },
  cardSlider: {
    position: "absolute",
    bottom: 40,
  },
  card: {
    width: width * 0.87,
    backgroundColor: "#789970",
    marginLeft: 20,
    padding: 20,
    borderRadius: 22,
  },
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  cardRegion: {
    marginTop: 6,
    fontSize: 13,
    color: "#f2f2f2",
  },
  walkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  walkIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  walkTimeText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  arrowIcon: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 28,
    height: 28,
    opacity: 0.9,
  },
});
