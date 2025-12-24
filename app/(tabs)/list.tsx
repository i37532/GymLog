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
      .sort(
        (a, b) =>
          (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
      );
  }, [category, exercises]);

  return (
    <View style={styles.page}>
      <Header title={category ?? "动作列表"} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            该部位暂无动作，请返回主页添加。
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseItem}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/detail",
                params: { exerciseId: item.id },
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
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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

  listContainer: { padding: 15 },

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
  placeholder: {
    paddingHorizontal: 4,
  },
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

  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#64748b",
  },
});
