import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
  Animated,
  ViewToken,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import AppHeader from "../components/AppHeader";
import { API_BASE } from "../constants/api";

/*************************************************
 * 1) 타입 선언 (가장 위)
 *************************************************/
type LatLng = {
  latitude: number;
  longitude: number;
};

const { width } = Dimensions.get("window");
const mainColor = "#789970";

/*************************************************
 * ⭐ AutoModal (팝업 컴포넌트)
 *************************************************/
const AutoModal = ({ visible, message, onClose }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const processMessage = (text: string) => {
    if (!text) return "";
    return text
      .split(" ")
      .map((w) => (w.length > 5 ? w.split("").join("\u200B") : w))
      .join(" ");
  };

  const getFontSize = () => {
    if (!message) return 18;
    if (message.length > 60) return 15;
    if (message.length > 45) return 16;
    if (message.length > 30) return 17;
    return 18;
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <Animated.View style={[modalStyles.modalBox, { opacity, transform: [{ scale }] }]}>
        <Text
          style={{
            fontSize: getFontSize(),
            lineHeight: getFontSize() * 1.4,
            color: "#333",
            textAlign: "center",
            marginBottom: 25,
          }}
        >
          {processMessage(message)}
        </Text>

        <TouchableOpacity style={modalStyles.button} onPress={onClose}>
          <Text style={modalStyles.buttonText}>확인</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/*************************************************
 *  ⭐ HealthWalk2 화면
 *************************************************/
export default function HealthWalk2() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [selectedPark, setSelectedPark] = useState<any>(null);

  const [nearParks, setNearParks] = useState<any[]>([]);

  /* ⭐ 현재 보이는 카드 index */
  const [currentIndex, setCurrentIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setPopupVisible(false);
    }, [])
  );

  /*************************************************
   *  사용자 정보 로드
   *************************************************/
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("healthUser");
      if (saved) setUser(JSON.parse(saved));
    })();
  }, []);

  /*************************************************
   *  GPS
   *************************************************/
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      setLoading(false);
    })();
  }, []);

  /*************************************************
   * 근처 공원 가져오기
   *************************************************/
  useEffect(() => {
    if (!userLocation) return;

    const fetchNear = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/routes/near?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
        );
        const data = await res.json();

        setNearParks(data.slice(0, 5));
      } catch (err) {
        console.log("❌ 근처 공원 오류:", err);
      }
    };

    fetchNear();
  }, [userLocation]);

  /*************************************************
   * ⭐ 도보 시간 계산
   *************************************************/
  const getWalkMinutes = (distanceKm: number) => {
    const meters = distanceKm * 1000;
    return Math.max(1, Math.round(meters / 28));
  };

  /*************************************************
   * ⭐ 추천 팝업 열기
   *************************************************/
  const openPopup = () => {
    if (!user) return;

    const h = user.height / 100;
    const bmi = user.weight / (h * h);

    let minutes = 45;
    if (bmi < 18.5) minutes = 30;
    else if (bmi < 25) minutes = 45;
    else if (bmi < 30) minutes = 60;
    else minutes = 75;

    if (user.age >= 50) minutes += 5;
    if (user.age >= 60) minutes += 10;
    if (user.gender === "male") minutes -= 5;

    const msgs = [
      `${minutes}분 산책은 오늘 몸을 가볍게 해줘요.`,
      `${minutes}분 걷기만 해도 컨디션이 좋아져요.`,
      `${minutes}분 걷기, 지금 가장 좋은 활동이에요.`,
      `${minutes}분 정도면 충분한 운동 효과가 있어요.`,
      `${user?.name}님께는 ${minutes}분 산책이 잘 맞아요.`,
    ];

    setPopupMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    setPopupVisible(true);
  };

  /*************************************************
   * ⭐ 팝업 확인 → TrackingWalk 이동
   *************************************************/
  const goTracking = () => {
    if (!selectedPark) return;

    setPopupVisible(false);
    router.push({
      pathname: "/TrackingWalk",
      params: {
        parkName: selectedPark.name,
        lat: selectedPark.lat,
        lng: selectedPark.lng,
      },
    });
  };

  /*************************************************
   * ⭐ 카드 슬라이드 감지
   *************************************************/
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[] }) => {
      if (info.viewableItems.length > 0) {
        const idx = info.viewableItems[0].index;
        if (idx !== null && idx !== undefined) {
          setCurrentIndex(idx);
        }
      }
    }
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 60 };

  /*************************************************
   * ⭐ currentIndex 바뀌면 지도 이동
   *************************************************/
  useEffect(() => {
    if (!nearParks || nearParks.length === 0) return;

    const park = nearParks[currentIndex];
    if (!park) return;

    mapRef.current?.animateCamera(
      {
        center: { latitude: park.lat, longitude: park.lng },
        zoom: 16,
      },
      { duration: 500 }
    );
  }, [currentIndex]);

  const currentPark = nearParks[currentIndex];

  /*************************************************
   *  UI 렌더링
   *************************************************/
  if (loading || !userLocation) {
    return (
      <View style={styles.loadingArea}>
        <ActivityIndicator size="large" color={mainColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        back
        transparent
        rightIcon={require("../assets/images/user.png")}
        onRightPress={() => router.push("/healthwalk")}
      />

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

        {/* ⭐ 카드 슬라이드에 따라 이동하는 공원 핀 */}
        {currentPark && (
          <Marker
            coordinate={{ latitude: currentPark.lat, longitude: currentPark.lng }}
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
        <Image source={require("../assets/images/locate.png")} style={{ width: 50, height: 50 }} />
      </TouchableOpacity>

      {/* 공원 카드 */}
      <View style={styles.cardSlider}>
        <FlatList
          data={nearParks}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const walkMin = getWalkMinutes(item.distance);

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedPark(item);
                  openPopup();
                }}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>

                <Text style={styles.cardRegion}>
                  거리: {item.distance} km | CCTV {item.cctv}
                </Text>

                <View style={styles.walkRow}>
                  <Image source={require("../assets/images/walk.png")} style={styles.walkIcon} />
                  <Text style={styles.walkTime}>도보 약 {walkMin}분</Text>
                </View>

                <Image source={require("../assets/images/arrow.png")} style={styles.arrowIcon} />
              </TouchableOpacity>
            );
          }}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      {/* 팝업 */}
      <AutoModal visible={popupVisible} message={popupMessage} onClose={goTracking} />
    </View>
  );
}

/*************************************************
 * styles (기존 그대로)
 *************************************************/


const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  locateBtn: {
    position: "absolute",
    bottom: 170,
    right: 30,
    zIndex: 20,
  },
  cardSlider: { position: "absolute", bottom: 40 },
  card: {
    width: width * 0.87,
    backgroundColor: mainColor,
    marginLeft: 20,
    padding: 20,
    borderRadius: 22,
  },
  cardTitle: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  cardRegion: { fontSize: 13, color: "#f0f0f0", marginTop: 5 },
  walkRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  walkIcon: { width: 20, height: 20, marginRight: 6 },
  walkTime: { color: "#fff", fontSize: 14, fontWeight: "600" },
  arrowIcon: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 28,
    height: 28,
    opacity: 0.9,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    maxWidth: "80%",
    backgroundColor: "#fff",
    paddingVertical: 32,
    paddingHorizontal: 26,
    borderRadius: 20,
    alignItems: "center",
  },
  button: {
    backgroundColor: mainColor,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
