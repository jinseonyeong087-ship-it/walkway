import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";

import AppHeader from "../components/AppHeader";
import { API_BASE } from "../constants/api";

export default function WalkDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const normalize = (v: any) => (Array.isArray(v) ? v[0] : v || "");

  const initialId = normalize(params._id);
  const initialPark = normalize(params.park);
  const date = normalize(params.date);

  const [id, setId] = useState(initialId);
  const [park, setPark] = useState(initialPark);

  const [steps, setSteps] = useState("0");
  const [kcal, setKcal] = useState("0");
  const [distance, setDistance] = useState("0");
  const [duration, setDuration] = useState("00:00:00"); // ← ⭐ duration 초기값 통일

  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState("");

  const [isEdit, setIsEdit] = useState(false);

  /* -------------------------------------------------------
     📌 _id 없으면 날짜 기반 조회
  --------------------------------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        let log;

        if (!initialId) {
          const res = await fetch(`${API_BASE}/api/walklog/${date}`);
          const arr = await res.json();
          log = arr[0];
          if (!log) return;

          setId(log._id);
          setPark(log.park);
        } else {
          const res = await fetch(`${API_BASE}/api/walklog/id/${initialId}`);
          log = await res.json();
          setPark(log.park);
        }

        setNote(log.memo || "");
        setPhoto(log.photo || "");
        setSteps(String(log.steps || "0"));
        setKcal(String(log.kcal || "0"));
        setDistance(String(log.distance || "0"));

        // ⭐ duration 보정: "0:12:5" → "00:12:05"
        const fix = (t: string) => {
          if (!t) return "00:00:00";
          const parts = t.split(":");
          if (parts.length === 3) {
            return parts
              .map((p) => String(p).padStart(2, "0"))
              .join(":");
          }
          if (parts.length === 2) {
            return `00:${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
          }
          return "00:00:00";
        };
        setDuration(fix(log.duration));

      } catch (err) {
        console.log("❌ WalkDetail 조회 오류:", err);
      }
    };

    loadData();
  }, [initialId, date]);

  /* -------------------------------------------------------
     📌 수정
  --------------------------------------------------------- */
  const handleSave = async () => {
    try {
      if (!id) return;

      const payload = { memo: note, photo };

      const res = await fetch(`${API_BASE}/api/walklog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("✏️ 수정 결과:", json);

      if (json.success) {
        setIsEdit(false);
      }
    } catch (err) {
      console.log("❌ 수정 오류:", err);
    }
  };

  /* -------------------------------------------------------
     📌 삭제
  --------------------------------------------------------- */
  const handleDelete = async () => {
    try {
      if (!id) return;

      const res = await fetch(`${API_BASE}/api/walklog/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      console.log("🗑 삭제 결과:", json);

      if (json.success) {
        router.push("/HistoryWalk");
      }
    } catch (err) {
      console.log("❌ 삭제 오류:", err);
    }
  };

  /* -------------------------------------------------------
     📸 사진 기능
  --------------------------------------------------------- */

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert("카메라 권한을 허용해야 촬영할 수 있습니다.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const deletePhotoBtn = () => setPhoto("");

  /* ⭐ 사진 메뉴 (Android 수정됨) */
  const takePhotoMenu = () => {
    if (Platform.OS === "ios") {
      const options = ["취소", "갤러리에서 선택", "사진 촬영", "사진 삭제"];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (index) => {
          if (index === 1) pickFromGallery();
          if (index === 2) takePhoto();
          if (index === 3) deletePhotoBtn();
        }
      );
    } else {
      // ⭐ Android 메뉴 추가
      Alert.alert("사진 설정", "", [
        { text: "갤러리에서 선택", onPress: pickFromGallery },
        { text: "사진 촬영", onPress: takePhoto },
        { text: "사진 삭제", onPress: deletePhotoBtn, style: "destructive" },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  return (
    <>
      <AppHeader back home />

      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
              contentContainerStyle={{ paddingBottom: 160, paddingTop: 65 }}
            >
              <Text style={styles.parkName}>{park}</Text>

              <View style={styles.bigStatBox}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{steps}</Text>
                  <Text style={styles.statLabel}>걸음</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{kcal}</Text>
                  <Text style={styles.statLabel}>kcal</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{distance} km</Text>
                  <Text style={styles.statLabel}>거리</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{duration}</Text>
                  <Text style={styles.statLabel}>소요시간</Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={!isEdit}
                onPress={() => isEdit && takePhotoMenu()}
              >
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.noPhoto]}>
                    <Text style={{ color: "#999" }}>사진 없음</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.date}>{date}</Text>

              {isEdit ? (
                <TextInput
                  style={styles.input}
                  multiline
                  value={note}
                  onChangeText={setNote}
                />
              ) : (
                <Text style={styles.note}>{note}</Text>
              )}
            </ScrollView>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (isEdit) handleSave();
                  else setIsEdit(true);
                }}
              >
                <Image
                  source={require("../assets/images/edit.png")}
                  style={[styles.actionIcon]}
                />
                <Text
                  style={[
                    styles.actionText,
                    isEdit && { color: "#789970", fontWeight: "700" },
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                <Image
                  source={require("../assets/images/delete.png")}
                  style={[styles.actionIcon]}
                />
                <Text
                  style={[
                    styles.actionText,
                    isEdit && { color: "#A8696A", fontWeight: "700" },
                  ]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

/* ========================= 스타일 그대로 ========================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  parkName: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  bigStatBox: {
    width: "90%",
    backgroundColor: "#789970",
    borderRadius: 12,
    alignSelf: "center",
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 22,
  },

  statItem: { alignItems: "center" },
  statValue: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statLabel: { color: "#fff", fontSize: 12, marginTop: 3 },

  photo: {
    width: "90%",
    height: 330,
    borderRadius: 15,
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "#eee",
  },

  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },

  date: {
    fontSize: 12,
    color: "#777",
    alignSelf: "flex-end",
    marginRight: "8%",
    marginBottom: 20,
  },

  note: {
    width: "90%",
    alignSelf: "center",
    color: "#555",
    lineHeight: 22,
    fontSize: 14,
  },

  input: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#f4f4f4",
    minHeight: 150,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
  },

  bottomBar: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: "#888",
  },

  actionText: {
    fontSize: 14,
    color: "#666",
  },
});
