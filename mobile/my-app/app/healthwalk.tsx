import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppHeader from "../components/AppHeader";

export default function HealthWalk() {
  const router = useRouter();

  /* ============================
      🔥 유저 정보 상태
  ============================ */
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(160);
  const [weight, setWeight] = useState(50);

  const [nameError, setNameError] = useState("");
  const [genderError, setGenderError] = useState("");

  /* 🔥 저장된 데이터가 있는지 판별 */
  const [isEditMode, setIsEditMode] = useState(false);

  /* ============================
      🔥 앱 열 때 저장된 정보 자동 로드
  ============================ */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("healthUser");
      if (saved) {
        const u = JSON.parse(saved);
        setName(u.name);
        setGender(u.gender);
        setAge(u.age);
        setHeight(u.height);
        setWeight(u.weight);
        setIsEditMode(true); // 저장된 정보 있음 → 수정 모드
      }
    })();
  }, []);

  /* ============================
      🔥 저장 버튼 클릭
  ============================ */
  const handleSave = async () => {
    let hasError = false;

    if (!name) {
      setNameError("이름을 입력해 주세요.");
      hasError = true;
    } else {
      setNameError("");
    }

    if (!gender) {
      setGenderError("성별을 선택해 주세요.");
      hasError = true;
    } else {
      setGenderError("");
    }

    if (hasError) return;

    const userData = { name, gender, age, height, weight };
    await AsyncStorage.setItem("healthUser", JSON.stringify(userData));

    router.push("/healthwalk2");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppHeader back />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            건강한 산책을 위해 몇 가지 알려주세요!
          </Text>

          {/* 이름 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력해 주세요"
              placeholderTextColor="#BDBDBD"
              value={name}
              onChangeText={(txt) => {
                setName(txt);
                if (txt) setNameError("");
              }}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* 성별 */}
          <View style={styles.section}>
            <Text style={styles.label}>성별</Text>

            <View style={styles.genderRow}>
              {/* 여성 */}
              <TouchableOpacity
                style={[
                  styles.genderCircle,
                  gender === "female" && styles.genderSelected,
                ]}
                onPress={() => {
                  setGender("female");
                  setGenderError("");
                }}
              >
                <Text
                  style={[
                    styles.genderCircleText,
                    gender === "female" && styles.genderCircleTextSelected,
                  ]}
                >
                  여성
                </Text>
              </TouchableOpacity>

              {/* 남성 */}
              <TouchableOpacity
                style={[
                  styles.genderCircle,
                  gender === "male" && styles.genderSelected,
                ]}
                onPress={() => {
                  setGender("male");
                  setGenderError("");
                }}
              >
                <Text
                  style={[
                    styles.genderCircleText,
                    gender === "male" && styles.genderCircleTextSelected,
                  ]}
                >
                  남성
                </Text>
              </TouchableOpacity>
            </View>

            {genderError ? (
              <Text style={styles.errorText}>{genderError}</Text>
            ) : null}
          </View>

          {/* 나이 / 키 / 몸무게 */}
          <View style={styles.section}>
            {renderNumberInput("나이", age, setAge)}
            {renderNumberInput("키", height, setHeight)}
            {renderNumberInput("몸무게", weight, setWeight)}
          </View>

          {/* 안내 문구 */}
          <View style={styles.infoArea}>
            <Text style={styles.infoText}>정보는 언제든지 수정할 수 있어요</Text>
          </View>
        </ScrollView>

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>
            {isEditMode ? "수정 완료" : "저장"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

/* ============================
    숫자 입력 공통 함수
============================ */
function renderNumberInput(
  label: string,
  value: number,
  setter: (n: number) => void
) {
  return (
    <View style={styles.numRow}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.numControlRow}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => setter(Math.max(0, value - 1))}
        >
          <Text style={styles.circleText}>−</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.numInput}
          keyboardType="numeric"
          value={String(value)}
          onChangeText={(txt) => {
            const num = Number(txt);
            if (!isNaN(num)) setter(num);
          }}
        />

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => setter(value + 1)}
        >
          <Text style={styles.circleText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================
    스타일
============================ */
const mainColor = "#789970";

const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 30,
    alignItems: "center",
  },

  title: {
    marginTop: 30,
    fontSize: 20,
    fontFamily: "NanumBarunGothicBold",
    textAlign: "center",
    marginBottom: 35,
  },

  section: {
    width: "100%",
    marginBottom: 35,
    alignItems: "center",
  },

  label: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "NanumBarunGothicBold",
  },

  input: {
    width: "85%",
    height: 45,
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
  },

  errorText: {
    color: "#D9534F",
    fontSize: 13,
    marginTop: 5,
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 50,
  },

  genderCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  genderSelected: {
    backgroundColor: mainColor,
  },

  genderCircleText: {
    fontSize: 15,
    fontFamily: "NanumBarunGothicBold",
    color: "#333",
  },

  genderCircleTextSelected: {
    color: "#fff",
  },

  numRow: {
    width: "100%",
    marginBottom: 25,
    alignItems: "center",
  },

  numControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },

  circleBtn: {
    width: 24,
    height: 24,
    borderRadius: 14,
    backgroundColor: "#E6E6E6",
    justifyContent: "center",
    alignItems: "center",
  },

  circleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },

  numInput: {
    width: 70,
    height: 40,
    backgroundColor: "#F3F3F3",
    borderRadius: 18,
    textAlign: "center",
    fontSize: 18,
  },

  infoArea: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },

  infoText: {
    fontSize: 12,
    color: "#999",
  },

  saveBtn: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingVertical: 20,
    backgroundColor: mainColor,
    alignItems: "center",
    zIndex: 100,
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingBottom: 10,
  },
});
