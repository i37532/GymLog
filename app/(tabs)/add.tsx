// app/(tabs)/add.tsx
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGymStore } from "./gym-store";

const CATEGORIES = ["背部", "胸部", "肩部", "腿部", "手臂", "核心"];

export default function AddPage() {
  const { addExercise } = useGymStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const handlePickImage = async () => {
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
        aspect: [3, 2],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const filename = (asset.fileName || asset.uri.split("/").pop() || `cover-${Date.now()}.jpg`).replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_"
      );

      const dest = FileSystem.documentDirectory + filename;
      await FileSystem.copyAsync({ from: asset.uri, to: dest });

      setImageUri(dest);
    } catch (e) {
      console.error(e);
      if (Platform.OS === "web") window.alert("选择图片失败");
      else Alert.alert("错误", "选择图片失败");
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === "web") window.alert("请输入动作名称");
      else Alert.alert("提示", "请输入动作名称");
      return;
    }

    addExercise({
      name: name.trim(),
      category,
      image: imageUri,
    });

    router.replace("/(tabs)"); // 保存后回主页
  };

  return (
    <View style={styles.page}>
      <Header title="添加动作" />

      <View style={styles.formContainer}>
        <Text style={styles.label}>动作名称</Text>
        <TextInput
          style={styles.textInput}
          placeholder="例如：哑铃卧推"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>部位分类</Text>
        <View style={styles.tagContainer}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.tag, category === c ? styles.tagActive : styles.tagInactive]}
            >
              <Text style={category === c ? styles.tagTextActive : styles.tagTextInactive}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>封面图片（可选）</Text>
        <TouchableOpacity onPress={handlePickImage} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>{imageUri ? "重新选择封面" : "从相册选择封面"}</Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

        <TouchableOpacity onPress={handleSave} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>保存</Text>
        </TouchableOpacity>
      </View>
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

  formContainer: { padding: 20 },

  label: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: "#e2e8f0" },
  textInput: {
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#1e293b",
    marginBottom: 20,
    fontSize: 16,
    color: "#fff",
  },

  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tagActive: { backgroundColor: "#38bdf8", borderColor: "#38bdf8" },
  tagInactive: { backgroundColor: "#1e293b", borderColor: "#475569" },
  tagTextActive: { color: "#0f172a", fontWeight: "bold" },
  tagTextInactive: { color: "#94a3b8" },

  secondaryBtn: { paddingVertical: 12, alignItems: "center", marginBottom: 12 },
  secondaryBtnText: { color: "#94a3b8", textDecorationLine: "underline" },

  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#0f172a",
  },

  primaryBtn: {
    backgroundColor: "#38bdf8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryBtnText: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },
});
