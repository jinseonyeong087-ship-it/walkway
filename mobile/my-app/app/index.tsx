export const unstable_settings = {
  initialRouteName: "home",
};
import { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.centerBox}>
        <Image
          source={require("../assets/images/splash.png")}
          style={styles.logo}
        />
        <Text style={styles.subtitle}>워크웨이와 함께 걸어요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 0,              // 혹시 모를 여백 제거
    paddingBottom: 0,
    justifyContent: "center",   // 전체를 중앙에
    alignItems: "center",
  },

  centerBox: {
    alignItems: "center",        // 여기에서 로고+문구 정렬
    justifyContent: "center",
  },

  logo: {
    width: 160,
    height: 160,
    resizeMode: "contain",
    marginBottom: -30,
  },

  subtitle: {
    fontSize: 10,
    color: "#A1A1A1",
    fontFamily: "NanumBarunGothicBold",
  },
});
