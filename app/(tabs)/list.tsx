// app/(tabs)/list.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGymStore } from "./gym-store";

export default function ListPage() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { exercises } = useGymStore();

  const filtered = useMemo(() => {
    if (!category) return [];
    return exercises
      .filter((e) => e.category === category)
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  }, [category, exercises]);

  return (
    <View style={styles.page}>
      <Header title={category ?? "动作列表"} onBack={() => router.replace("/(tabs)")} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>该部位暂无动作，可在下方直接添加。</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseItem}
            onPress={() =>
                router.push({
                pathname: "/(tabs)/detail",
                params: { exerciseId: item.id, from: "list", category },
                })
            }
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.exerciseImage} />
            ) : (
              <View style={[styles.exerciseImage, styles.placeholder]}>
                <Text style={styles.placeholderText}>{item.name}</Text>
              </View>
            )}
            <Text style={styles.exerciseName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 固定底部栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/add",
              params: { category, from: "list" },
            })
          }
          style={styles.bottomBarBtn}
        >
          <Text style={styles.bottomBarBtnText}>+ 添加 {category ?? ""} 动作</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backBtn: { padding: 5 },
  backText: { color: "#38bdf8", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },

  // 关键：底部多留空间，避免被 bottomBar 盖住
  listContainer: { padding: 15, paddingBottom: 110 },

  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
  },
  exerciseImage: {
    width: 80,
    height: 80,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: { paddingHorizontal: 4 },
  placeholderText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  exerciseName: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "600",
    color: "#f1f5f9",
  },

  emptyText: { textAlign: "center", marginTop: 50, color: "#64748b" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#0f172a",
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  bottomBarBtn: {
    backgroundColor: "#38bdf8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bottomBarBtnText: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },
});
