import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES = ["背部", "胸部", "肩部", "腿部", "手臂", "核心"];

const STORAGE_KEYS = {
  exercises: "gym_exercises",
  logs: "gym_logs",
  currentWorkout: "gym_current_workout",
};

const userIdPlaceholder = "LOCAL_USER_ANDROID";

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

export default function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<string[]>([]);
  const [page, setPage] = useState<Page>({ view: "home" });
  const [isLoading, setIsLoading] = useState(true);

  // ---------- 从 AsyncStorage 加载 ----------
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

  // ---------- 保存到 AsyncStorage ----------
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(exercises)).catch(
      () => {}
    );
  }, [exercises]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs)).catch(
      () => {}
    );
  }, [logs]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.currentWorkout,
      JSON.stringify(currentWorkout)
    ).catch(() => {});
  }, [currentWorkout]);

  // ---------- 数据操作 ----------
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
      {
        id: `e-mock-0-${Date.now()}`,
        name: "杠铃卧推",
        category: "胸部",
        image: "https://placehold.co/600x400/38bdf8/000000?text=Bench",
        createdAt: { seconds: Date.now() / 1000 },
      },
      {
        id: `e-mock-1-${Date.now()}`,
        name: "坐姿划船",
        category: "背部",
        image: "https://placehold.co/600x400/22c55e/000000?text=Row",
        createdAt: { seconds: Date.now() / 1000 + 1 },
      },
      {
        id: `e-mock-2-${Date.now()}`,
        name: "杠铃深蹲",
        category: "腿部",
        image: "https://placehold.co/600x400/f97316/000000?text=Squat",
        createdAt: { seconds: Date.now() / 1000 + 2 },
      },
      {
        id: `e-mock-3-${Date.now()}`,
        name: "站姿推举",
        category: "肩部",
        image: "https://placehold.co/600x400/c026d3/000000?text=Press",
        createdAt: { seconds: Date.now() / 1000 + 3 },
      },
      {
        id: `e-mock-4-${Date.now()}`,
        name: "杠铃弯举",
        category: "手臂",
        image: "https://placehold.co/600x400/facc15/000000?text=Curl",
        createdAt: { seconds: Date.now() / 1000 + 4 },
      },
      {
        id: `e-mock-5-${Date.now()}`,
        name: "悬垂举腿",
        category: "核心",
        image: "https://placehold.co/600x400/14b8a6/000000?text=Core",
        createdAt: { seconds: Date.now() / 1000 + 5 },
      },
    ];

    setExercises((prev) => [...prev, ...mockExercises]);
  }, [exercises.length]);

  const handleAddLog = useCallback(
    (newLogData: { exerciseId: string; sets: SetItem[] }) => {
      const newId = `l-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      const newLog: LogItem = {
        id: newId,
        ...newLogData,
        date: new Date().toISOString().split("T")[0],
        createdAt: { seconds: Date.now() / 1000 },
      };

      setLogs((prev) => [...prev, newLog]);

      if (currentWorkout.includes(newLogData.exerciseId)) {
        setCurrentWorkout((prev) =>
          prev.filter((id) => id !== newLogData.exerciseId)
        );
      }
    },
    [currentWorkout]
  );

  // ---------- 导航 ----------
  const goToHome = useCallback(() => setPage({ view: "home" }), []);
  const goToList = useCallback(
    (category: string) => setPage({ view: "list", category }),
    []
  );
  const goToDetail = useCallback(
    (exerciseId: string) => setPage({ view: "detail", exerciseId }),
    []
  );
  const goToAddExercise = useCallback(
    () => setPage({ view: "add" }),
    []
  );
  const goToWorkout = useCallback(
    () => setPage({ view: "workout" }),
    []
  );
  const goToDetailFromWorkout = useCallback(
    (exerciseId: string) =>
      setPage({ view: "detail", exerciseId, from: "workout" }),
    []
  );

  const addExerciseToWorkout = useCallback(
    (exerciseId: string) => {
      setCurrentWorkout((prev) =>
        prev.includes(exerciseId) ? prev : [...prev, exerciseId]
      );
      if (page.view !== "workout") {
        goToWorkout();
      }
    },
    [page.view, goToWorkout]
  );

  const removeExerciseFromWorkout = useCallback((exerciseId: string) => {
    setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));
  }, []);

  // ---------- 页面渲染 ----------
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
        const currentExercise = exercises.find(
          (e) => e.id === page.exerciseId
        );
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
      <View style={styles.root}>
        {renderPage()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          运行模式: 本地存储 (AsyncStorage)
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ---------- 1. 首页 ----------
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
    <ScrollView
      contentContainerStyle={styles.screenContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>健身日志</Text>

      <View style={styles.userRow}>
        <Text style={styles.userLabel}>当前用户ID：</Text>
        <Text style={styles.userValue}>{userId}</Text>
      </View>

      <TouchableOpacity
        onPress={onGoToWorkout}
        style={[
          styles.planButton,
          hasActiveWorkout > 0
            ? styles.planButtonActive
            : styles.planButtonIdle,
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

      <TouchableOpacity
        onPress={onAddExercise}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>+ 添加自定义动作</Text>
      </TouchableOpacity>

      {exercises.length === 0 && (
        <TouchableOpacity
          onPress={onInitializeMockData}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            一键初始化示例训练动作（推荐）
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ---------- 2. 动作列表 ----------
function ExerciseListScreen({
  category,
  exercises,
  onSelectExercise,
  onBack,
}: any) {
  const filtered = useMemo(
    () =>
      exercises
        .filter((e: Exercise) => e.category === category)
        .sort(
          (a: Exercise, b: Exercise) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        ),
    [category, exercises]
  );

  return (
    <View style={{ flex: 1 }}>
      <Header title={category} onBack={onBack} />
      <FlatList
        data={filtered}
        keyExtractor={(item: Exercise) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            该部位暂无动作，请返回主页添加。
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectExercise(item.id)}
            style={styles.exerciseItem}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.exerciseImage}
            />
            <Text style={styles.exerciseName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ---------- 3. 动作详情 ----------
function ExerciseDetailScreen({
  exerciseId,
  exercises,
  logs,
  onAddLog,
  onBack,
  onAddToWorkout,
  isCurrentWorkout,
}: any) {
  const exercise: Exercise | undefined = useMemo(
    () => exercises.find((e: Exercise) => e.id === exerciseId),
    [exerciseId, exercises]
  );

  const exerciseLogs: LogItem[] = useMemo(
    () =>
      logs
        .filter((l: LogItem) => l.exerciseId === exerciseId)
        .sort(
          (a: LogItem, b: LogItem) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        ),
    [exerciseId, logs]
  );

  const lastLog = exerciseLogs[0];

  const [currentSets, setCurrentSets] = useState<
    { weight: string; reps: string }[]
  >(
    lastLog?.sets?.length
      ? lastLog.sets.map((s) => ({
          weight: String(s.weight ?? ""),
          reps: String(s.reps ?? ""),
        }))
      : [{ weight: "", reps: "" }]
  );

  useEffect(() => {
    if (lastLog?.sets?.length) {
      setCurrentSets(
        lastLog.sets.map((s) => ({
          weight: String(s.weight ?? ""),
          reps: String(s.reps ?? ""),
        }))
      );
    } else {
      setCurrentSets([{ weight: "", reps: "" }]);
    }
  }, [exerciseId]);

  const updateSet = useCallback(
    (index: number, field: "weight" | "reps", value: string) => {
      setCurrentSets((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    },
    []
  );

  const addSet = useCallback(() => {
    setCurrentSets((prev) => {
      const last = prev[prev.length - 1] || { weight: "", reps: "" };
      return [...prev, { weight: last.weight, reps: last.reps }];
    });
  }, []);

  const removeSet = useCallback(() => {
    setCurrentSets((prev) =>
      prev.length > 1 ? prev.slice(0, -1) : [{ weight: "", reps: "" }]
    );
  }, []);

  const handleSubmit = () => {
    const validSets: SetItem[] = currentSets
      .filter((s) => s.weight !== "" && s.reps !== "")
      .map((s) => ({
        weight: Number(s.weight),
        reps: Number(s.reps),
      }))
      .filter(
        (s) =>
          !Number.isNaN(s.weight) &&
          !Number.isNaN(s.reps) &&
          s.weight > 0 &&
          s.reps > 0
      );

    if (!validSets.length) {
      alert("请至少填写一组有效数据");
      return;
    }

    onAddLog({ exerciseId, sets: validSets });
    setCurrentSets([{ weight: "", reps: "" }]);
  };

  const formatLastLog = (log?: LogItem) => {
    if (!log || !log.sets?.length) return "暂无记录";
    const summary = log.sets
      .map((s) => `${s.weight}kg x ${s.reps}`)
      .join(", ");
    return `${log.sets.length} 组: ${summary}`;
  };

  if (!exercise) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="错误" onBack={onBack} />
        <View style={styles.screenContainer}>
          <Text style={styles.emptyText}>未找到动作</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title={exercise.name} onBack={onBack} />
      <ScrollView>
        <Image
          source={{ uri: exercise.image }}
          style={styles.detailImage}
        />

        <View style={styles.screenContainer}>
          <TouchableOpacity
            onPress={() => onAddToWorkout(exerciseId)}
            style={[
              styles.planButton,
              isCurrentWorkout
                ? styles.planButtonRemove
                : styles.planButtonAdd,
            ]}
          >
            <Text style={styles.planButtonText}>
              {isCurrentWorkout ? "从今日计划中移除" : "加入今日训练计划"}
            </Text>
          </TouchableOpacity>

          <View style={styles.lastLogBox}>
            <Text style={styles.lastLogTitle}>
              上次记录 ({lastLog?.date || "N/A"})
            </Text>
            <Text style={styles.lastLogText}>
              {formatLastLog(lastLog)}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            记录组数 ({currentSets.length} 组)
          </Text>

          {currentSets.map((set, idx) => (
            <View key={idx} style={styles.setRow}>
              <Text style={styles.setIndex}>#{idx + 1}</Text>
              <TextInput
                style={styles.setInput}
                value={set.weight}
                onChangeText={(v) => updateSet(idx, "weight", v)}
                keyboardType="decimal-pad"
                placeholder="重量 (kg)"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.setMultiply}>x</Text>
              <TextInput
                style={styles.setInput}
                value={set.reps}
                onChangeText={(v) => updateSet(idx, "reps", v)}
                keyboardType="number-pad"
                placeholder="次数"
                placeholderTextColor="#9ca3af"
              />
            </View>
          ))}

          <View style={styles.setButtonsRow}>
            <TouchableOpacity
              onPress={addSet}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                + 添加下一组
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={removeSet}
              style={[styles.secondaryButton, { marginLeft: 8 }]}
            >
              <Text style={styles.secondaryButtonText}>删除最后一组</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              保存本次训练记录
            </Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            历史记录 ({exerciseLogs.length} 天)
          </Text>

          {exerciseLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeaderRow}>
                <Text style={styles.logDate}>{log.date}</Text>
                <Text style={styles.logCount}>
                  共 {log.sets?.length || 0} 组
                </Text>
              </View>
              {log.sets?.map((s, i) => (
                <View key={i} style={styles.logSetRow}>
                  <Text style={styles.logSetLabel}>第 {i + 1} 组</Text>
                  <Text style={styles.logSetValue}>
                    {s.weight} kg x {s.reps} 次
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- 4. 添加动作 ----------
function AddExerciseScreen({ categories, onSave, onBack }: any) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [image, setImage] = useState("");

  const handleSubmit = () => {
    if (!name || !category) {
      alert("请填写动作名称并选择部位");
      return;
    }
    onSave({ name, category, image });
    onBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="添加新动作" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.screenContainer}>
        <Text style={styles.label}>动作名称</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例如：单臂哑铃划船"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>选择部位</Text>
        <View style={styles.categoryRow}>
          {categories.map((c: string) => {
            const selected = c === category;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.categoryPill,
                  selected && styles.categoryPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selected && styles.categoryPillTextSelected,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>图片 URL（可选）</Text>
        <TextInput
          style={styles.input}
          value={image}
          onChangeText={setImage}
          placeholder="粘贴图片网址（可留空）"
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.primaryButton, { marginTop: 24 }]}
        >
          <Text style={styles.primaryButtonText}>保存动作</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ---------- 5. 今日训练计划 ----------
function WorkoutScreen({
  currentWorkout,
  exercises,
  logs,
  onBack,
  onSelectExercise,
  onRemoveExercise,
  onAddExercise,
}: any) {
  const workoutExercises = useMemo(() => {
    return currentWorkout
      .map((id: string) => exercises.find((e: Exercise) => e.id === id))
      .filter(Boolean)
      .map((exercise: Exercise) => {
        const exerciseLogs: LogItem[] = logs
          .filter((log: LogItem) => log.exerciseId === exercise.id)
          .sort(
            (a: LogItem, b: LogItem) =>
              (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );
        return {
          ...exercise,
          lastLogDate: exerciseLogs[0]?.date || "无记录",
        };
      });
  }, [currentWorkout, exercises, logs]);

  const availableExercises = useMemo(
    () =>
      exercises.filter(
        (e: Exercise) => !currentWorkout.includes(e.id)
      ),
    [currentWorkout, exercises]
  );

  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="今日训练计划" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.screenContainer}>
        <Text style={styles.sectionTitle}>
          待完成动作 ({workoutExercises.length} / {exercises.length})
        </Text>

        {workoutExercises.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              点击下方按钮添加动作，开始你的训练！
            </Text>
          </View>
        ) : (
          workoutExercises.map((exercise: any) => (
            <View key={exercise.id} style={styles.workoutItem}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => onSelectExercise(exercise.id)}
              >
                <Text style={styles.workoutName}>{exercise.name}</Text>
                <Text style={styles.workoutSub}>
                  上次：{exercise.lastLogDate}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onRemoveExercise(exercise.id)}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {!isAdding && (
          <TouchableOpacity
            onPress={() => setIsAdding(true)}
            style={[styles.primaryButton, { marginTop: 16 }]}
          >
            <Text style={styles.primaryButtonText}>
              + 从动作库中添加
            </Text>
          </TouchableOpacity>
        )}

        {isAdding && (
          <View style={styles.addBox}>
            <Text style={styles.label}>选择部位</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => {
                const selected = c === selectedCategory;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedCategory(c)}
                    style={[
                      styles.categoryPill,
                      selected && styles.categoryPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        selected && styles.categoryPillTextSelected,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {availableExercises.filter(
              (e: Exercise) => e.category === selectedCategory
            ).length === 0 ? (
              <Text style={styles.emptyText}>
                该部位所有动作均已加入计划。
              </Text>
            ) : (
              availableExercises
                .filter(
                  (e: Exercise) => e.category === selectedCategory
                )
                .map((exercise: Exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    onPress={() => onAddExercise(exercise.id)}
                    style={styles.addExerciseRow}
                  >
                    <Text style={styles.workoutName}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.addPlus}>+</Text>
                  </TouchableOpacity>
                ))
            )}

            <TouchableOpacity
              onPress={() => setIsAdding(false)}
              style={[
                styles.secondaryButton,
                { marginTop: 12, alignSelf: "stretch" },
              ]}
            >
              <Text style={styles.secondaryButtonText}>完成添加</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------- 头部 ----------
function Header({ title, onBack }: any) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
        <Text style={styles.headerBackText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

// ---------- 样式 ----------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#030712",
  },
  root: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    backgroundColor: "#111827",
    overflow: "hidden",
  },
  footer: {
    paddingVertical: 4,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#9ca3af",
  },
  screenContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#22d3ee",
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22d3ee",
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  userValue: {
    flex: 1,
    fontSize: 12,
    color: "#67e8f9",
    marginLeft: 4,
  },
  planButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  planButtonActive: {
    backgroundColor: "#dc2626",
  },
  planButtonIdle: {
    backgroundColor: "#16a34a",
  },
  planButtonAdd: {
    backgroundColor: "#4f46e5",
  },
  planButtonRemove: {
    backgroundColor: "#b91c1c",
  },
  planButtonText: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 10,
  },
  categoryText: {
    color: "#e5e7eb",
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#06b6d4",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#374151",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  exerciseImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#4b5563",
  },
  exerciseName: {
    fontSize: 16,
    color: "#e5e7eb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#1f2937",
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerBackText: {
    fontSize: 22,
    color: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    flex: 1,
  },
  detailImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#4b5563",
  },
  lastLogBox: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  lastLogTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22d3ee",
    marginBottom: 4,
  },
  lastLogText: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  setIndex: {
    width: 30,
    color: "#e5e7eb",
    fontWeight: "700",
  },
  setInput: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#f9fafb",
    textAlign: "center",
  },
  setMultiply: {
    marginHorizontal: 6,
    color: "#e5e7eb",
    fontSize: 16,
  },
  setButtonsRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 8,
  },
  logItem: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  logHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  logDate: {
    color: "#67e8f9",
    fontWeight: "600",
  },
  logCount: {
    color: "#e5e7eb",
  },
  logSetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  logSetLabel: {
    color: "#e5e7eb",
    fontSize: 13,
  },
  logSetValue: {
    color: "#e5e7eb",
    fontWeight: "500",
    fontSize: 13,
  },
  label: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "#f9fafb",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#374151",
    marginRight: 6,
    marginBottom: 6,
  },
  categoryPillSelected: {
    backgroundColor: "#06b6d4",
  },
  categoryPillText: {
    color: "#e5e7eb",
    fontSize: 13,
  },
  categoryPillTextSelected: {
    color: "#0f172a",
    fontWeight: "600",
  },
  emptyBox: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  workoutName: {
    color: "#22d3ee",
    fontSize: 16,
    fontWeight: "600",
  },
  workoutSub: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  removeText: {
    fontSize: 26,
    color: "#f97316",
    marginLeft: 8,
  },
  addBox: {
    marginTop: 16,
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
  },
  addExerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  addPlus: {
    color: "#22c55e",
    fontSize: 20,
    fontWeight: "700",
  },
});
