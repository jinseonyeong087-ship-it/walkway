import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PanGestureHandler, State } from "react-native-gesture-handler";

import { API_BASE } from "../constants/api";

const { width, height } = Dimensions.get("window");

export default function CalendarSection() {
  const router = useRouter();

  // 🔥 현재 월 자동 설정
  // 🔥 현재 월 자동 설정
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const [currentMonth, setCurrentMonth] = useState(`${y}-${m}`);

  // 🔥 오늘 날짜 (UTC 영향 제거)
  const now = new Date();
  const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;


  const [hasUserInfo, setHasUserInfo] = useState(false);

  const [stepsByDate, setStepsByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadInfo = async () => {
      const saved = await AsyncStorage.getItem("healthUser");
      setHasUserInfo(!!saved);
    };
    loadInfo();
  }, []);

  // 🔥 월별 데이터 불러오기
  useEffect(() => {
    const fetchMonthLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/walklog/month/${currentMonth}`);
        const data = await res.json();

        const map: Record<string, number> = {};
        data.forEach((item: any) => {
          map[item.date] = item.steps;
        });

        setStepsByDate(map);
      } catch (err) {
        console.log("❌ 월별 WalkLog 로드 오류:", err);
      }
    };

    fetchMonthLogs();
  }, [currentMonth]);

  // 🔥 기존 버튼 방식 유지
  const handleMonthChange = (direction: "prev" | "next") => {
    let date = new Date(currentMonth + "-01");

    if (direction === "prev") date.setMonth(date.getMonth() - 1);
    else date.setMonth(date.getMonth() + 1);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");

    setCurrentMonth(`${y}-${m}`);
  };

  // 🔥 스와이프 감지 (UI 변경 없음)
  const onSwipe = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.END) {
      if (translationX < -40) {
        // 왼쪽 → 다음달
        handleMonthChange("next");
      } else if (translationX > 40) {
        // 오른쪽 → 이전달
        handleMonthChange("prev");
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* 초록색 상단 */}
      <View style={styles.greenHeader}>
        <Text style={styles.headerText}>천천히 당신의 걸음을 담아요!</Text>

        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => handleMonthChange("prev")}>
            <Image source={require("../assets/images/left.png")} style={styles.arrowImg} />
          </TouchableOpacity>

          <View>
            <Text style={styles.monthText}>
              {parseInt(currentMonth.split("-")[1])}월
            </Text>
            <Text style={styles.yearText}>{currentMonth.split("-")[0]}</Text>
          </View>

          <TouchableOpacity onPress={() => handleMonthChange("next")}>
            <Image source={require("../assets/images/right.png")} style={styles.arrowImg} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔥 Calendar + 스와이프 제스처 */}
      <PanGestureHandler
        onHandlerStateChange={onSwipe}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-5, 5]}
      >
        <View style={styles.calendarCard}>
          <Calendar
            key={currentMonth}
            current={currentMonth + "-01"}
            hideArrows={true}
            hideExtraDays={false}
            disableMonthChange={true}
            firstDay={1}
            renderHeader={() => null}
            dayComponent={({ date, state }) => {
              if (!date) return null;

              const safeState = state ?? "";
              const dateString = date.dateString;
              const isToday = dateString === todayString;

              const isPrevMonth = safeState === "disabled";
              const isNextMonth = safeState === "inactive";

              // 이전달/다음달 공간 제거
              if (isPrevMonth || isNextMonth) {
                return <View style={styles.dayWrapper}></View>;
              }

              return (
                <TouchableOpacity
                  style={styles.dayWrapper}
                  activeOpacity={0.7}
                  onPress={async () => {
                    if (!hasUserInfo) return;

                    try {
                      const res = await fetch(`${API_BASE}/api/walklog/${dateString}`);
                      const data = await res.json();

                      if (data.length === 0) {
                        alert("이 날짜에는 산책 기록이 없습니다.");
                        return;
                      }

                      const log = data[0];

                      router.push({
                        pathname: "/WalkDetail",
                        params: {
                          _id: log._id,
                          park: log.park,
                          date: log.date,
                        }
                      });
                    } catch (err) {
                      console.log("❌ 달력 → 상세 이동 오류:", err);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && styles.todayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && { color: "#fff" },
                      ]}
                    >
                      {date.day}
                    </Text>
                  </View>

                  <Text style={styles.stepsText}>
                    {stepsByDate[dateString] ? `${stepsByDate[dateString]}` : ""}
                  </Text>
                </TouchableOpacity>
              );
            }}
            theme={{
              "stylesheet.calendar.header": {
                week: {
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginBottom: 12,
                  marginTop: 4,
                },
                dayHeader: {
                  fontSize: 14,
                  color: "#444",
                },
              },
            } as any}
          />
        </View>
      </PanGestureHandler>

      <Text style={styles.freepikNote}>
        Some graphics used in this application were created by Freepik.
      </Text>
    </View>
  );
}

/* =========================================== */

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "#fff",
  },

  greenHeader: {
    width: "100%",
    backgroundColor: "#789970",
    paddingTop: 110,
    paddingBottom: 110,
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 50,
    fontFamily: "NanumBarun",
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
  },

  arrowImg: {
    width: 28,
    height: 28,
    tintColor: "#fff",
  },

  monthText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "NanumBarun",
  },

  yearText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 3,
    fontFamily: "NanumBarun",
  },

  calendarCard: {
    width: width * 0.9,
    alignSelf: "center",
    backgroundColor: "#fff",
    marginTop: -60,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  dayWrapper: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  todayCircle: {
    backgroundColor: "#789970",
  },

  dayText: {
    fontSize: 16,
    color: "#6b6767ff",
    fontFamily: "NanumBarun",
  },

  stepsText: {
    marginTop: 4,
    fontSize: 10,
    color: "#7C7C7C",
    fontFamily: "NanumBarun",
  },

  freepikNote: {
    textAlign: "center",
    marginTop: 70,
    marginBottom: 10,
    fontSize: 10,
    color: "#CFCFCF",
    fontFamily: "NanumBarun",
  },
});
