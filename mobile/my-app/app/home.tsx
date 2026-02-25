import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef } from "react";
import CalendarSection from "./CalendarSection";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleHealthWalk = async () => {
    const saved = await AsyncStorage.getItem("healthUser");
    if (saved) router.push("/healthwalk2");
    else router.push("/healthwalk");
  };

  /* 🔥 스크롤 → 달력 페이지로 이동 */
  const scrollToCalendar = () => {
    scrollRef.current?.scrollTo({
      y: height, // ← 홈 화면 높이만큼 아래가 달력 시작점
      animated: true,
    });
  };

  const onScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    fadeAnim.setValue(Math.max(0, 1 - y / 200));
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#fff" }}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
    >
      {/* ================================
          홈 화면 (전체 화면 고정)
         ================================ */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            minHeight: height, // 🔥 홈 화면 전체를 한 화면으로 고정
          },
        ]}
      >
        <Text style={styles.title}>
          오늘도 행복하게{"\n"}산책 해볼까요?
        </Text>

        <Image
          source={require("../assets/images/home-walking.png")}
          style={styles.mainImage}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/happywalk")}
          >
            <Text style={styles.buttonText}>즐거운 산책하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 18 }]}
            onPress={handleHealthWalk}
          >
            <Text style={styles.buttonText}>건강한 산책하기</Text>
          </TouchableOpacity>
        </View>

        {/* ↓↓↓ 스크롤 아이콘 (달력 이동 버튼) */}
        <TouchableOpacity onPress={scrollToCalendar}>
          <Image
            source={require("../assets/images/scroll.png")}
            style={styles.scrollIcon}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ================================
          캘린더 화면 (전체 화면 고정)
         ================================ */}
      <View
        style={{
          minHeight: height, // 🔥 달력도 전체 화면으로 고정
          justifyContent: "flex-start",
        }}
      >
        <CalendarSection />
      </View>
    </ScrollView>
  );
}

/* ============================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingBottom: 40,
    alignItems: "center",
  },

  title: {
    position: "absolute",
    top: 150,
    left: 24,
    fontSize: 22,
    fontFamily: "NanumBarun",
    color: "#333",
    lineHeight: 32,
  },

  mainImage: {
    marginTop: 180,
    marginLeft: 40,
    width: width,
    height: width * 0.9,
    resizeMode: "contain",
  },

  buttonContainer: {
    marginTop: 65,
    alignItems: "center",
  },

  button: {
    width: width * 0.8,
    paddingVertical: 18,
    backgroundColor: "#789970",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "NanumBarunBold",
  },

  scrollIcon: {
    width: 35,
    height: 35,
    marginTop: 50,
    resizeMode: "contain",
  },
});
