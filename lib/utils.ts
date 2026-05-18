import type { BudgetStatus } from '../types';

export function getBudgetStatus(
  expense: number,
  budget: number,
  isOpen: boolean
): BudgetStatus {
  if (!isOpen || budget <= 0) return 'DISABLED';
  const ratio = expense / budget;
  if (ratio < 0.8) return 'SAFE';
  if (ratio < 1.0) return 'WARNING';
  return 'OVER';
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(month)}月${parseInt(day)}日`;
}

export function getMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `${parseInt(year) % 100}年${parseInt(month)}月`;
}

export function getPrevMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return getMonthString(date);
}

export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month, 1);
  return getMonthString(date);
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
