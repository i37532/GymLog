import { supabase, uploadImageToSupabase } from "@/lib/supabase"; // 引入你新建的 supabase 库
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

// 简单 UUID 生成器 (适配 PostgreSQL uuid 类型)
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type Exercise = {
  id: string;
  name: string;
  category: string;
  image?: string;
  createdAt?: { seconds: number };
};

export type SetItem = { weight: number; reps: number };

export type LogItem = {
  id: string;
  exerciseId: string;
  sets: SetItem[];
  date: string;
  createdAt?: { seconds: number };
};

type GymStore = {
  isLoading: boolean;
  exercises: Exercise[];
  logs: LogItem[];
  currentWorkout: string[];
  userId: string;
  workoutDoneByDate: Record<string, string[]>;
  toggleWorkoutDone: (exerciseId: string, date?: string) => void;
  clearWorkoutDoneForDate: (date?: string) => void;

  setCurrentWorkout: React.Dispatch<React.SetStateAction<string[]>>;

  addExercise: (data: Omit<Exercise, "id" | "createdAt">) => string;
  deleteExercise: (exerciseId: string) => void;

  addLog: (data: { exerciseId: string; sets: SetItem[] }) => void;
  deleteLog: (logId: string) => void;

  toggleWorkoutExercise: (exerciseId: string) => void;
  removeWorkoutExercise: (exerciseId: string) => void;

  initializeMockData: () => void;
};

const GymStoreContext = createContext<GymStore | null>(null);

const getLocalDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function GymStoreProvider({ children }: { children: React.ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<string[]>([]);
  const [workoutDoneByDate, setWorkoutDoneByDate] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // ----------------------------------------------------------------
  // 1. 初始化：登录 & 加载云端数据
  // ----------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        // 1.1 获取用户 (如果没有登录，尝试匿名登录，方便演示)
        let {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // ⚠️ 注意：这需要你在 Supabase Authentication 设置里开启 "Enable Anonymous Sign-ins"
          const { data: anonData, error } = await supabase.auth.signInAnonymously();
          if (!error && anonData.user) {
            user = anonData.user;
          } else {
            console.warn("Auth failed or Anon login disabled:", error);
            // 这里可以处理未登录逻辑，比如跳转登录页，但为了 Demo 先继续
          }
        }

        // 如果登录失败，临时生成一个符合 UUID 格式的 ID，避免数据库报格式错误
        // 注意：如果数据库开启了外键约束 (references auth.users)，这个随机 ID 依然会写入失败，必须解决登录问题
        const uid = user?.id || generateUUID(); 

        setUserId(uid);

        if (!user) {
          Alert.alert("提示", "未登录状态，无法连接云数据库，数据仅存储在内存中。");
          setIsLoading(false);
          return;
        }

        // 1.2 并行加载数据
        const [exercisesRes, logsRes, userStateRes] = await Promise.all([
          supabase.from("exercises").select("*").order("created_at", { ascending: true }),
          supabase.from("logs").select("*, sets(*)").order("date", { ascending: false }), // 联表查询 sets
          supabase.from("user_states").select("*").eq("user_id", uid).maybeSingle(),
        ]);

        if (exercisesRes.error) console.error("Load Exercises Error:", exercisesRes.error);
        if (logsRes.error) console.error("Load Logs Error:", logsRes.error);

        // 1.3 转换 Exercises 数据
        if (exercisesRes.data) {
          const loadedExercises: Exercise[] = exercisesRes.data.map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            image: e.image_url, // 数据库字段映射
            createdAt: { seconds: new Date(e.created_at).getTime() / 1000 },
          }));
          setExercises(loadedExercises);
        }

        // 1.4 转换 Logs 数据
        if (logsRes.data) {
          const loadedLogs: LogItem[] = logsRes.data.map((l: any) => ({
            id: l.id,
            exerciseId: l.exercise_id, // 数据库字段映射
            date: l.date,
            createdAt: { seconds: new Date(l.created_at).getTime() / 1000 },
            // 组数据转换
            sets: (l.sets || [])
              .sort((a: any, b: any) => a.set_index - b.set_index)
              .map((s: any) => ({
                weight: Number(s.weight),
                reps: Number(s.reps),
              })),
          }));
          setLogs(loadedLogs);
        }

        // 1.5 恢复用户状态 (User States)
        if (userStateRes.data) {
          if (userStateRes.data.current_workout_ids) {
            setCurrentWorkout(userStateRes.data.current_workout_ids);
          }
          if (userStateRes.data.workout_done_map) {
            setWorkoutDoneByDate(userStateRes.data.workout_done_map);
          }
        }
      } catch (e) {
        console.warn("Init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // ----------------------------------------------------------------
  // 2. 监听同步：CurrentWorkout & WorkoutDone -> UserStates
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!userId || isLoading) return;

    // 防抖同步，避免频繁写入
    const timer = setTimeout(() => {
      supabase
        .from("user_states")
        .upsert({
          user_id: userId,
          current_workout_ids: currentWorkout,
          workout_done_map: workoutDoneByDate,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error("Sync State Error:", error);
        });
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentWorkout, workoutDoneByDate, userId, isLoading]);

  // ----------------------------------------------------------------
  // 3. 业务方法实现 (Optimistic Update + Cloud Sync)
  // ----------------------------------------------------------------

  const addExercise = useCallback(
    (data: Omit<Exercise, "id" | "createdAt">) => {
      // 1. 本地乐观更新
      const tempId = generateUUID();
      const now = Date.now();
      const newEx: Exercise = {
        id: tempId,
        ...data,
        createdAt: { seconds: now / 1000 },
      };

      setExercises((prev) => [...prev, newEx]);

      // 2. 异步上传云端
      (async () => {
        try {
          let publicImageUrl = null;
          // 如果有本地图片，先上传
          if (data.image && data.image.startsWith("file://")) {
            publicImageUrl = await uploadImageToSupabase(data.image);
          }

          const { error } = await supabase.from("exercises").insert({
            id: tempId,
            user_id: userId,
            name: data.name,
            category: data.category,
            image_url: publicImageUrl, // 存 URL
            created_at: new Date(now).toISOString(),
          });

          if (error) throw error;

          // 3. 如果图片上传成功，更新本地状态里的 URL (可选)
          if (publicImageUrl) {
            setExercises((prev) =>
              prev.map((e) => (e.id === tempId ? { ...e, image: publicImageUrl } : e))
            );
          }
        } catch (e) {
          console.error("Add Exercise Failed:", e);
          Alert.alert("同步失败", "添加动作未能保存到云端");
          // 回滚本地状态
          setExercises((prev) => prev.filter((e) => e.id !== tempId));
        }
      })();

      return tempId;
    },
    [userId]
  );

  const deleteExercise = useCallback(
    (exerciseId: string) => {
      // 1. 本地更新
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
      setLogs((prev) => prev.filter((l) => l.exerciseId !== exerciseId));
      setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));
      setWorkoutDoneByDate((prev) => {
        const next: Record<string, string[]> = {};
        for (const [date, ids] of Object.entries(prev)) {
          const filtered = ids.filter((id) => id !== exerciseId);
          if (filtered.length > 0) next[date] = filtered;
        }
        return next;
      });

      // 2. 云端删除 (级联删除会搞定 logs 和 sets)
      supabase.from("exercises").delete().eq("id", exerciseId).then(({ error }) => {
        if (error) console.error("Delete Exercise Error:", error);
      });
    },
    []
  );

  const addLog = useCallback(
    (data: { exerciseId: string; sets: SetItem[] }) => {
      const logId = generateUUID();
      const now = new Date();
      const dateStr = getLocalDate(); // YYYY-MM-DD

      const newLog: LogItem = {
        id: logId,
        exerciseId: data.exerciseId,
        sets: data.sets,
        date: dateStr,
        createdAt: { seconds: now.getTime() / 1000 },
      };

      // 1. 本地更新
      setLogs((prev) => [...prev, newLog]);

      // 2. 云端写入
      (async () => {
        try {
          // 2.1 插入 Log
          const { error: logError } = await supabase.from("logs").insert({
            id: logId,
            user_id: userId,
            exercise_id: data.exerciseId,
            date: dateStr,
            created_at: now.toISOString(),
          });
          if (logError) throw logError;

          // 2.2 插入 Sets
          if (data.sets.length > 0) {
            const setsToInsert = data.sets.map((s, index) => ({
              log_id: logId,
              weight: s.weight,
              reps: s.reps,
              set_index: index, // 保持顺序
            }));

            const { error: setsError } = await supabase.from("sets").insert(setsToInsert);
            if (setsError) throw setsError;
          }
        } catch (e) {
          console.error("Add Log Failed:", e);
          Alert.alert("错误", "训练记录同步失败");
          setLogs((prev) => prev.filter((l) => l.id !== logId));
        }
      })();
    },
    [userId]
  );

  const deleteLog = useCallback((logId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    supabase.from("logs").delete().eq("id", logId).then(({ error }) => {
      if (error) console.error("Delete Log Error:", error);
    });
  }, []);

  const toggleWorkoutExercise = useCallback((exerciseId: string) => {
    setCurrentWorkout((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId]
    );
  }, []);

  const removeWorkoutExercise = useCallback((exerciseId: string) => {
    setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));
    // 清理今日完成状态
    const today = getLocalDate();
    setWorkoutDoneByDate((prev) => {
      const list = prev[today] ?? [];
      if (!list.includes(exerciseId)) return prev;
      return { ...prev, [today]: list.filter((id) => id !== exerciseId) };
    });
  }, []);

  const toggleWorkoutDone = useCallback((exerciseId: string, date?: string) => {
    const d = date ?? getLocalDate();
    setWorkoutDoneByDate((prev) => {
      const list = prev[d] ?? [];
      const next = list.includes(exerciseId)
        ? list.filter((id) => id !== exerciseId)
        : [...list, exerciseId];
      return { ...prev, [d]: next };
    });
  }, []);

  const clearWorkoutDoneForDate = useCallback((date?: string) => {
    const d = date ?? getLocalDate();
    setWorkoutDoneByDate((prev) => {
      const copy = { ...prev };
      delete copy[d];
      return copy;
    });
  }, []);

  const initializeMockData = useCallback(() => {
    if (exercises.length > 0) return;
    // 批量插入示例数据
    const mocks = [
        { name: "杠铃卧推", category: "胸部", image_url: "https://placehold.co/600x400/38bdf8/000000?text=Bench" },
        { name: "坐姿划船", category: "背部", image_url: "https://placehold.co/600x400/22c55e/000000?text=Row" },
        { name: "杠铃深蹲", category: "腿部", image_url: "https://placehold.co/600x400/f97316/000000?text=Squat" },
    ];

    mocks.forEach(m => {
        addExercise({ name: m.name, category: m.category, image: m.image_url });
    });
    Alert.alert("初始化", "正在后台创建示例数据...");
  }, [exercises.length, addExercise]);

  const value = useMemo<GymStore>(
    () => ({
      isLoading,
      exercises,
      logs,
      currentWorkout,
      userId,
      setCurrentWorkout,
      addExercise,
      deleteExercise,
      addLog,
      deleteLog,
      toggleWorkoutExercise,
      removeWorkoutExercise,
      initializeMockData,
      workoutDoneByDate,
      toggleWorkoutDone,
      clearWorkoutDoneForDate,
    }),
    [
      isLoading,
      exercises,
      logs,
      currentWorkout,
      userId,
      addExercise,
      deleteExercise,
      addLog,
      deleteLog,
      toggleWorkoutExercise,
      removeWorkoutExercise,
      initializeMockData,
      workoutDoneByDate,
      toggleWorkoutDone,
      clearWorkoutDoneForDate,
    ]
  );

  return <GymStoreContext.Provider value={value}>{children}</GymStoreContext.Provider>;
}

export function useGymStore() {
  const ctx = useContext(GymStoreContext);
  if (!ctx) throw new Error("useGymStore must be used within GymStoreProvider");
  return ctx;
}
