// app/(tabs)/detail.tsx
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGymStore } from "./gym-store";

type BatchRow = { weight: string; reps: string; count: string };

export default function DetailPage() {
  const params = useLocalSearchParams<{
    exerciseId?: string | string[];
    from?: string | string[];
    category?: string | string[];
  }>();

  const exerciseId = typeof params.exerciseId === "string" ? params.exerciseId : "";
  const from = typeof params.from === "string" ? params.from : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;


  const {
    exercises,
    logs,
    addLog,
    deleteLog,
    deleteExercise,
    toggleWorkoutExercise,
    currentWorkout,
    updateExercise,
  } = useGymStore();

  const exercise = useMemo(() => exercises.find((e) => e.id === exerciseId), [exercises, exerciseId]);

  const exerciseLogs = useMemo(() => {
    return logs
      .filter((l) => l.exerciseId === exerciseId)
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  }, [logs, exerciseId]);

  const lastLog = exerciseLogs[0];
  const isInWorkout = !!exerciseId && currentWorkout.includes(exerciseId);

  const [currentBatches, setCurrentBatches] = useState<BatchRow[]>([{ weight: "", reps: "", count: "" }]);
  const [pendingImageUri, setPendingImageUri] = useState<string | undefined>(undefined);
  const displayImageUri = pendingImageUri ?? exercise?.image;

  useEffect(() => {
    if (lastLog?.sets?.length) {
      const lastSet = lastLog.sets[lastLog.sets.length - 1];
      setCurrentBatches([{ weight: String(lastSet.weight ?? ""), reps: String(lastSet.reps ?? ""), count: "" }]);
    } else {
      setCurrentBatches([{ weight: "", reps: "", count: "" }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  useEffect(() => {
    setPendingImageUri(undefined);
  }, [exerciseId]);

  const updateBatch = useCallback((index: number, field: keyof BatchRow, value: string) => {
    setCurrentBatches((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const addBatchRow = useCallback(() => {
    setCurrentBatches((prev) => {
      const last = prev[prev.length - 1] ?? { weight: "", reps: "", count: "" };
      return [...prev, { weight: last.weight, reps: last.reps, count: "" }];
    });
  }, []);

  const removeBatchRow = useCallback(() => {
    setCurrentBatches((prev) => (prev.length > 1 ? prev.slice(0, -1) : [{ weight: "", reps: "", count: "" }]));
  }, []);

  const groupSets = (sets: { weight: number; reps: number }[]) => {
    const map = new Map<string, { weight: number; reps: number; count: number }>();
    for (const s of sets) {
      const key = `${s.weight}-${s.reps}`;
      const existed = map.get(key);
      if (existed) existed.count += 1;
      else map.set(key, { weight: s.weight, reps: s.reps, count: 1 });
    }
    return Array.from(map.values());
  };

  const handlePickImage = async () => {
    if (!exerciseId) return;
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("提示", "需要相册权限才能选择图片");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const rawName = (asset.fileName || asset.uri.split("/").pop() || "cover.jpg").split("?")[0];
      const safeName = rawName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const extMatch = safeName.match(/\.[a-zA-Z0-9]+$/);
      const ext = extMatch ? extMatch[0] : ".jpg";
      const base = safeName.replace(/\.[a-zA-Z0-9]+$/, "") || "cover";
      const filename = `${base}-${Date.now()}${ext}`;

      const dest = FileSystem.documentDirectory + filename;
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      setPendingImageUri(dest);
    } catch (e) {
      console.error(e);
      if (Platform.OS === "web") window.alert("选择图片失败");
      else Alert.alert("错误", "选择图片失败");
    }
  };

  const handleSaveImage = () => {
    if (!exerciseId || !pendingImageUri) return;
    updateExercise(exerciseId, { image: pendingImageUri });
    setPendingImageUri(undefined);
    const msg = "图片已更新";
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("成功", msg);
  };

  const handleDeleteImage = () => {
    if (pendingImageUri) {
      setPendingImageUri(undefined);
      return;
    }
    if (!exerciseId || !exercise?.image) return;
    const doDelete = () => {
      updateExercise(exerciseId, { image: undefined });
      const msg = "图片已删除";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("成功", msg);
    };

    if (Platform.OS === "web") {
      if (window.confirm("确定要删除这张照片吗？")) doDelete();
      return;
    }

    Alert.alert("删除照片", "确定要删除这张照片吗？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: doDelete },
    ]);
  };

const handleBack = () => {
  // ✅ 1) 先按来源精确回去（最稳定，Web/Tab 都不会乱跳）
  if (from === "workout") {
    router.replace("/(tabs)/workout");
    return;
  }

  if (from === "list" && category) {
    router.replace({ pathname: "/(tabs)/list", params: { category } });
    return;
  }

  // ✅ 2) 再尝试 back（兜底）
  if (router.canGoBack()) {
    router.back();
    return;
  }

  // ✅ 3) 最后回主页
  router.replace("/(tabs)");
};




  const confirmDeleteExercise = () => {
    if (!exerciseId || !exercise) return;

    const doDelete = () => {
      deleteExercise(exerciseId);
      router.replace("/(tabs)");
    };

    if (Platform.OS === "web") {
      if (window.confirm(`确定要删除「${exercise.name}」以及所有相关训练记录吗？`)) doDelete();
      return;
    }

    Alert.alert("删除动作", `确定要删除「${exercise.name}」以及所有相关训练记录吗？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: doDelete },
    ]);
  };

  const handleSubmit = () => {
    if (!exerciseId) return;

    const finalSets: { weight: number; reps: number }[] = [];

    for (const batch of currentBatches) {
      const w = parseFloat(batch.weight);
      const r = parseFloat(batch.reps);
      const c = parseFloat(batch.count);

      if (!Number.isNaN(w) && !Number.isNaN(r) && !Number.isNaN(c) && w > 0 && r > 0 && c > 0) {
        for (let i = 0; i < c; i++) finalSets.push({ weight: w, reps: r });
      }
    }

    if (!finalSets.length) {
      const msg = "请填写有效数据 (重量、次数、组数均需大于0)";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("提示", msg);
      return;
    }

    addLog({ exerciseId, sets: finalSets });

    const okMsg = `已保存 ${finalSets.length} 组记录！`;
    if (Platform.OS === "web") window.alert(okMsg);
    else Alert.alert("成功", okMsg);
  };

  if (!exercise) {
    return (
      <View style={[styles.page, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#94a3b8" }}>未找到该动作</Text>
            <TouchableOpacity onPress={handleBack} style={{ marginTop: 20 }}>
          <Text style={{ color: "#38bdf8" }}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.page}>
        <Header title={exercise.name} onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {displayImageUri ? (
          <Image source={{ uri: displayImageUri }} style={styles.detailImage} resizeMode="contain" />
        ) : (
          <View style={[styles.detailImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>{exercise.name}</Text>
          </View>
        )}

        <View style={styles.imageActions}>
          <View style={styles.imageActionRow}>
            <TouchableOpacity onPress={handlePickImage} style={[styles.imageBtn, styles.imageBtnGrow]}>
              <Text style={styles.imageBtnText}>{exercise.image ? "更换照片" : "上传照片"}</Text>
            </TouchableOpacity>
            {(exercise.image || pendingImageUri) && (
              <TouchableOpacity
                onPress={handleDeleteImage}
                style={[styles.imageBtn, styles.imageDeleteBtn, styles.imageBtnGrow]}
              >
                <Text style={styles.imageDeleteBtnText}>删除照片</Text>
              </TouchableOpacity>
            )}
          </View>
          {pendingImageUri && (
            <TouchableOpacity onPress={handleSaveImage} style={[styles.imageBtn, styles.imageSaveBtn]}>
              <Text style={styles.imageSaveBtnText}>保存照片</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => toggleWorkoutExercise(exerciseId!)}
            style={[
              styles.actionButton,
              isInWorkout ? styles.actionButtonRemove : styles.actionButtonAdd,
            ]}
          >
            <Text style={styles.actionButtonText}>{isInWorkout ? "从今日计划移除" : "加入今日计划"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmDeleteExercise} style={[styles.actionButton, styles.deleteButton]}>
            <Text style={styles.deleteButtonText}>删除该动作 (含历史记录)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 新增记录</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>序号</Text>
            <Text style={styles.tableHeaderText}>重量(KG)</Text>
            <Text style={styles.tableHeaderText}>次数</Text>
            <Text style={styles.tableHeaderText}>组数</Text>
          </View>

          {currentBatches.map((batch, index) => (
            <View key={index} style={styles.setRow}>
              <View style={styles.setIndexContainer}>
                <Text style={styles.setIndexText}>{index + 1}</Text>
              </View>

              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748b"
                value={batch.weight}
                onChangeText={(v) => updateBatch(index, "weight", v)}
              />

              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748b"
                value={batch.reps}
                onChangeText={(v) => updateBatch(index, "reps", v)}
              />

              <TextInput
                style={[styles.input, styles.inputCount]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748b"
                value={batch.count}
                onChangeText={(v) => updateBatch(index, "count", v)}
              />
            </View>
          ))}

          <View style={styles.setActions}>
            <TouchableOpacity onPress={addBatchRow} style={styles.setBtn}>
              <Text style={styles.setBtnText}>+ 增加录入行</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeBatchRow} style={[styles.setBtn, styles.setBtnDestructive]}>
              <Text style={styles.setBtnTextDestructive}>- 删除一行</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>保存全部记录</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>📅 历史记录</Text>

          {exerciseLogs.map((log) => {
            const grouped = groupSets(log.sets);
            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeaderRow}>
                  <TouchableOpacity
                    onPress={() => {
                      const doDelete = () => deleteLog(log.id);
                      if (Platform.OS === "web") {
                        if (window.confirm("确定要删除这条训练记录吗？")) doDelete();
                      } else {
                        Alert.alert("删除记录", "确定要删除这条训练记录吗？", [
                          { text: "取消", style: "cancel" },
                          { text: "删除", style: "destructive", onPress: doDelete },
                        ]);
                      }
                    }}
                    style={styles.logDeleteBtn}
                  >
                    <Text style={styles.logDeleteText}>删除</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.logSets}>
                  {grouped.map((s, i) => (
                    <Text key={i} style={styles.logSetText}>
                      {s.weight}kg × {s.reps} × {s.count}组
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}

          {exerciseLogs.length === 0 && <Text style={styles.emptyText}>暂无历史记录</Text>}
        </View>
      </ScrollView>
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

  scrollContent: { paddingBottom: 40 },
  detailImage: { width: "100%", height: 250, backgroundColor: "#334155" },
  placeholder: { justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  placeholderText: { color: "#e2e8f0", fontSize: 14, fontWeight: "700", textAlign: "center" },

  imageActions: { gap: 10, paddingHorizontal: 15, paddingTop: 10 },
  imageActionRow: { flexDirection: "row", gap: 10 },
  imageBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#374151",
    borderWidth: 1,
    borderColor: "#334155",
  },
  imageBtnGrow: { flex: 1 },
  imageBtnText: { color: "#f3f4f6", fontWeight: "600" },
  imageDeleteBtn: { backgroundColor: "#374151", borderColor: "#334155" },
  imageDeleteBtnText: { color: "#f3f4f6", fontWeight: "600" },
  imageSaveBtn: { backgroundColor: "#38bdf8", borderColor: "#38bdf8" },
  imageSaveBtnText: { color: "#0f172a", fontWeight: "bold" },

  actionRow: { flexDirection: "column", padding: 15, gap: 10 },
  actionButton: { padding: 12, borderRadius: 8, alignItems: "center" },
  actionButtonAdd: { backgroundColor: "#22c55e" },
  actionButtonRemove: { backgroundColor: "#f59e0b" },
  actionButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  deleteButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#ef4444", marginTop: 10 },
  deleteButtonText: { color: "#ef4444", fontWeight: "bold" },

  card: {
    backgroundColor: "#1e293b",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#f1f5f9" },

  tableHeader: { flexDirection: "row", marginBottom: 10, paddingHorizontal: 5 },
  tableHeaderText: { flex: 1, color: "#94a3b8", fontSize: 13, fontWeight: "600", textAlign: "center" },

  setRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  setIndexContainer: {
    flex: 0.6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#334155",
    height: 45,
    borderRadius: 6,
  },
  setIndexText: { color: "#e2e8f0", fontWeight: "bold", fontSize: 16 },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 6,
    padding: 0,
    textAlign: "center",
    backgroundColor: "#1e293b",
    color: "#fff",
    fontSize: 16,
    height: 45,
  },
  inputCount: { borderColor: "#38bdf8" },

  setActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  setBtn: { padding: 10 },
  setBtnDestructive: { opacity: 0.7 },
  setBtnText: { color: "#38bdf8", fontWeight: "600" },
  setBtnTextDestructive: { color: "#ef4444" },

  submitBtn: {
    backgroundColor: "#38bdf8",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  submitBtnText: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },

  historyContainer: { padding: 15 },
  historyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#f1f5f9" },

  logCard: {
    backgroundColor: "#1e293b",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#38bdf8",
    borderWidth: 1,
    borderColor: "#334155",
  },
  logHeaderRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  logDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#450a0a",
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  logDeleteText: { color: "#fca5a5", fontSize: 12, fontWeight: "600" },

  logSets: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  logSetText: {
    backgroundColor: "#334155",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: "#e2e8f0",
    fontWeight: "500",
    overflow: "hidden",
  },

  emptyText: { textAlign: "center", marginTop: 10, color: "#64748b" },
});
