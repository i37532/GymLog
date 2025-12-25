import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

const STORAGE_KEYS = {
  exercises: "gym_exercises",
  logs: "gym_logs",
  currentWorkout: "gym_current_workout",
  workoutDoneByDate: "gym_workout_done_by_date",
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
  const [isLoading, setIsLoading] = useState(true);
  const [workoutDoneByDate, setWorkoutDoneByDate] = useState<Record<string, string[]>>({});

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

  const userId = "LOCAL_USER_ANDROID";

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [ex, lg, cw, wd] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.exercises),
          AsyncStorage.getItem(STORAGE_KEYS.logs),
          AsyncStorage.getItem(STORAGE_KEYS.currentWorkout),
          AsyncStorage.getItem(STORAGE_KEYS.workoutDoneByDate),
        ]);
        if (ex) setExercises(JSON.parse(ex));
        if (lg) setLogs(JSON.parse(lg));
        if (cw) setCurrentWorkout(JSON.parse(cw));
        if (wd) setWorkoutDoneByDate(JSON.parse(wd));

      } catch (e) {
        console.warn("load error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(exercises)).catch(() => {});
  }, [exercises]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs)).catch(() => {});
  }, [logs]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.currentWorkout, JSON.stringify(currentWorkout)).catch(() => {});
  }, [currentWorkout]);

  useEffect(() => {
  AsyncStorage.setItem(STORAGE_KEYS.workoutDoneByDate, JSON.stringify(workoutDoneByDate)).catch(() => {});
  }, [workoutDoneByDate]);


  const addExercise = useCallback((data: Omit<Exercise, "id" | "createdAt">) => {
    const id = `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ex: Exercise = { id, ...data, createdAt: { seconds: Date.now() / 1000 } };
    setExercises((prev) => [...prev, ex]);
    return id;
  }, []);

    const deleteExercise = useCallback((exerciseId: string) => {
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
      setLogs((prev) => prev.filter((l) => l.exerciseId !== exerciseId));
      setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));

      // ✅ 同时清理“手动完成”状态里的残留
      setWorkoutDoneByDate((prev) => {
        const next: Record<string, string[]> = {};
        for (const [date, ids] of Object.entries(prev)) {
          const filtered = ids.filter((id) => id !== exerciseId);
          if (filtered.length > 0) next[date] = filtered;
        }
        return next;
      });
    }, []);


    const addLog = useCallback((data: { exerciseId: string; sets: SetItem[] }) => {
      const id = `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const log: LogItem = {
        id,
        ...data,
        date: getLocalDate(),
        createdAt: { seconds: Date.now() / 1000 },
      };
      setLogs((prev) => [...prev, log]);
      // setCurrentWorkout((prev) => prev.filter((x) => x !== data.exerciseId));
    },
    []
  );

  const deleteLog = useCallback((logId: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }, []);

  const toggleWorkoutExercise = useCallback((exerciseId: string) => {
    setCurrentWorkout((prev) => (prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId]));
  }, []);

  const removeWorkoutExercise = useCallback((exerciseId: string) => {
    setCurrentWorkout((prev) => prev.filter((id) => id !== exerciseId));
  }, []);

  const initializeMockData = useCallback(() => {
    if (exercises.length > 0) return;
    const now = Date.now() / 1000;
    const mocks: Exercise[] = [
      { id: `e-mock-0-${Date.now()}`, name: "杠铃卧推", category: "胸部", image: "https://placehold.co/600x400/38bdf8/000000?text=Bench", createdAt: { seconds: now } },
      { id: `e-mock-1-${Date.now()}`, name: "坐姿划船", category: "背部", image: "https://placehold.co/600x400/22c55e/000000?text=Row", createdAt: { seconds: now + 1 } },
      { id: `e-mock-2-${Date.now()}`, name: "杠铃深蹲", category: "腿部", image: "https://placehold.co/600x400/f97316/000000?text=Squat", createdAt: { seconds: now + 2 } },
      { id: `e-mock-3-${Date.now()}`, name: "站姿推举", category: "肩部", image: "https://placehold.co/600x400/c026d3/000000?text=Press", createdAt: { seconds: now + 3 } },
      { id: `e-mock-4-${Date.now()}`, name: "杠铃弯举", category: "手臂", image: "https://placehold.co/600x400/facc15/000000?text=Curl", createdAt: { seconds: now + 4 } },
      { id: `e-mock-5-${Date.now()}`, name: "悬垂举腿", category: "核心", image: "https://placehold.co/600x400/14b8a6/000000?text=Core", createdAt: { seconds: now + 5 } },
    ];
    setExercises((prev) => [...prev, ...mocks]);
  }, [exercises.length]);

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
    [isLoading, exercises, logs, currentWorkout, addExercise, deleteExercise, addLog, deleteLog, toggleWorkoutExercise, removeWorkoutExercise, initializeMockData, workoutDoneByDate, toggleWorkoutDone, clearWorkoutDoneForDate]
  );

  return <GymStoreContext.Provider value={value}>{children}</GymStoreContext.Provider>;
}

export function useGymStore() {
  const ctx = useContext(GymStoreContext);
  if (!ctx) throw new Error("useGymStore must be used within GymStoreProvider");
  return ctx;
}
