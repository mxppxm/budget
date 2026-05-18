import * as SQLite from 'expo-sqlite';
import type { Record, Budget, CategoryBudgets, MonthlySummary, CategoryRanking } from '../types';
import { EXPENSE_CATEGORIES } from '../constants/categories';

interface BudgetRow {
  month: string;
  is_open: number;
  category_budgets: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('budget.db');
  await initDb(db);
  return db;
}

async function initDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
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
      is_open INTEGER NOT NULL DEFAULT 0,
      category_budgets TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
  `);

  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(budgets)`);
  if (!columns.some((column) => column.name === 'category_budgets')) {
    await database.execAsync(`ALTER TABLE budgets ADD COLUMN category_budgets TEXT;`);
  }
}

export async function getRecordsByMonth(month: string): Promise<Record[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<Record>(
    `SELECT * FROM records WHERE date LIKE ? ORDER BY date DESC, created_at DESC`,
    [`${month}%`]
  );
  return rows;
}

export async function getAllMonthlySummaries(): Promise<{ month: string; total_expense: number; total_income: number }[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ month: string; total_expense: number; total_income: number }>(
    `SELECT
      substr(date, 1, 7) as month,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
    FROM records
    GROUP BY substr(date, 1, 7)
    ORDER BY month DESC`
  );
  return rows;
}

export async function getMonthlySummary(
  month: string
): Promise<MonthlySummary> {
  const database = await getDb();
  const row = await database.getFirstAsync<MonthlySummary>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
    FROM records WHERE date LIKE ?`,
    [`${month}%`]
  );
  return row ?? { total_expense: 0, total_income: 0 };
}

export async function getCategoryRanking(
  month: string
): Promise<CategoryRanking[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<CategoryRanking>(
    `SELECT category, SUM(amount) as total_amount
    FROM records
    WHERE date LIKE ? AND type = 'expense'
    GROUP BY category
    ORDER BY total_amount DESC`,
    [`${month}%`]
  );
  return rows;
}

export async function insertRecord(
  record: Record
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO records (id, amount, type, category, date, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.amount, record.type, record.category, record.date, record.remark ?? null, record.created_at]
  );
}

export async function deleteRecord(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM records WHERE id = ?`, [id]);
}

export async function getBudget(month: string): Promise<Budget | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<BudgetRow>(
    `SELECT * FROM budgets WHERE month = ?`,
    [month]
  );
  if (!row) return null;
  const categoryBudgets = parseCategoryBudgets(row.category_budgets);
  return {
    month: row.month,
    is_open: row.is_open,
    category_budgets: categoryBudgets,
  };
}

export async function upsertBudget(budget: Budget): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO budgets (month, is_open, category_budgets) VALUES (?, ?, ?)`,
    [budget.month, budget.is_open, JSON.stringify(budget.category_budgets ?? {})]
  );
}

function parseCategoryBudgets(value: string | null): CategoryBudgets {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const budgets: CategoryBudgets = {};
    const activeCategories = new Set(EXPENSE_CATEGORIES.map((category) => category.label));
    for (const [category, amount] of Object.entries(parsed)) {
      const normalizedAmount = Number(amount) || 0;
      if (activeCategories.has(category) && normalizedAmount > 0) budgets[category] = normalizedAmount;
    }
    return budgets;
  } catch {
    return {};
  }
}

export async function exportAllData(): Promise<{ records: Record[]; budgets: Budget[] }> {
  const database = await getDb();
  const records = await database.getAllAsync<Record>(`SELECT * FROM records ORDER BY date DESC, created_at DESC`);
  const budgetRows = await database.getAllAsync<BudgetRow>(`SELECT * FROM budgets`);
  const budgets: Budget[] = budgetRows.map((row) => ({
    month: row.month,
    is_open: row.is_open,
    category_budgets: parseCategoryBudgets(row.category_budgets),
  }));
  return { records, budgets };
}

export async function importData(data: { records: Record[]; budgets: Budget[] }): Promise<void> {
  const database = await getDb();
  for (const record of data.records) {
    await database.runAsync(
      `INSERT OR REPLACE INTO records (id, amount, type, category, date, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.amount, record.type, record.category, record.date, record.remark ?? null, record.created_at]
    );
  }
  for (const budget of data.budgets) {
    await database.runAsync(
      `INSERT OR REPLACE INTO budgets (month, is_open, category_budgets) VALUES (?, ?, ?)`,
      [budget.month, budget.is_open, JSON.stringify(budget.category_budgets ?? {})]
    );
  }
}

export async function deleteAllRecords(): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM records`);
}
