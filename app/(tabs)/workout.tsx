import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGymStore } from "./gym-store";

type WorkoutItem = {
  id: string;
  name: string;
};

export default function WorkoutPage() {
  const {
    currentWorkout,
    exercises,
    removeWorkoutExercise,
    workoutDoneByDate,
    toggleWorkoutDone,
  } = useGymStore();

  const flatListRef = useRef<FlatList>(null);

  // 1. 排序逻辑
  const workoutList: WorkoutItem[] = useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const items = currentWorkout
      .map((id) => exercises.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, name: e!.name }));

    return items.sort((a, b) => {
      const isDoneA = (workoutDoneByDate[today] ?? []).includes(a.id);
      const isDoneB = (workoutDoneByDate[today] ?? []).includes(b.id);
      if (isDoneA === isDoneB) return 0;
      return isDoneA ? 1 : -1;
    });
  }, [currentWorkout, exercises, workoutDoneByDate]);

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const checkDone = (exerciseId: string) => {
    return (workoutDoneByDate[getLocalDate()] ?? []).includes(exerciseId);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleDoneToggle = (exerciseId: string) => {
    toggleWorkoutDone(exerciseId);
    // 标记完成不强制滚动，体验更好，或者你可以保留滚动逻辑
  };

  const handleClearAll = () => {
    if (currentWorkout.length === 0) {
      const msg = "当前没有训练动作，无需清除。";
      // Web 和 Native 显示提示的方式略有不同
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("提示", msg);
      }
      return;
    }

    // 🟢 针对 Web 环境的特殊处理
    if (Platform.OS === "web") {
      // 使用浏览器原生的确认框，如果用户点击“确定”，返回 true
      const confirmed = window.confirm("⚠️ 清除所有动作\n\n确定要清空今日的所有训练计划吗？");
      if (confirmed) {
        [...currentWorkout].forEach((id) => removeWorkoutExercise(id));
      }
    } else {
      // 📱 手机端逻辑保持不变
      Alert.alert(
        "⚠️ 清除所有动作",
        "确定要清空今日的所有训练计划吗？",
        [
          { text: "取消", style: "cancel" },
          {
            text: "确定清除",
            style: "destructive",
            onPress: () => {
              [...currentWorkout].forEach((id) => removeWorkoutExercise(id));
            },
          },
        ]
      );
    }
  };


  return (
    <View style={styles.page}>
      <Header title="🔥 今日训练计划" onBack={handleBack} />

      {/* 🟢 关键修改：添加 style={{ flex: 1 }} 让列表占据剩余空间，从而将底部按钮固定在屏幕底部 */}
      <FlatList
        ref={flatListRef}
        data={workoutList}
        style={{ flex: 1 }} 
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>今日计划为空</Text>
            <Text style={styles.emptySubText}>去动作库里添加一些动作吧！</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isDone = checkDone(item.id);

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/detail",
                  params: { exerciseId: item.id, from: "workout" },
                })
              }
              style={[styles.workoutItem, isDone && styles.workoutItemDone]}
            >
              <View style={styles.mainContent}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{item.name}</Text>
                  <Text style={styles.workoutStatus}>
                    {isDone ? "✅ 已完成" : "⭕️ 待训练"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDoneToggle(item.id);
                  }}
                  style={[styles.doneBtn, isDone && styles.doneBtnDone]}
                >
                  <Text style={styles.doneBtnText}>
                    {isDone ? "取消完成" : "标记完成"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  removeWorkoutExercise(item.id);
                }}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {/* 底部按钮区域 */}
      <View style={styles.footerBtnContainer}>
        <TouchableOpacity 
          // 🟢 修改为:
          onPress={() => router.push("/(tabs)/select-exercises")} 
          style={[styles.footerBtn, styles.addBtn]}
        >
          <Text style={styles.addBtnText}>添加训练动作</Text>
        </TouchableOpacity>

        <View style={{ width: 15 }} />

        <TouchableOpacity 
          onPress={handleClearAll} 
          style={[styles.footerBtn, styles.clearBtn]}
        >
          <Text style={styles.clearBtnText}>清除所有动作</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← 返回</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 50 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50, // 增加顶部内边距适配刘海屏
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backBtn: { padding: 5 },
  backText: { color: "#38bdf8", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },

  listContainer: { padding: 15, paddingBottom: 100 }, // 底部增加留白，防止列表最后的内容被底部按钮遮挡

  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { textAlign: "center", color: "#64748b" },
  emptySubText: { color: "#64748b", marginTop: 10 },

  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#64748b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  workoutItemDone: {
    borderLeftColor: "#22c55e",
    backgroundColor: "#064e3b",
    borderColor: "#065f46",
  },
  
  mainContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  workoutInfo: { 
    flexShrink: 1, 
    marginRight: 10 
  },
  workoutName: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },
  workoutStatus: { marginTop: 4, color: "#94a3b8", fontSize: 12 },

  doneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0b1220",
  },
  doneBtnDone: { opacity: 0.7 },
  doneBtnText: { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },

  removeBtn: {
    padding: 10,
    backgroundColor: "#450a0a",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  removeBtnText: { color: "#fca5a5", fontWeight: "bold", fontSize: 16 },

  // 🟢 修复后的底部按钮容器样式 (移除了重复定义)
  footerBtnContainer: { 
    padding: 20,
    flexDirection: "row", 
    justifyContent: "space-between",
    backgroundColor: "#0f172a", // 确保背景色不透明
    borderTopWidth: 1,
    borderTopColor: "#1e293b",

    // 🟢 新增：强制提升层级，防止被 FlatList 遮挡
    zIndex: 999, 
    elevation: 10, // 适配 Android 的阴影/层级
  },
  
  footerBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // 方案 C 样式代码
  addBtn: {
    backgroundColor: "#3b82f6", // 宝蓝色 (Blue-500)
  },
  addBtnText: { 
    color: "#ffffff",           // 纯白文字
    fontSize: 16, 
    fontWeight: "bold" 
  },

  clearBtn: {
    backgroundColor: "#1e293b", // 与卡片背景同色
    // 不需要边框，让文字成为唯一的视觉焦点
  },
  clearBtnText: { 
    color: "#94a3b8",           // 默认是灰色（防止误触）
    // 或者用暗红色: color: "#ef4444" 
    fontSize: 16, 
    fontWeight: "600" 
  },



});
