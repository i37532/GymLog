import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  const flatListRef = useRef<FlatList>(null);  // 创建 FlatList 的引用

  // 🟢 修改后逻辑：加入排序算法
  const workoutList: WorkoutItem[] = useMemo(() => {
    // 1. 获取今日日期 Key (为了在 useMemo 内部使用，复制一份简单的日期生成逻辑)
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${day}`;

    // 2. 映射基本数据
    const items = currentWorkout
      .map((id) => exercises.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, name: e!.name }));

    // 3. 排序：未完成在前，已完成在后
    return items.sort((a, b) => {
      const isDoneA = (workoutDoneByDate[today] ?? []).includes(a.id);
      const isDoneB = (workoutDoneByDate[today] ?? []).includes(b.id);

      // 如果状态相同（都完成或都未完成），保持原顺序
      if (isDoneA === isDoneB) return 0;
      
      // 如果 A 完成了 (true)，A 应该排在 B (未完成) 后面 -> 返回 1
      return isDoneA ? 1 : -1;
    });
  }, [currentWorkout, exercises, workoutDoneByDate]); // ⚠️ 必须把 workoutDoneByDate 加到依赖里

  const getLocalDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const checkDone = (exerciseId: string) => {
    const today = getLocalDate();
    return (workoutDoneByDate[today] ?? []).includes(exerciseId);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleDoneToggle = (exerciseId: string) => {
    toggleWorkoutDone(exerciseId);  // 调用你的原始逻辑
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });  // 滚动到列表底部
    }
  };

  return (
    <View style={styles.page}>
      <Header title="🔥 今日训练计划" onBack={handleBack} />

      <FlatList
        ref={flatListRef}  // 绑定 ref
        data={workoutList}
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

          return (  // 这是返回的 JSX 结构
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/detail",
                  params: { exerciseId: item.id, from: "workout" },
                })
              }
              style={[styles.workoutItem, isDone && styles.workoutItemDone]}
>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{item.name}</Text>
                <Text style={styles.workoutStatus}>{isDone ? "✅ 已完成" : "⭕️ 待训练"}</Text>
              </View>

              <View style={styles.rightActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDoneToggle(item.id);  // 调用 handleDoneToggle
                  }}
                  style={[styles.doneBtn, isDone && styles.doneBtnDone]}
                >
                  <Text style={styles.doneBtnText}>{isDone ? "取消完成" : "标记完成"}</Text>
                </TouchableOpacity>

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
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footerBtnContainer}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>添加更多动作</Text>
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
    padding: 15,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backBtn: { padding: 5 },
  backText: { color: "#38bdf8", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },

  listContainer: { padding: 15 },

  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { textAlign: "center", color: "#64748b" },
  emptySubText: { color: "#64748b", marginTop: 10 },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  doneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0b1220",
  },
  doneBtnDone: {
    opacity: 0.7,
  },
  doneBtnText: { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },

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
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },
  workoutStatus: { marginTop: 4, color: "#94a3b8", fontSize: 12 },

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

  footerBtnContainer: { padding: 20 },
  primaryButton: {
    backgroundColor: "#38bdf8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },
});
