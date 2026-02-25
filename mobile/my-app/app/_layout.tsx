// ==============================
// _layout.tsx (수정 완료 버전)
// ==============================

import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { TextProps, LogBox } from "react-native";
import { createContext, useContext } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 글로벌 폰트 컨텍스트
const FontContext = createContext<TextProps["style"]>({ fontFamily: "NanumBarun" });

export function useGlobalFont() {
  return useContext(FontContext);
}

export default function RootLayout() {
  // ⭐ LogBox는 반드시 함수 내부에서 실행해야 오류가 안 남
  LogBox.ignoreLogs([
    "VirtualizedList",
    'Each child in a list should have a unique "key"',
  ]);

  // ⭐ 앱 전체 폰트 불러오기
  const [fontsLoaded] = useFonts({
    NanumBarun: require("../assets/fonts/NanumBarunGothic.ttf"),
    NanumBarunBold: require("../assets/fonts/NanumBarunGothicBold.ttf"),
    NanumBarunLight: require("../assets/fonts/NanumBarunGothicLight.ttf"),
    NanumBarunUltraLight: require("../assets/fonts/NanumBarunGothicUltraLight.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FontContext.Provider value={{ fontFamily: "NanumBarun" }}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </FontContext.Provider>
    </GestureHandlerRootView>
  );
}
