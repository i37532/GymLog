# 📝 TODO

## ✅ Done
- 选择训练部位进入列表后，底部固定栏可直接添加该部位动作（Add 自动预选分类；保存/返回回到列表）

## 🚧 Core Features
- 云同步（账号/多端）

## 🎨 UI / UX
- 动作列表支持搜索/排序
- 训练记录展示：按日期分组 / 快速复制上一条
- 导出/备份数据（JSON / zip）

## 🔧 Tech Debt
- 路由结构优化：将 list/detail/add/workout 从 Tabs hidden screens 迁移到 Stack（可提升 back 行为一致性）
- 增加导航参数类型守卫（params string/string[]）

## 📦 Later / Ideas
- 统计页（周/月训练量、PR）
