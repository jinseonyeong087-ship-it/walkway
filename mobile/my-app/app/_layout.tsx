import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'VirtualizedList',
  'Each child in a list should have a unique "key"',
]);

import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { TextProps } from "react-native";
import { createContext, useContext } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";   // ★ 추가됨

const FontContext = createContext<TextProps["style"]>({ fontFamily: "NanumBarun" });

export function useGlobalFont() {
  return useContext(FontContext);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NanumBarun: require("../assets/fonts/NanumBarunGothic.ttf"),
    NanumBarunBold: require("../assets/fonts/NanumBarunGothicBold.ttf"),
    NanumBarunLight: require("../assets/fonts/NanumBarunGothicLight.ttf"),
    NanumBarunUltraLight: require("../assets/fonts/NanumBarunGothicUltraLight.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>        {/* ★ 반드시 추가해야 함 */}
      <FontContext.Provider value={{ fontFamily: "NanumBarun" }}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </FontContext.Provider>
    </GestureHandlerRootView>
  );
}
