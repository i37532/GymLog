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

    // ⭐ 新增：删除单条历史记录
    const handleDeleteLog = useCallback((logId: string) => {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    }, []);

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
            // ⭐ 新增
            onDeleteLog={handleDeleteLog}
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

// ---------- 3. 动作详情 (修改为：批次录入模式 - 4列布局) ----------
function ExerciseDetailScreen({
  exerciseId,
  exercises,
  logs,
  onAddLog,
  onBack,
  onAddToWorkout,
  isCurrentWorkout,
  onDeleteExercise,
  // ⭐ 新增
  onDeleteLog,
}: any) {
  const exercise: Exercise | undefined = useMemo(
    () => exercises.find((e: Exercise) => e.id === exerciseId),
    [exerciseId, exercises]
  );



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

  // 这里 state 改存 "批次"：重量、单组次数、执行几组
  const [currentBatches, setCurrentBatches] = useState<{ weight: string; reps: string; count: string }[]>(
    [{ weight: "", reps: "", count: "" }]
  );

  // 初始化时，如果有历史记录，尝试预填第一行（取上次最后做的重量和次数，组数默认为空或1）
  useEffect(() => {
    if (lastLog?.sets?.length) {
      const lastSet = lastLog.sets[lastLog.sets.length - 1];
      setCurrentBatches([{ 
        weight: String(lastSet.weight ?? ""), 
        reps: String(lastSet.reps ?? ""), 
        count: "" // 组数留空让用户填，或者您可以改为 "1"
      }]);
    }
  }, [exerciseId]);

  const updateBatch = useCallback((index: number, field: "weight" | "reps" | "count", value: string) => {
    setCurrentBatches((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const addBatchRow = useCallback(() => {
    setCurrentBatches((prev) => {
      const last = prev[prev.length - 1] || { weight: "", reps: "", count: "" };
      // 新增一行时，复制上一行的重量和次数，组数清空
      return [...prev, { weight: last.weight, reps: last.reps, count: "" }];
    });
  }, []);

  const removeBatchRow = useCallback(() => {
    setCurrentBatches((prev) => (prev.length > 1 ? prev.slice(0, -1) : [{ weight: "", reps: "", count: "" }]));
  }, []);

  // ⭐ 新增：把相同重量+次数的 set 合并
  const groupSets = (sets: SetItem[]) => {
    const map = new Map<string, { weight: number; reps: number; count: number }>();

    for (const s of sets) {
      const key = `${s.weight}-${s.reps}`;
      const existed = map.get(key);
      if (existed) {
        existed.count += 1;
      } else {
        map.set(key, { weight: s.weight, reps: s.reps, count: 1 });
      }
    }

    return Array.from(map.values());
  };

  const handleSubmit = () => {
    const finalSets: SetItem[] = [];

    // 遍历每一行输入
    for (const batch of currentBatches) {
      const w = parseFloat(batch.weight);
      const r = parseFloat(batch.reps);
      const c = parseFloat(batch.count); // 组数

      // 验证数据有效性
      if (!Number.isNaN(w) && !Number.isNaN(r) && !Number.isNaN(c) && w > 0 && r > 0 && c > 0) {
        // 核心逻辑：根据“组数”循环生成记录
        for (let i = 0; i < c; i++) {
          finalSets.push({ weight: w, reps: r });
        }
      }
    }

    if (!finalSets.length) {
      const msg = "请填写有效数据 (重量、次数、组数均需大于0)";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("提示", msg);
      return;
    }

    onAddLog({ exerciseId, sets: finalSets });
    
    if (Platform.OS === 'web') {
      window.alert(`已保存 ${finalSets.length} 组记录！`);
    } else {
      Alert.alert("成功", `已保存 ${finalSets.length} 组记录！`);
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
          <Text style={styles.cardTitle}>📝 新增记录 (批量录入)</Text>
          
          {/* 表头：4列布局 */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>序号</Text>
            <Text style={styles.tableHeaderText}>重量(KG)</Text>
            <Text style={styles.tableHeaderText}>次数</Text>
            <Text style={styles.tableHeaderText}>组数</Text>
          </View>

          {/* 输入行：4列布局 */}
          {currentBatches.map((batch, index) => (
            <View key={index} style={styles.setRow}>
              {/* 1. 序号 */}
              <View style={styles.setIndexContainer}>
                <Text style={styles.setIndexText}>{index + 1}</Text>
              </View>
              
              {/* 2. 重量 */}
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748b"
                value={batch.weight}
                onChangeText={(v) => updateBatch(index, "weight", v)}
              />
              
              {/* 3. 次数 */}
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748b"
                value={batch.reps}
                onChangeText={(v) => updateBatch(index, "reps", v)}
              />

              {/* 4. 组数 (新增) */}
              <TextInput
                style={[styles.input, styles.inputCount]} // 加个特殊样式区分
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
            const groupedSets = groupSets(log.sets); // ⭐ 合并相同记录
            return (
              <View key={log.id} style={styles.logCard}>
                {/* 顶部：只放“删除”按钮，不显示日期 */}
                <View style={styles.logHeaderRow}>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === "web") {
                        if (window.confirm("确定要删除这条训练记录吗？")) {
                          onDeleteLog(log.id);
                        }
                      } else {
                        Alert.alert(
                          "删除记录",
                          "确定要删除这条训练记录吗？",
                          [
                            { text: "取消", style: "cancel" },
                            {
                              text: "删除",
                              style: "destructive",
                              onPress: () => onDeleteLog(log.id),
                            },
                          ]
                        );
                      }
                    }}
                    style={styles.logDeleteBtn}
                  >
                    <Text style={styles.logDeleteText}>删除</Text>
                  </TouchableOpacity>
                </View>

                {/* 下面显示合并后的 set：20kg × 10 × 3组 */}
                <View style={styles.logSets}>
                  {groupedSets.map((s, i) => (
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

// ---------- 样式表 (深色模式 + 4列布局) ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
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
    color: "#f8fafc",
    marginBottom: 20,
  },
  userRow: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#1e293b",
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
  planButtonActive: { backgroundColor: "#0ea5e9" },
  planButtonIdle: { backgroundColor: "#334155" },
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
  primaryButtonText: {
    color: "#0f172a",
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
    backgroundColor: "#1e293b",
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
  actionButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
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
  
  // --- 4列布局样式 ---
  tableHeader: {
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    flex: 1,
    color: "#94a3b8",
    fontSize: 13, // 稍微调小一点以容纳4列
    fontWeight: "600",
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8, // 列间距
  },
  setIndexContainer: {
    flex: 0.6, // 序号列稍微窄一点
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#334155",
    height: 45,
    borderRadius: 6,
  },
  setIndexText: {
    color: "#e2e8f0",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 6,
    padding: 0, // 减小内边距，防止数字显示不全
    textAlign: "center",
    backgroundColor: "#1e293b",
    color: "#fff",
    fontSize: 16,
    height: 45,
  },
  inputCount: {
    backgroundColor: "#1e293b", // 可以给组数输入框一个不同的背景色，或者保持一致
    borderColor: "#38bdf8", // 给组数一个亮色边框突出显示
  },
  // -----------------------

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

    // ⭐ 新增：历史记录卡片顶部的删除按钮行
    logHeaderRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 8,
    },
    logDeleteBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: "#450a0a",
      borderWidth: 1,
      borderColor: "#7f1d1d",
    },
    logDeleteText: {
      color: "#fca5a5",
      fontSize: 12,
      fontWeight: "600",
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
    color: "#fff",
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
    backgroundColor: "#064e3b",
    borderColor: "#065f46"
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


