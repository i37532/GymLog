// app/(tabs)/workout.tsx
import { router } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGymStore } from "./gym-store";

type WorkoutItem = {
  id: string;
  name: string;
};

export default function WorkoutPage() {
  const { currentWorkout, exercises, logs, removeWorkoutExercise } = useGymStore(); // :contentReference[oaicite:1]{index=1}

  const workoutList: WorkoutItem[] = useMemo(() => {
    return currentWorkout
      .map((id) => exercises.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, name: e!.name }));
  }, [currentWorkout, exercises]);

  const checkDone = (exerciseId: string) => {
    const today = new Date().toISOString().split("T")[0];
    return logs.some((l) => l.exerciseId === exerciseId && l.date === today);
  };

  const handleBack = () => {
    // ✅ 不用任何 hook，直接用 router
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <View style={styles.page}>
      <Header title="🔥 今日训练计划" onBack={handleBack} />

      <FlatList
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
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{item.name}</Text>
                <Text style={styles.workoutStatus}>{isDone ? "✅ 已完成" : "⭕️ 待训练"}</Text>
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
