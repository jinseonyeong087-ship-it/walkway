import { View, TouchableOpacity, Image, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  back?: boolean | (() => void);
  home?: boolean;
  title?: string;
  transparent?: boolean;
  centerContent?: React.ReactNode;

  rightIcon?: any;
  onRightPress?: () => void;
}

export default function AppHeader({
  back,
  home,
  title,
  transparent,
  centerContent,
  rightIcon,
  onRightPress,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (typeof back === "function") back();
    else router.back();
  };

  return (
    <View
      style={[
        styles.header,
        transparent ? styles.headerTransparent : styles.headerWhite,

        // ⭐ 헤더를 노치 아래 정확한 위치에 고정
        { top: insets.top },
      ]}
    >
      {/* 왼쪽 */}
      <View style={styles.leftGroup}>
        {!!back && (
          <TouchableOpacity style={styles.iconArea} onPress={handleBack}>
            <Image
              source={require("../assets/images/back.png")}
              style={styles.icon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 가운데 */}
      <View style={styles.centerArea}>
        {centerContent ? (
          centerContent
        ) : title ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
      </View>

      {/* 오른쪽 */}
      <View style={styles.rightGroup}>
        {rightIcon ? (
          <TouchableOpacity style={styles.iconArea} onPress={onRightPress}>
            <Image source={rightIcon} style={styles.icon} />
          </TouchableOpacity>
        ) : home ? (
          <TouchableOpacity
            style={styles.iconArea}
            onPress={() => router.push("/home")}
          >
            <Image
              source={require("../assets/images/home.png")}
              style={styles.icon}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    left: 0,
    width: "100%",
    height: 60, // ⭐ 정상 높이 유지
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 100,
  },

  headerWhite: { backgroundColor: "#fff" },
  headerTransparent: { backgroundColor: "transparent" },

  leftGroup: {
    width: 60,
    height: "100%",
    justifyContent: "center",
  },

  rightGroup: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end",
  },

  centerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconArea: {
    width: 30,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    width: 38,
    height: 38,
    resizeMode: "contain",
  },

  title: {
    fontSize: 17,
    fontFamily: "NanumBarunBold",
  },
});
