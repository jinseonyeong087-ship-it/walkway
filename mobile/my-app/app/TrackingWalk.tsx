import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";
import { unstable_batchedUpdates } from "react-native";
import { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import Constants from "expo-constants";

import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

type LocationPoint = {
  latitude: number;
  longitude: number;
};

/* ============================================================
    Polyline Decode
============================================================ */
function decodePolyline(encoded: string): LocationPoint[] {
  let points: LocationPoint[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

export default function TrackingWalk() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();

  /* ============================================================
      Params
  ============================================================ */
  const parkLat = params.lat ? Number(params.lat) : null;
  const parkLng = params.lng ? Number(params.lng) : null;

  const initialParkName =
    typeof params.parkName === "string" ? params.parkName : "산책";
  const [currentParkName] = useState(initialParkName);

  /* ============================================================
      상태
  ============================================================ */
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null);

  const [steps, setSteps] = useState(0);
  const [initialSteps, setInitialSteps] = useState<number | null>(null);
  const [lastRawSteps, setLastRawSteps] = useState(0);

  const [distance, setDistance] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [showEndModal, setShowEndModal] = useState(false);

  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [routeCoords, setRouteCoords] = useState<LocationPoint[]>([]);

  /* ============================================================
      시간 포맷
  ============================================================ */
  const formatTime = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  /* ============================================================
      OSRM 경로
  ============================================================ */
  const fetchRoute = async (origin: LocationPoint) => {
    if (!parkLat || !parkLng) return;

    const url = `https://router.project-osrm.org/route/v1/foot/${origin.longitude},${origin.latitude};${parkLng},${parkLat}?overview=full&geometries=polyline`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes || json.routes.length === 0) return;

      const decoded = decodePolyline(json.routes[0].geometry);
      setRouteCoords(decoded);
    } catch (e) {
      console.log("❌ OSRM 오류:", e);
    }
  };

  /* ============================================================
      걸음수
  ============================================================ */
  useEffect(() => {
    let sub: any;

    (async () => {
      await Pedometer.getPermissionsAsync();

      sub = Pedometer.watchStepCount((result) => {
        const raw = result.steps;

        unstable_batchedUpdates(() => {
          if (initialSteps === null) {
            setInitialSteps(raw);
            setLastRawSteps(raw);
            setSteps(0);
            return;
          }

          if (raw < lastRawSteps) {
            setInitialSteps(raw);
            setLastRawSteps(raw);
            setSteps(0);
            return;
          }

          const diff = raw - initialSteps;
          setLastRawSteps(raw);

          if (diff >= 0) setSteps(diff);
        });
      });
    })();

    return () => sub && sub.remove();
  }, [initialSteps]);

  /* ============================================================
      타이머
  ============================================================ */
  useEffect(() => {
    if (showEndModal) {
      if (timerRef.current) clearInterval(timerRef.current);
      return undefined;   // ⭐ 반드시 undefined 명시
    }

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showEndModal]);

  /* ============================================================
      ⭐ GPS 빠른 로딩 적용
  ============================================================ */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // ⚡ 매우 빠른 첫 좌표
      const fast = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const first = {
        latitude: fast.coords.latitude,
        longitude: fast.coords.longitude,
      };

      setUserLocation(first);
      fetchRoute(first);

      mapRef.current?.animateToRegion({
        ...first,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // ⏳ 1.5초 뒤 고정밀 재보정
      timeoutId = setTimeout(async () => {
        const high = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        const better = {
          latitude: high.coords.latitude,
          longitude: high.coords.longitude,
        };

        setUserLocation(better);
        fetchRoute(better);

        mapRef.current?.animateToRegion({
          ...better,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }, 1500);

      // 위치 추적
      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          const now = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation(now);
        }
      );
    })();

    return () => {
      timeoutId && clearTimeout(timeoutId);
      locationWatcher.current && locationWatcher.current.remove();
    };
  }, []);

  /* ============================================================
      유저정보 확인 후 종료 버튼 행동
  ============================================================ */
  const handleConfirm = async () => {
    setShowEndModal(false);

    timerRef.current && clearInterval(timerRef.current);
    locationWatcher.current && locationWatcher.current.remove();

    const u = await AsyncStorage.getItem("healthUser");

    if (!u) {
      router.push("/home");
      return;
    }

    router.push({
      pathname: "/walkend",
      params: {
        park: currentParkName,
        steps: String(steps),
        distance: String(distance),
        duration: String(seconds),
      },
    });
  };

  if (!userLocation) return <View style={{ flex: 1 }} />;

  /* ============================================================
      UI
  ============================================================ */
  return (
    <View style={styles.container}>
      <AppHeader
        back={() => {
          if (showEndModal) return setShowEndModal(false);
          router.back();
        }}
        home
        transparent
        centerContent={
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{formatTime()}</Text>
          </View>
        }
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={userLocation} pinColor="green" />

        {parkLat && parkLng && (
          <Marker
            coordinate={{ latitude: parkLat, longitude: parkLng }}
            pinColor="red"
          />
        )}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#007AFF"
            strokeWidth={5}
          />
        )}
      </MapView>

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

      <View style={styles.bottomCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.value}>{steps}</Text>
            <Text style={styles.label}>걸음</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.value}>{Math.round(steps * 0.05)}</Text>
            <Text style={styles.label}>kcal</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.value}>{(distance / 1000).toFixed(2)}</Text>
            <Text style={styles.label}>km</Text>
          </View>
        </View>
      </View>

      <View style={[styles.stopBtnWrapper, { bottom: 25 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.stopBtn}
          onPress={() => setShowEndModal(true)}
        >
          <Text style={styles.stopBtnText}>산책종료</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showEndModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>즐거운 산책이 끝났어요!</Text>

            <View style={styles.modalRow}>
              <View style={styles.modalItem}>
                <Text style={styles.modalValue}>{steps}</Text>
                <Text style={styles.modalLabel}>걸음</Text>
              </View>

              <View style={styles.modalItem}>
                <Text style={styles.modalValue}>
                  {Math.round(steps * 0.05)}
                </Text>
                <Text style={styles.modalLabel}>kcal</Text>
              </View>

              <View style={styles.modalItem}>
                <Text style={styles.modalValue}>
                  {(distance / 1000).toFixed(2)}
                </Text>
                <Text style={styles.modalLabel}>km</Text>
              </View>

              <View style={styles.modalItem}>
                <Text style={styles.modalValue}>{formatTime()}</Text>
                <Text style={styles.modalLabel}>시간</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleConfirm}>
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ============================================================
    스타일 (수정 없음)
============================================================ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  locateBtn: {
    position: "absolute",
    bottom: 210,
    right: 25,
    zIndex: 30,
  },
  timeBox: {
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 25,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: { fontSize: 16, fontWeight: "600", color: "#333" },

  bottomCard: {
    position: "absolute",
    bottom: 110,
    width: "92%",
    marginHorizontal: "4%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  infoRow: {
    width: "75%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  infoBox: { alignItems: "center" },
  value: { fontSize: 22, fontWeight: "700", color: "#333" },
  label: { fontSize: 13, color: "#777", marginTop: 3 },

  stopBtnWrapper: {
    position: "absolute",
    width: "80%",
    marginHorizontal: "10%",
    alignItems: "center",
  },

  stopBtn: {
    backgroundColor: "#789970",
    paddingVertical: 10,
    borderRadius: 30,
    paddingHorizontal: 20,
  },

  stopBtnText: { color: "#fff", fontSize: 17, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    paddingVertical: 25,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
  },

  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15 },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: 20,
  },

  modalItem: { alignItems: "center" },
  modalValue: { fontSize: 18, fontWeight: "700", color: "#333" },
  modalLabel: { fontSize: 12, color: "#777", marginTop: 3 },

  modalButton: {
    backgroundColor: "#789970",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },

  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
