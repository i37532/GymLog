# 🐞 Known Bugs

## 📱 Android

### 1. 画面显示过于靠上 ✅ Fixed
- **现象**：页面内容在 Android 真机上被状态栏覆盖
- **原因**：使用 react-native 自带 SafeAreaView，在 Android 上不稳定
- **修复**：改用 react-native-safe-area-context，并在根布局包裹 SafeAreaProvider
- **状态**：✅ 已修复

## 🧭 Navigation / Routing

### 2. 部位列表 → 详情页 → 返回回到主页（应回到部位列表） ✅ Fixed
- **现象**：从训练部位（List）进入某个动作详情（Detail），点击返回回到主页
- **原因**：Detail 使用 `router.back()`，在隐藏 Tabs routes 下返回栈不稳定
- **修复**：List→Detail 传 `from=list&category=...`，Detail 返回使用 `router.replace("/(tabs)/list?category=...")`
- **状态**：✅ 已修复

### 3. 部位列表 → 添加动作 → 返回后再返回报错（GO_BACK not handled） ✅ Fixed
- **现象**：从 List 进入 Add，返回到 List 后，再点 List 返回出现 `GO_BACK was not handled...`
- **原因**：使用 `router.back()` 但返回栈为空/不一致（replace 导致）
- **修复**：List / Detail / Add 返回统一使用明确 `router.replace(...)`，避免依赖 back 栈
- **状态**：✅ 已修复

### 4. 从不同部位进入 Add，分类没有自动切换 ✅ Fixed
- **现象**：先从 A 部位进入 Add，再从 B 部位进入 Add，分类仍停留在 A
- **原因**：`useState(initialCategory)` 只初始化一次，页面复用时不更新
- **修复**：监听 `params.category` 变化，`useEffect` 同步更新 `category` state
- **状态**：✅ 已修复


### 1.具体部位加入今日计划这里有点问题：
1.加入训练计划有时候会直接显示已完成，我不清楚这个已完成的逻辑是什么
2.今日训练计划点击具体部位，直接返回主页，而不是今日训练计划。
