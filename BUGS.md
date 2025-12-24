# 🐞 Known Bugs

## 📱 Android

### 1. 画面显示过于靠上 ✅ Fixed
- **现象**：页面内容在 Android 真机上被状态栏覆盖
- **原因**：使用 react-native 自带 SafeAreaView，在 Android 上不稳定
- **修复**：改用 react-native-safe-area-context，并在根布局包裹 SafeAreaProvider
- **状态**：已修复
