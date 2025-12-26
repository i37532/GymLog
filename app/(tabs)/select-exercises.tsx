import { router, useFocusEffect } from "expo-router"; // 🟢 引入 useFocusEffect
import React, { useCallback, useMemo, useState } from "react"; // 🟢 引入 useCallback
import {
    Image,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useGymStore } from "./gym-store";

export default function SelectExercisesPage() {
  const { exercises, currentWorkout, setCurrentWorkout } = useGymStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 记录展开的组名
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // 🟢 新增：使用 useFocusEffect 自动重置状态
  // 当用户离开这个页面（点击确认、取消、或按系统返回键）时，自动清空勾选状态
  useFocusEffect(
    useCallback(() => {
      // 页面获得焦点时执行（进入页面）
      // 这里什么都不做，保留为空
      
      return () => {
        // 页面失去焦点时执行（离开页面）
        // 🔥 关键：离开时清空所有勾选项，保证下次进来是干净的
        setSelectedIds([]); 
        
        // 可选：如果你希望下次进来时，分类列表也全部折叠，可以把下面这行解开
        setExpandedSections(new Set()); 
      };
    }, [])
  );

  // ... 下面的代码保持不变 ...

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const sections = useMemo(() => {
    const groups: Record<string, typeof exercises> = {};
    exercises.forEach((ex) => {
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    });

    return Object.keys(groups).map((key) => ({
      title: key,
      data: expandedSections.has(key) ? groups[key] : [],
    }));
  }, [exercises, expandedSections]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      setCurrentWorkout((prev) => {
        const newSet = new Set([...prev, ...selectedIds]);
        return Array.from(newSet);
      });
    }
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.page}>
      <Header title="选择训练动作" onCancel={handleCancel} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false} 
        renderSectionHeader={({ section: { title } }) => {
          const isExpanded = expandedSections.has(title);
          return (
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection(title)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionArrow}>{isExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => {
          const isAlreadyInWorkout = currentWorkout.includes(item.id);
          const isSelected = selectedIds.includes(item.id);

          return (
            <TouchableOpacity
              onPress={() => {
                if (!isAlreadyInWorkout) toggleSelection(item.id);
              }}
              activeOpacity={isAlreadyInWorkout ? 1 : 0.7}
              style={[
                styles.itemRow,
                isAlreadyInWorkout && styles.itemRowDisabled,
                isSelected && styles.itemRowSelected,
              ]}
            >
              <View style={styles.imageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                      {item.name.slice(0, 1)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.itemName,
                    isAlreadyInWorkout && styles.textDisabled,
                  ]}
                >
                  {item.name}
                </Text>
                {isAlreadyInWorkout && (
                  <Text style={styles.itemSubtitle}>已在计划中</Text>
                )}
              </View>

              {!isAlreadyInWorkout && (
                <View style={styles.checkbox}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          exercises.length === 0 ? (
            <Text style={styles.emptyText}>暂无动作，请先去动作库添加。</Text>
          ) : null
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>取消</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={selectedIds.length === 0}
          style={[
            styles.confirmBtn,
            selectedIds.length === 0 && styles.confirmBtnDisabled,
          ]}
        >
          <Text style={styles.confirmBtnText}>
            确认添加 {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({ title, onCancel }: { title: string; onCancel: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ... styles 保持不变 ...
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f172a" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    position: "relative",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },
  closeBtn: { position: "absolute", right: 15, bottom: 12, padding: 5 },
  closeText: { color: "#94a3b8", fontSize: 20 },

  listContainer: { padding: 15, paddingBottom: 100 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sectionTitle: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  sectionArrow: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "bold",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  itemRowSelected: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.05)",
  },
  itemRowDisabled: {
    opacity: 0.5,
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
  },

  imageContainer: { marginRight: 15 },
  image: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#334155" },
  placeholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#94a3b8", fontSize: 18, fontWeight: "bold" },

  textContainer: { flex: 1 },
  itemName: { fontSize: 16, color: "#f1f5f9", fontWeight: "600" },
  textDisabled: { color: "#94a3b8" },
  itemSubtitle: { fontSize: 12, color: "#22c55e", marginTop: 2 },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#38bdf8",
  },

  emptyText: { textAlign: "center", marginTop: 50, color: "#64748b" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    padding: 15,
    paddingBottom: 30,
    flexDirection: "row",
    gap: 15,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  cancelBtnText: { color: "#f1f5f9", fontWeight: "bold", fontSize: 16 },

  confirmBtn: {
    flex: 2,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#38bdf8",
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: "#334155" },
  confirmBtnText: { color: "#0f172a", fontWeight: "bold", fontSize: 16 },
});
