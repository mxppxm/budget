import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Record as LedgerRecord, Budget, MonthlySummary, CategoryRanking, DaySection } from '../types';
import {
  getRecordsByMonth,
  getMonthlySummary,
  getAllMonthlySummaries,
  getCategoryRanking,
  insertRecord,
  deleteRecord,
  getBudget,
  upsertBudget,
} from '../lib/db';
import { getMonthString } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../constants/categories';

interface State {
  records: LedgerRecord[];
  currentMonth: string;
  budget: Budget | null;
  monthlySummary: MonthlySummary;
  categoryRanking: CategoryRanking[];
  hasSeenWarning: boolean;
  isLoading: boolean;
  allMonthlyHistory: { month: string; total_expense: number; total_income: number }[];
}

type Action =
  | { type: 'LOAD_RECORDS'; records: LedgerRecord[] }
  | { type: 'ADD_RECORD'; record: LedgerRecord }
  | { type: 'DELETE_RECORD'; id: string }
  | { type: 'SET_MONTH'; month: string }
  | { type: 'SET_BUDGET'; budget: Budget | null }
  | { type: 'LOAD_STATS'; summary: MonthlySummary; ranking: CategoryRanking[] }
  | { type: 'SET_WARNING_SEEN' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ALL_MONTHLY_HISTORY'; history: { month: string; total_expense: number; total_income: number }[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_RECORDS':
      return { ...state, records: action.records };
    case 'ADD_RECORD':
      return { ...state, records: [action.record, ...state.records] };
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter((r) => r.id !== action.id) };
    case 'SET_MONTH':
      return { ...state, currentMonth: action.month };
    case 'SET_BUDGET':
      return { ...state, budget: action.budget };
    case 'LOAD_STATS':
      return { ...state, monthlySummary: action.summary, categoryRanking: action.ranking };
    case 'SET_WARNING_SEEN':
      return { ...state, hasSeenWarning: true };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ALL_MONTHLY_HISTORY':
      return { ...state, allMonthlyHistory: action.history };
    default:
      return state;
  }
}

interface RecordStoreContextValue {
  state: State;
  loadData: (month?: string) => Promise<void>;
  loadAllMonthlyHistory: () => Promise<void>;
  addRecord: (record: Omit<LedgerRecord, 'id' | 'created_at'>) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  setMonth: (month: string) => void;
  setBudget: (budget: Budget) => Promise<void>;
  markWarningSeen: () => void;
  groupRecordsByDay: (records: LedgerRecord[]) => DaySection[];
}

const RecordStoreContext = createContext<RecordStoreContextValue | null>(null);

export function RecordStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    records: [],
    currentMonth: getMonthString(),
    budget: null,
    monthlySummary: { total_expense: 0, total_income: 0 },
    categoryRanking: [],
    hasSeenWarning: false,
    isLoading: true,
    allMonthlyHistory: [],
  });

  const loadAllMonthlyHistory = useCallback(async () => {
    const history = await getAllMonthlySummaries();
    dispatch({ type: 'SET_ALL_MONTHLY_HISTORY', history });
  }, []);

  const loadData = useCallback(async (month?: string) => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    const targetMonth = month ?? state.currentMonth;

    const [records, summary, ranking, budget] = await Promise.all([
      getRecordsByMonth(targetMonth),
      getMonthlySummary(targetMonth),
      getCategoryRanking(targetMonth),
      getBudget(targetMonth),
    ]);

    dispatch({ type: 'LOAD_RECORDS', records });
    dispatch({ type: 'LOAD_STATS', summary, ranking });
    dispatch({ type: 'SET_BUDGET', budget });
    dispatch({ type: 'SET_MONTH', month: targetMonth });
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }, [state.currentMonth]);

  const addRecord = useCallback(
    async (record: Omit<LedgerRecord, 'id' | 'created_at'>) => {
      const id = generateId();
      const created_at = Date.now();
      const newRecord: LedgerRecord = { ...record, id, created_at };
      await insertRecord(newRecord);
      dispatch({ type: 'ADD_RECORD', record: newRecord });
      // Reload stats
      const [summary, ranking] = await Promise.all([
        getMonthlySummary(state.currentMonth),
        getCategoryRanking(state.currentMonth),
      ]);
      dispatch({ type: 'LOAD_STATS', summary, ranking });
    },
    [state.currentMonth]
  );

  const removeRecord = useCallback(
    async (id: string) => {
      await deleteRecord(id);
      dispatch({ type: 'DELETE_RECORD', id });
      const [summary, ranking] = await Promise.all([
        getMonthlySummary(state.currentMonth),
        getCategoryRanking(state.currentMonth),
      ]);
      dispatch({ type: 'LOAD_STATS', summary, ranking });
    },
    [state.currentMonth]
  );

  const setMonth = useCallback((month: string) => {
    dispatch({ type: 'SET_MONTH', month });
  }, []);

  const setBudget = useCallback(async (budget: Budget) => {
    const categoryBudgets: Budget['category_budgets'] = {};
    for (const category of EXPENSE_CATEGORIES) {
      const value = Number(budget.category_budgets?.[category.label]) || 0;
      if (value > 0) categoryBudgets[category.label] = value;
    }
    const normalizedBudget = {
      ...budget,
      category_budgets: categoryBudgets,
    };
    await upsertBudget(normalizedBudget);
    dispatch({ type: 'SET_BUDGET', budget: normalizedBudget });
  }, []);

  const markWarningSeen = useCallback(() => {
    dispatch({ type: 'SET_WARNING_SEEN' });
  }, []);

  const groupRecordsByDay = useCallback((records: LedgerRecord[]): DaySection[] => {
    const groups: globalThis.Record<string, LedgerRecord[]> = {};
    for (const record of records) {
      if (!groups[record.date]) groups[record.date] = [];
      groups[record.date].push(record);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([title, data]) => ({
        title,
        dayTotalExpense: data
          .filter((r) => r.type === 'expense')
          .reduce((sum, r) => sum + r.amount, 0),
        dayTotalIncome: data
          .filter((r) => r.type === 'income')
          .reduce((sum, r) => sum + r.amount, 0),
        data,
      }));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <RecordStoreContext.Provider
      value={{ state, loadData, loadAllMonthlyHistory, addRecord, removeRecord, setMonth, setBudget, markWarningSeen, groupRecordsByDay }}
    >
      {children}
    </RecordStoreContext.Provider>
  );
}

export function useRecordStore(): RecordStoreContextValue {
  const ctx = useContext(RecordStoreContext);
  if (!ctx) throw new Error('useRecordStore must be used within RecordStoreProvider');
  return ctx;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
