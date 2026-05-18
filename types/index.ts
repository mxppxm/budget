export interface Record {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string; // YYYY-MM-DD
  remark: string | null;
  created_at: number; // milliseconds
}

export interface Budget {
  month: string; // YYYY-MM
  total_budget: number;
  is_open: number; // 0 or 1
  category_budgets: CategoryBudgets;
}

export type CategoryBudgets = { [category: string]: number };

export interface DaySection {
  title: string; // date string YYYY-MM-DD
  dayTotalExpense: number;
  dayTotalIncome: number;
  data: Record[];
}

export interface MonthlySummary {
  total_expense: number;
  total_income: number;
}

export interface CategoryRanking {
  category: string;
  total_amount: number;
}

export type BudgetStatus = 'DISABLED' | 'SAFE' | 'WARNING' | 'OVER';
