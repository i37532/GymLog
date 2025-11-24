import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform, // 关键引入
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ---------- 常量定义 ----------
const CATEGORIES = ["背部", "胸部", "肩部", "腿部", "手臂", "核心"];

const STORAGE_KEYS = {
  exercises: "gym_exercises",
  logs: "gym_logs",
  currentWorkout: "gym_current_workout",
};

const userIdPlaceholder = "LOCAL_USER_ANDROID";

// ---------- 类型定义 ----------
type Exercise = {
  id: string;
  name: string;
  category: string;
  image: string;
  createdAt?: { seconds: number };
};

type SetItem = {
  weight: number;
  reps: number;
};

type LogItem = {
  id: string;
  exerciseId: string;
  sets: SetItem[];
  date: string;
  createdAt?: { seconds: number };
};

type Page =
  | { view: "home" }
  | { view: "list"; category: string }
  | { view: "detail"; exerciseId: string; from?: "workout" }
  | { view: "add" }
  | { view: "workout" };

// ---------- 主入口组件 ----------
export default function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<string[]>([]);
  const [page, setPage] = useState<Page>({ view: "home" });
  const [isLoading, setIsLoading] = useState(true);

  // 1. 加载数据
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [ex, lg, cw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.exercises),
          AsyncStorage.getItem(STORAGE_KEYS.logs),
          AsyncStorage.getItem(STORAGE_KEYS.currentWorkout),
        ]);
        if (ex) setExercises(JSON.parse(ex));
        if (lg) setLogs(JSON.parse(lg));
        if (cw) setCurrentWorkout(JSON.parse(cw));
      } catch (e) {
        console.warn("load error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  // 2. 自动保存
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(exercises)).catch(() => {});
  }, [exercises]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs)).catch(() => {});
  }, [logs]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.currentWorkout, JSON.stringify(currentWorkout)).catch(() => {});
  }, [currentWorkout]);

  // 3. 核心操作逻辑
  const handleDeleteExercise = useCallback((exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    setLogs((prev) => prev.filter((l) => l.exerciseId !== exerciseId));
    setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));
    setPage({ view: "home" });
  }, []);

  const handleAddExercise = useCallback((newExerciseData: any) => {
    const newId = `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newExercise: Exercise = {
      id: newId,
      ...newExerciseData,
      image:
        newExerciseData.image ||
        `https://placehold.co/600x400/262626/FFFFFF?text=${encodeURIComponent(
          newExerciseData.name
        )}`,
      createdAt: { seconds: Date.now() / 1000 },
    };
    setExercises((prev) => [...prev, newExercise]);
    if (!newExerciseData.isBatch) {
      setPage({ view: "list", category: newExercise.category });
    }
  }, []);

  const handleInitializeMockData = useCallback(() => {
    if (exercises.length > 0) return;
    const mockExercises: Exercise[] = [
      { id: `e-mock-0-${Date.now()}`, name: "杠铃卧推", category: "胸部", image: "https://placehold.co/600x400/38bdf8/000000?text=Bench", createdAt: { seconds: Date.now() / 1000 } },
      { id: `e-mock-1-${Date.now()}`, name: "坐姿划船", category: "背部", image: "https://placehold.co/600x400/22c55e/000000?text=Row", createdAt: { seconds: Date.now() / 1000 + 1 } },
      { id: `e-mock-2-${Date.now()}`, name: "杠铃深蹲", category: "腿部", image: "https://placehold.co/600x400/f97316/000000?text=Squat", createdAt: { seconds: Date.now() / 1000 + 2 } },
      { id: `e-mock-3-${Date.now()}`, name: "站姿推举", category: "肩部", image: "https://placehold.co/600x400/c026d3/000000?text=Press", createdAt: { seconds: Date.now() / 1000 + 3 } },
      { id: `e-mock-4-${Date.now()}`, name: "杠铃弯举", category: "手臂", image: "https://placehold.co/600x400/facc15/000000?text=Curl", createdAt: { seconds: Date.now() / 1000 + 4 } },
      { id: `e-mock-5-${Date.now()}`, name: "悬垂举腿", category: "核心", image: "https://placehold.co/600x400/14b8a6/000000?text=Core", createdAt: { seconds: Date.now() / 1000 + 5 } },
    ];
    setExercises((prev) => [...prev, ...mockExercises]);
  }, [exercises.length]);

  const handleAddLog = useCallback(
    (newLogData: { exerciseId: string; sets: SetItem[] }) => {
      const newId = `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newLog: LogItem = {
        id: newId,
        ...newLogData,
        date: new Date().toISOString().split("T")[0],
        createdAt: { seconds: Date.now() / 1000 },
      };
      setLogs((prev) => [...prev, newLog]);
      if (currentWorkout.includes(newLogData.exerciseId)) {
        setCurrentWorkout((prev) => prev.filter((id) => id !== newLogData.exerciseId));
      }
    },
    [currentWorkout]
  );

  // 4. 导航逻辑
  const goToHome = useCallback(() => setPage({ view: "home" }), []);
  const goToList = useCallback((category: string) => setPage({ view: "list", category }), []);
  const goToDetail = useCallback((exerciseId: string) => setPage({ view: "detail", exerciseId }), []);
  const goToAddExercise = useCallback(() => setPage({ view: "add" }), []);
  const goToWorkout = useCallback(() => setPage({ view: "workout" }), []);
  const goToDetailFromWorkout = useCallback(
    (exerciseId: string) => setPage({ view: "detail", exerciseId, from: "workout" }),
    []
  );

  const addExerciseToWorkout = useCallback(
    (exerciseId: string) => {
      setCurrentWorkout((prev) => {
        if (prev.includes(exerciseId)) return prev.filter((id) => id !== exerciseId);
        return [...prev, exerciseId];
      });
      if (page.view !== "workout") {
        goToWorkout();
      }
    },
    [page.view, goToWorkout]
  );

  const removeExerciseFromWorkout = useCallback((exerciseId: string) => {
    setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));
  }, []);

  // 5. 页面渲染路由
  const renderPage = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text style={styles.loadingText}>正在加载数据...</Text>
        </View>
      );
    }

    switch (page.view) {
      case "home":
        return (
          <HomeScreen
            onSelectCategory={goToList}
            onAddExercise={goToAddExercise}
            onGoToWorkout={goToWorkout}
            onInitializeMockData={handleInitializeMockData}
            hasActiveWorkout={currentWorkout.length}
            userId={userIdPlaceholder}
            exercises={exercises}
          />
        );
      case "list":
        return (
          <ExerciseListScreen
            category={page.category}
            exercises={exercises}
            onSelectExercise={goToDetail}
            onBack={goToHome}
          />
        );
      case "detail": {
        const currentExercise = exercises.find((e) => e.id === page.exerciseId);
        const backHandler =
          page.from === "workout"
            ? goToWorkout
            : () => goToList(currentExercise?.category || CATEGORIES[0]);

        return (
          <ExerciseDetailScreen
            exerciseId={page.exerciseId}
            exercises={exercises}
            logs={logs}
            onAddLog={handleAddLog}
            onBack={backHandler}
            onAddToWorkout={addExerciseToWorkout}
            isCurrentWorkout={currentWorkout.includes(page.exerciseId)}
            onDeleteExercise={handleDeleteExercise}
          />
        );
      }
      case "add":
        return (
          <AddExerciseScreen
            categories={CATEGORIES}
            onSave={handleAddExercise}
            onBack={goToHome}
          />
        );
      case "workout":
        return (
          <WorkoutScreen
            currentWorkout={currentWorkout}
            exercises={exercises}
            logs={logs}
            onBack={goToHome}
            onSelectExercise={goToDetailFromWorkout}
            onRemoveExercise={removeExerciseFromWorkout}
            onAddExercise={addExerciseToWorkout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>{renderPage()}</View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>运行模式: 本地存储 (AsyncStorage)</Text>
      </View>
    </SafeAreaView>
  );
}

// ---------- 子页面组件 ----------

// 1. 首页
function HomeScreen({
  onSelectCategory,
  onAddExercise,
  onGoToWorkout,
  onInitializeMockData,
  hasActiveWorkout,
  userId,
  exercises,
}: any) {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>健身日志</Text>
      <View style={styles.userRow}>
        <Text style={styles.userLabel}>当前用户ID：</Text>
        <Text style={styles.userValue}>{userId}</Text>
      </View>

      <TouchableOpacity
        onPress={onGoToWorkout}
        style={[
          styles.planButton,
          hasActiveWorkout > 0 ? styles.planButtonActive : styles.planButtonIdle,
        ]}
      >
        <Text style={styles.planButtonText}>
          {hasActiveWorkout > 0
            ? `继续训练 (${hasActiveWorkout} 个动作)`
            : "🚀 开始今日训练计划"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>选择训练部位</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => onSelectCategory(category)}
            style={styles.categoryCard}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={onAddExercise} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>+ 添加自定义动作</Text>
      </TouchableOpacity>

      {exercises.length === 0 && (
        <TouchableOpacity onPress={onInitializeMockData} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>一键初始化示例训练动作（推荐）</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// 2. 动作列表
function ExerciseListScreen({ category, exercises, onSelectExercise, onBack }: any) {
  const filtered = useMemo(
    () =>
      exercises
        .filter((e: Exercise) => e.category === category)
        .sort((a: Exercise, b: Exercise) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [category, exercises]
  );

  return (
    <View style={{ flex: 1 }}>
      <Header title={category} onBack={onBack} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>该部位暂无动作，请返回主页添加。</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectExercise(item.id)}
            style={styles.exerciseItem}
          >
            <Image source={{ uri: item.image }} style={styles.exerciseImage} />
            <Text style={styles.exerciseName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// 3. 动作详情 (修复删除确认框)
function ExerciseDetailScreen({
  exerciseId,
  exercises,
  logs,
  onAddLog,
  onBack,
  onAddToWorkout,
  isCurrentWorkout,
  onDeleteExercise,
}: any) {
  const exercise: Exercise | undefined = useMemo(
    () => exercises.find((e: Exercise) => e.id === exerciseId),
    [exerciseId, exercises]
  );

  // 修复 1: 适配 Web 环境的删除确认
  const confirmDelete = () => {
    if (!exercise) return;
    if (Platform.OS === 'web') {
      if (window.confirm(`确定要删除「${exercise.name}」以及所有相关训练记录吗？`)) {
        onDeleteExercise(exerciseId);
      }
      return;
    }
    Alert.alert(
      "删除动作",
      `确定要删除「${exercise.name}」以及所有相关训练记录吗？`,
      [
        { text: "取消", style: "cancel" },
        { text: "删除", style: "destructive", onPress: () => onDeleteExercise(exerciseId) },
      ]
    );
  };

  const exerciseLogs: LogItem[] = useMemo(
    () =>
      logs
        .filter((l: LogItem) => l.exerciseId === exerciseId)
        .sort((a: LogItem, b: LogItem) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [exerciseId, logs]
  );

  const lastLog = exerciseLogs[0];
  const [currentSets, setCurrentSets] = useState<{ weight: string; reps: string }[]>(
    lastLog?.sets?.length
      ? lastLog.sets.map((s) => ({ weight: String(s.weight ?? ""), reps: String(s.reps ?? "") }))
      : [{ weight: "", reps: "" }]
  );

  useEffect(() => {
    if (lastLog?.sets?.length) {
      setCurrentSets(
        lastLog.sets.map((s) => ({ weight: String(s.weight ?? ""), reps: String(s.reps ?? "") }))
      );
    } else {
      setCurrentSets([{ weight: "", reps: "" }]);
    }
  }, [exerciseId]);

  const updateSet = useCallback((index: number, field: "weight" | "reps", value: string) => {
    setCurrentSets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const addSet = useCallback(() => {
    setCurrentSets((prev) => {
      const last = prev[prev.length - 1] || { weight: "", reps: "" };
      return [...prev, { weight: last.weight, reps: last.reps }];
    });
  }, []);

  const removeSet = useCallback(() => {
    setCurrentSets((prev) => (prev.length > 1 ? prev.slice(0, -1) : [{ weight: "", reps: "" }]));
  }, []);

  const handleSubmit = () => {
    const validSets: SetItem[] = currentSets
      .filter((s) => s.weight !== "" && s.reps !== "")
      .map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) }))
      .filter((s) => !Number.isNaN(s.weight) && !Number.isNaN(s.reps) && s.weight > 0 && s.reps > 0);

    if (!validSets.length) {
      if (Platform.OS === 'web') {
        window.alert("请至少填写一组有效数据");
      } else {
        Alert.alert("提示", "请至少填写一组有效数据");
      }
      return;
    }
    onAddLog({ exerciseId, sets: validSets });
    if (Platform.OS === 'web') {
      window.alert("记录已保存！");
    } else {
      Alert.alert("成功", "记录已保存！");
    }
  };

  if (!exercise) return null;

  return (
    <View style={{ flex: 1 }}>
      <Header title={exercise.name} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: exercise.image }} style={styles.detailImage} />
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => onAddToWorkout(exerciseId)}
            style={[
              styles.actionButton,
              isCurrentWorkout ? styles.actionButtonRemove : styles.actionButtonAdd,
            ]}
          >
            <Text style={styles.actionButtonText}>
              {isCurrentWorkout ? "从今日计划移除" : "加入今日计划"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={[styles.actionButton, styles.deleteButton]}>
            <Text style={styles.deleteButtonText}>删除该动作 (含历史记录)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 新增记录</Text>
          {currentSets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text style={styles.setLabel}>第 {index + 1} 组</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="kg"
                value={set.weight}
                onChangeText={(v) => updateSet(index, "weight", v)}
              />
              <Text style={styles.unitText}>KG</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="次"
                value={set.reps}
                onChangeText={(v) => updateSet(index, "reps", v)}
              />
              <Text style={styles.unitText}>次</Text>
            </View>
          ))}
          <View style={styles.setActions}>
            <TouchableOpacity onPress={addSet} style={styles.setBtn}>
              <Text style={styles.setBtnText}>+ 加一组</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeSet} style={[styles.setBtn, styles.setBtnDestructive]}>
              <Text style={styles.setBtnTextDestructive}>- 减一组</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>保存记录</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>📅 历史记录</Text>
          {exerciseLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <Text style={styles.logDate}>{log.date}</Text>
              <View style={styles.logSets}>
                {log.sets.map((s, i) => (
                  <Text key={i} style={styles.logSetText}>
                    {s.weight}kg × {s.reps}
                  </Text>
                ))}
              </View>
            </View>
          ))}
          {exerciseLogs.length === 0 && <Text style={styles.emptyText}>暂无历史记录</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

// 4. 添加动作
function AddExerciseScreen({ categories, onSave, onBack }: any) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') window.alert("请输入动作名称");
      else Alert.alert("提示", "请输入动作名称");
      return;
    }
    onSave({ name, category });
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="添加动作" onBack={onBack} />
      <View style={styles.formContainer}>
        <Text style={styles.label}>动作名称</Text>
        <TextInput
          style={styles.textInput}
          placeholder="例如：哑铃卧推"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>部位分类</Text>
        <View style={styles.tagContainer}>
          {categories.map((c: string) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.tag, category === c ? styles.tagActive : styles.tagInactive]}
            >
              <Text style={category === c ? styles.tagTextActive : styles.tagTextInactive}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>保存</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 5. 今日训练计划 (修复 X 按钮)
function WorkoutScreen({
  currentWorkout,
  exercises,
  logs,
  onBack,
  onSelectExercise,
  onRemoveExercise,
  onAddExercise,
}: any) {
  const workoutList = useMemo(() => {
    return currentWorkout
      .map((id: string) => exercises.find((e: Exercise) => e.id === id))
      .filter(Boolean);
  }, [currentWorkout, exercises]);

  const checkDone = (exerciseId: string) => {
    const today = new Date().toISOString().split("T")[0];
    return logs.some((l: LogItem) => l.exerciseId === exerciseId && l.date === today);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="🔥 今日训练计划" onBack={onBack} />
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
              onPress={() => onSelectExercise(item.id)}
              style={[styles.workoutItem, isDone && styles.workoutItemDone]}
            >
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{item.name}</Text>
                <Text style={styles.workoutStatus}>{isDone ? "✅ 已完成" : "⭕️ 待训练"}</Text>
              </View>
              {/* 修复 2: 增大触摸区域，防止点不到 */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onRemoveExercise(item.id);
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
        <TouchableOpacity onPress={onBack} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>添加更多动作</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------- 通用组件 ----------
function Header({ title, onBack }: any) {
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

// ---------- 样式表 (深色模式) ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" }, // 深色背景
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  loadingText: { marginTop: 10, color: "#94a3b8" },
  footer: { padding: 10, alignItems: "center", backgroundColor: "#1e293b" },
  footerText: { fontSize: 10, color: "#64748b" },

  // Home
  screenContainer: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f8fafc", // 白色标题
    marginBottom: 20,
  },
  userRow: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#1e293b", // 深灰卡片
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  userLabel: { color: "#94a3b8" },
  userValue: { fontWeight: "bold", color: "#e2e8f0" },
  planButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  planButtonActive: { backgroundColor: "#0ea5e9" }, // 亮蓝色
  planButtonIdle: { backgroundColor: "#334155" }, // 深灰色
  planButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#e2e8f0",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#1e293b", // 深色卡片
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  categoryText: { fontSize: 16, fontWeight: "600", color: "#f1f5f9" },
  primaryButton: {
    backgroundColor: "#38bdf8", // 亮青色按钮
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#0f172a", // 深色文字以对比亮背景
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 15,
    padding: 15,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#94a3b8", textDecorationLine: "underline" },

  // List
  listContainer: { padding: 15 },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b", // 深色列表项
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 1,
    borderWidth: 1,
    borderColor: "#334155",
  },
  exerciseImage: { width: 80, height: 80, backgroundColor: "#334155" },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
    color: "#f1f5f9",
  },
  emptyText: { textAlign: "center", marginTop: 50, color: "#64748b" },

  // Detail
  scrollContent: { paddingBottom: 40 },
  detailImage: { width: "100%", height: 250, backgroundColor: "#334155" },
  actionRow: {
    flexDirection: "column",
    padding: 15,
    gap: 10,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonAdd: { backgroundColor: "#22c55e" },
  actionButtonRemove: { backgroundColor: "#f59e0b" },
  actionButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 }, // 按钮文字改深色增加对比
  deleteButton: { backgroundColor: "#ef4444", marginTop: 10 },
  deleteButtonText: { color: "#fff", fontWeight: "bold" },
  
  card: {
    backgroundColor: "#1e293b",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#f1f5f9",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  setLabel: { width: 60, color: "#94a3b8" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 6,
    padding: 8,
    textAlign: "center",
    backgroundColor: "#334155", // 输入框深色背景
    color: "#fff", // 输入文字白色
  },
  unitText: { marginLeft: 5, marginRight: 10, color: "#94a3b8" },
  setActions: { flexDirection: "row", justifyContent: "space-between" },
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
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#f1f5f9",
  },
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
  logDate: { color: "#94a3b8", marginBottom: 5, fontSize: 12 },
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

  // Add
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
    color: "#fff", // 输入文字白色
  },
  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#475569",
  },
  tagActive: { backgroundColor: "#38bdf8", borderColor: "#38bdf8" },
  tagInactive: { backgroundColor: "#1e293b", borderColor: "#475569" },
  tagTextActive: { color: "#0f172a", fontWeight: "bold" },
  tagTextInactive: { color: "#94a3b8" },

  // Workout
  emptyContainer: { alignItems: "center", marginTop: 50 },
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
    backgroundColor: "#064e3b", // 深绿色背景
    borderColor: "#065f46"
  },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9" },
  workoutStatus: { marginTop: 4, color: "#94a3b8", fontSize: 12 },
  removeBtn: {
    padding: 10,
    backgroundColor: "#450a0a", // 深红色背景
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

  // Header
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
});
