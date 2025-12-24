import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGymStore } from "./gym-store";

const CATEGORIES = ["背部", "胸部", "肩部", "腿部", "手臂", "核心"];

export default function HomePage() {
  const { exercises, currentWorkout, initializeMockData } = useGymStore();

  // 可选：首次进来自动加载示例（你现在是手动按钮触发）
  useEffect(() => {
    // 不自动注入就保持注释
    // if (exercises.length === 0) initializeMockData();
  }, [exercises.length, initializeMockData]);

  const hasActiveWorkout = currentWorkout.length;

  return (
    <ScrollView contentContainerStyle={styles.screenContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>健身日志</Text>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/workout")}
        style={[
          styles.planButton,
          hasActiveWorkout > 0 ? styles.planButtonActive : styles.planButtonIdle,
        ]}
      >
        <Text style={styles.planButtonText}>
          {hasActiveWorkout > 0 ? `继续训练 (${hasActiveWorkout} 个动作)` : "🚀 开始今日训练计划"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>选择训练部位</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => router.push({ pathname: "/(tabs)/list", params: { category } })}
            style={styles.categoryCard}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => router.push("/(tabs)/add")} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>+ 添加自定义动作</Text>
      </TouchableOpacity>

      {exercises.length === 0 && (
        <TouchableOpacity onPress={initializeMockData} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>一键初始化示例训练动作（推荐）</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: "#f8fafc", marginBottom: 20 },
  planButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: "center",
  },
  planButtonActive: { backgroundColor: "#0ea5e9" },
  planButtonIdle: { backgroundColor: "#334155" },
  planButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#e2e8f0" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  categoryCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  categoryText: { fontSize: 16, fontWeight: "600", color: "#f1f5f9" },
  primaryButton: {
    backgroundColor: "#38bdf8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },
  secondaryButton: { marginTop: 15, padding: 15, alignItems: "center" },
  secondaryButtonText: { color: "#94a3b8", textDecorationLine: "underline" },
});
