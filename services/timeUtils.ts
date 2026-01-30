import { TimeStep } from '../types';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseISODate = (dateStr: string): Date | null => {
  const match = ISO_DATE_REGEX.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

export const isValidISODate = (dateStr: string): boolean => {
  return !!parseISODate(dateStr);
};

export const formatISODate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysInMonth = (year: number, monthIndex: number): number => {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
};

const addMonthsUTC = (date: Date, months: number): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const maxDay = daysInMonth(targetYear, normalizedMonth);
  const nextDay = Math.min(day, maxDay);
  return new Date(Date.UTC(targetYear, normalizedMonth, nextDay));
};

const addYearsUTC = (date: Date, years: number): Date => {
  return addMonthsUTC(date, years * 12);
};

export const addTimeStep = (dateStr: string, step: TimeStep): string | null => {
  const date = parseISODate(dateStr);
  if (!date) return null;
  let next: Date;
  switch (step) {
    case 'Day':
      next = new Date(date);
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'Week':
      next = new Date(date);
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'Month':
      next = addMonthsUTC(date, 1);
      break;
    case 'Year':
      next = addYearsUTC(date, 1);
      break;
    default:
      return null;
  }
  return formatISODate(next);
};

export const randomDateInYear = (year: number): string | null => {
  if (!Number.isFinite(year)) return null;
  const safeYear = Math.floor(year);
  if (safeYear < 1000 || safeYear > 3000) return null;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * daysInMonth(safeYear, month)) + 1;
  return formatISODate(new Date(Date.UTC(safeYear, month, day)));
};

export const calculateAge = (birthdayStr: string, dateStr: string): number | null => {
  const birthday = parseISODate(birthdayStr);
  const date = parseISODate(dateStr);
  if (!birthday || !date) return null;

  let age = date.getUTCFullYear() - birthday.getUTCFullYear();
  const monthDiff = date.getUTCMonth() - birthday.getUTCMonth();
  const dayDiff = date.getUTCDate() - birthday.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return Math.max(0, age);
};

export const isAfterOrEqual = (a: string, b: string): boolean => {
  const dateA = parseISODate(a);
  const dateB = parseISODate(b);
  if (!dateA || !dateB) return false;
  return dateA.getTime() >= dateB.getTime();
};

export const isOnOrBeforeToday = (dateStr: string, todayOverride?: string): boolean => {
  const date = parseISODate(dateStr);
  if (!date) return false;
  const today = todayOverride ? parseISODate(todayOverride) : null;
  const now = new Date();
  const todayDate = today || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!todayDate) return false;
  return date.getTime() <= todayDate.getTime();
};
