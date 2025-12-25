# 📱 GymLog

GymLog 是一个基于 **Expo + React Native + TypeScript** 的健身记录 App，用于记录训练内容、追踪训练习惯，同时作为个人 React Native 学习与实践项目持续迭代。

---

## ✨ Features

- 🏋️ 训练记录（按日期记录训练内容）
- 📆 基础日志结构（训练 → 动作 → 组数 / 次数）
- 📱 跨平台运行（Android / iOS via Expo）
- 🚧 持续开发中

---

## 🛠 Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Routing**: Expo Router
- **State Management**: React Hooks
- **Package Manager**: npm

---

## 📦 Project Structure

```text
GymLog/
├─ app/              # 页面与路由
├─ assets/           # 图片、图标等静态资源
├─ app.json          # Expo 配置
├─ eas.json          # Expo EAS 配置
├─ package.json
├─ tsconfig.json
├─ README.md
├─ TODO.md
└─ BUGS.md
```
## 🚀 Getting Started

### 1️⃣ Prerequisites

- Node.js **LTS**
- npm
- Expo Go（Android / iOS）

---

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/i37532/GymLog.git
cd GymLog
```

---

### 3️⃣ Install Dependencies

```bash
npm ci
# 或
npm install
```

---

### 4️⃣ Run the Project

```bash
npx expo start 
或
npx expo start --lan -c 
或
npx expo start --tunnel -c
```

使用手机上的 **Expo Go** 扫码运行（手机与电脑需在同一网络）。

---

## 🧭 Development Status

> 本项目为个人学习与实践项目，功能与架构会随着学习过程持续调整和重构。

---

## 📝 TODO

请查看 [`TODO.md`](./TODO.md)

---

## 🐞 Known Issues

请查看 [`BUGS.md`](./BUGS.md)

---

## 📄 License

MIT License