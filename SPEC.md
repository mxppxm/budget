# iOS 极简记账 App 技术方案设计文档

## 1. 系统架构

采用 **Local-First 纯本地架构**，无网络层，数据直接持久化到设备 SQLite。

```
[ UI 视图层 (React Native / SwiftUI) ]
              ▲
              │ (响应式更新)
[ 状态管理层 (Context / Hooks / Store) ]
              ▲
              │ (SQL 查询)
[ 数据持久化层 (Expo-SQLite / CoreData) ]
              │
              ▼
[ iOS 设备本地存储 ]
```

---

## 2. 数据库表结构

### 2.1 账目明细表 `records`

| 字段 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID |
| `amount` | REAL | NOT NULL | 金额（元，保留两位小数） |
| `type` | VARCHAR(10) | NOT NULL | `expense` / `income` |
| `category` | VARCHAR(20) | NOT NULL | 预设分类名 |
| `date` | VARCHAR(10) | NOT NULL | 日期 `YYYY-MM-DD` |
| `remark` | TEXT | NULL | 备注（限20字） |
| `created_at` | INTEGER | NOT NULL | 创建时间戳（毫秒） |

### 2.2 预算配置表 `budgets`

| 字段 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `month` | VARCHAR(7) | PRIMARY KEY | `YYYY-MM` |
| `total_budget` | REAL | NOT NULL DEFAULT 0 | 月预算金额 |
| `is_open` | INTEGER | NOT NULL DEFAULT 0 | 开关：`0` 关闭，`1` 开启 |

---

## 3. 核心业务逻辑

### 3.1 预算状态机

```
消耗率 = 当月累计支出 / 当月总预算 × 100%

状态判定：
- 消耗率 < 80%     → SAFE   (绿色)
- 80% ≤ 比率 < 100% → WARNING (黄色)
- 消耗率 ≥ 100%    → OVER   (红色)
```

```typescript
function getBudgetStatus(expense: number, budget: number, isOpen: boolean) {
  if (!isOpen || budget <= 0) return 'DISABLED';
  const ratio = expense / budget;
  if (ratio < 0.8) return 'SAFE';
  if (ratio < 1.0) return 'WARNING';
  return 'OVER';
}
```

### 3.2 首页流水聚合结构

```typescript
interface DaySection {
  title: string;        // "2026-05-18"
  dayTotalExpense: number;
  dayTotalIncome: number;
  data: RecordItem[];
}
```

---

## 4. SQL 语句

### 4.1 建表

```sql
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    remark TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
    month TEXT PRIMARY KEY NOT NULL,
    total_budget REAL NOT NULL DEFAULT 0,
    is_open INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
```

### 4.2 查询

**某月流水列表（首页）**
```sql
SELECT * FROM records
WHERE date LIKE '2026-05%'
ORDER BY date DESC, created_at DESC;
```

**某月收支汇总**
```sql
SELECT
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
FROM records
WHERE date LIKE '2026-05%';
```

**某月分类支出排行**
```sql
SELECT category, SUM(amount) as total_amount
FROM records
WHERE date LIKE '2026-05%' AND type = 'expense'
GROUP BY category
ORDER BY total_amount DESC;
```

---

## 5. Haptics 封装

```typescript
import * as Haptics from 'expo-haptics';

export const triggerHaptic = (type: 'light' | 'success' | 'warning') => {
  switch (type) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
  }
};
```

---

## 6. 约束

1. **直接落盘**：所有增删改查必须直接操作 SQLite，不用内存缓存替代，防止后台被杀丢失数据
2. **本地时区**：`date` 字段统一用本地时区 `YYYY-MM-DD` 字符串，不使用 UTC 时间戳
3. **列表懒加载**：流水列表使用 `FlatList` / `SectionList`，单次查询不超过 100 条