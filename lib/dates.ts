import { formatInTimeZone } from "date-fns-tz";
import { ru } from "date-fns/locale";

/**
 * Дата свадьбы хранится как дата без точного времени (T00:00:00Z).
 * Форматируем в UTC, чтобы не было сдвига дня от таймзоны сервера/клиента.
 */
export function formatWeddingDate(date: Date): string {
  return formatInTimeZone(date, "UTC", "d MMMM yyyy", { locale: ru });
}

export function formatShortDate(date: Date): string {
  return formatInTimeZone(date, "UTC", "dd.MM.yyyy");
}

/** Короткая дата dd.MM (UTC — тот же день, что formatWeddingDate) */
export function formatDayMonth(date: Date): string {
  return formatInTimeZone(date, "UTC", "dd.MM");
}

/** Сколько дней до даты (от сегодня, UTC-нормализация по дню) */
export function daysUntil(date: Date): number {
  const today = new Date();
  const startToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const target = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((target - startToday) / (1000 * 60 * 60 * 24));
}

/** Парсит строку "YYYY-MM-DD" из date-input в UTC-полночь */
export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date → "YYYY-MM-DD" для value date-input (в UTC) */
export function toDateInputValue(date: Date): string {
  return formatInTimeZone(date, "UTC", "yyyy-MM-dd");
}
