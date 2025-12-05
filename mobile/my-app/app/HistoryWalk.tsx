import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";

import AppHeader from "../components/AppHeader";
import { API_BASE } from "../constants/api";

export default function HistoryWalk() {
  const router = useRouter();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  /* 🔥 DB에서 전체 기록 가져오기 */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/walklog/all`);
        const data = await res.json();

        // ⭐ DB 구조를 HistoryWalk UI 구조에 맞게 변환하면서 _id 포함
        const formatted = data.map((item: any) => ({
          _id: item._id,    // 🔥 반드시 포함해야 함
          park: item.park,
          date: item.date,
          note: item.memo || "",
          photo: item.photo || "",
          steps: item.steps,
          kcal: item.kcal,
          distance: item.distance,
          duration: item.duration,
        }));

        setRecords(formatted);
      } catch (err) {
        console.log("❌ HistoryWalk 데이터 오류:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader back home />

      <Text style={styles.title}>산책 기록을 모아보세요!</Text>

      {loading && (
        <Text style={{ marginTop: 40, fontSize: 14, color: "#666" }}>
          불러오는 중...
        </Text>
      )}

      {!loading && records.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>아무 기록이 없습니다.</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
        {records.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/WalkDetail",
                params: {
                  ...item,
                  _id: item._id,   // 🔥 WalkDetail 삭제/수정 시 필요
                },
              })
            }
          >
            <View style={styles.row}>
              {/* 왼쪽 텍스트 */}
              <View style={styles.leftBox}>
                <Text style={styles.park}>{item.park}</Text>
                <Text style={styles.date}>{item.date}</Text>

                <Text style={styles.note} numberOfLines={3}>
                  {item.note || ""}
                </Text>
              </View>

              {/* 오른쪽 사진 */}
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.noPhoto]}>
                  <Text style={{ fontSize: 11, color: "#999" }}>사진 없음</Text>
                </View>
              )}
            </View>

            {/* 아래 바 */}
            <View style={styles.moreBar}>
              <Text style={styles.moreText}>더보기</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 150 }} />
      </ScrollView>
    </View>
  );
}

/* ========== 스타일 (절대 수정 안 함) ========== */

const mainColor = "#789970";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 120,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 28,
    textAlign: "center",
    width: "100%",
  },

  emptyBox: { marginTop: 40 },
  emptyText: { fontSize: 15, color: "#777" },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignSelf: "center",
  },

  row: {
    flexDirection: "row",
    marginBottom: 10,
  },

  leftBox: {
    flex: 1,
    paddingRight: 10,
  },

  park: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },

  date: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },

  note: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  photo: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },

  moreBar: {
    backgroundColor: mainColor,
    height: 30,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -15,
    marginRight: -15,
    marginTop: 5,
  },

  moreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
