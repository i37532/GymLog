# 🐞 Known Bugs

## 📱 Android

### 1. 画面显示过于靠上 ✅ Fixed
- **现象**：页面内容在 Android 真机上被状态栏覆盖
- **原因**：使用 react-native 自带 SafeAreaView，在 Android 上不稳定
- **修复**：改用 react-native-safe-area-context，并在根布局包裹 SafeAreaProvider
- **状态**：已修复

### 1.训练部位，点击具体部位（details），点击返回，应该是返回到训练部位，而不是主页
### 2.训练部位里面点击添加动作，正常返回，但是再次点击返回，会报错
