import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Keyboard,
  ActionSheetIOS,
} from "react-native";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Modal } from "react-native";

import AppHeader from "../components/AppHeader";
import { API_BASE } from "../constants/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";   // ⭐ 추가됨

export default function WalkEnd() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();   // ⭐ 추가됨

  /* ============================================================
      ⭐ TrackingWalk → WalkEnd로 넘어온 실제 값 처리
  ============================================================ */
  const parkName = Array.isArray(params.park) ? params.park[0] : params.park || "";

  const steps = Number(Array.isArray(params.steps) ? params.steps[0] : params.steps || 0);
  const distance = Number(Array.isArray(params.distance) ? params.distance[0] : params.distance || 0);
  const durationSeconds = Number(Array.isArray(params.duration) ? params.duration[0] : params.duration || 0);

  const kcal = Math.round(steps * 0.05);
  const distanceKm = (distance / 1000).toFixed(2);

  const formatTime = (sec: number) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const durationText = formatTime(durationSeconds);

  /* ============================================================
      ⭐ 메모 + 사진
  ============================================================ */
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  /* ⭐ 오늘 날짜 (로컬 기준 정확) */
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  /* ============================================================
      ⭐ WalkLog 저장
  ============================================================ */
  const saveWalkLog = async () => {
    try {
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(now.getDate()).padStart(2, "0")}`;

      const payload = {
        date: today,
        steps: steps,
        kcal: kcal,
        distance: Number(distanceKm),
        duration: durationText,
        memo: note,
        photo: photo || "",
        park: parkName,
      };

      console.log("📤 보내는 데이터:", payload);

      const res = await fetch(`${API_BASE}/api/walklog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📥 저장 결과:", data);

      if (data.success) {
        router.push({
          pathname: "/HistoryWalk",
          params: {
            park: parkName,
            date: today,
            memo: note,
            photo: photo || "",
          },
        });
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      console.log("❌ 저장 오류:", error);
      alert("네트워크 오류가 발생했습니다!");
    }
  };

  /* ============================================================
      📸 사진 메뉴
  ============================================================ */
  const openImagePicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["취소", "사진 촬영", "갤러리에서 선택"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) takePhoto();
          if (index === 2) pickFromGallery();
        }
      );
    } else {
      setShowMenu(true);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert("카메라 권한을 허용해주세요!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert("갤러리 권한을 허용해주세요!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });

    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  /* ============================================================
      UI
  ============================================================ */
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>

      {/* ⭐⭐⭐ 상태바 높이만큼 흰색 배경 추가 */}
      <View style={{ height: insets.top, backgroundColor: "#fff" }} />

      <AppHeader back={() => router.push("/TrackingWalk")} home />

      <KeyboardAwareScrollView
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === "ios" ? 60 : 120}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 60,     // 기존 120 → 40으로 안정적으로 수정
          paddingBottom: 250,
          alignItems: "center",
        }}
      >
        <Text style={styles.title}>즐거운 산책이 끝났어요!</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.value}>{steps}</Text>
            <Text style={styles.label}>걸음</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.value}>{kcal}</Text>
            <Text style={styles.label}>kcal</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.value}>{distanceKm}</Text>
            <Text style={styles.label}>km</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.value}>{durationText}</Text>
            <Text style={styles.label}>소요시간</Text>
          </View>
        </View>

        {/* 기록 카드 */}
        <View style={styles.card}>
          <Text style={styles.park}>{parkName}</Text>
          <Text style={styles.date}>{localDate}</Text>

          <TouchableOpacity style={styles.photoArea} onPress={openImagePicker}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={styles.emptyPhoto}>
                <Image
                  source={require("../assets/images/camera.png")}
                  style={{ width: 30, height: 30, opacity: 0.6 }}
                />
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                autoFocus
                multiline
                placeholder="오늘의 산책 기록을 적어보세요!"
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity
                style={styles.floatingDoneBtn}
                onPress={() => {
                  setIsEditing(false);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.floatingDoneText}>완료</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.noteText}>
                {note ? note : "탭하여 오늘의 소중한 산책을 기록해보세요!"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* ⭐ Android 메뉴 */}
      <Modal transparent visible={showMenu} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                setShowMenu(false);
                takePhoto();
              }}
            >
              <Text style={styles.menuText}>사진 촬영</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                setShowMenu(false);
                pickFromGallery();
              }}
            >
              <Text style={styles.menuText}>갤러리에서 선택</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuBtn, { marginTop: 5, backgroundColor: "#fff" }]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[styles.menuText, { color: "#FF3B30" }]}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ⭐ 하단 확인 버튼 */}
      <TouchableOpacity style={styles.confirmBtn} onPress={saveWalkLog}>
        <Text style={styles.confirmText}>확인</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ⭐ 스타일 절대 수정 안 함 */
const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 25,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    marginBottom: 50,
  },

  infoBox: { alignItems: "center" },
  value: { fontSize: 20, fontWeight: "700" },
  label: { fontSize: 12, color: "#666", marginTop: 3 },

  card: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  park: { fontSize: 15, fontWeight: "700" },
  date: { fontSize: 12, color: "#777", marginBottom: 12 },

  photoArea: {
    width: "100%",
    height: 300,
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyPhoto: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },

  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  inputWrapper: {
    width: "100%",
    marginTop: 10,
    position: "relative",
    minHeight: 80,
  },

  input: {
    width: "100%",
    padding: 12,
    paddingRight: 60,
    fontSize: 14,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },

  floatingDoneBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  floatingDoneText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#789970",
  },

  noteText: {
    fontSize: 13,
    color: "#777",
    marginTop: 20,
    textAlign: "center",
  },

  confirmBtn: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingVertical: 20,
    backgroundColor: "#789970",
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingBottom: 9,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  menuBox: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
    elevation: 15,
  },

  menuBtn: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
  },

  menuText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
});
