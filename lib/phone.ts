/**
 * Телефон как логин-идентификатор (вход без email/смс).
 * Чистый модуль без БД — можно импортировать и на клиенте, и на сервере.
 *
 * Канонический вид: 11 цифр, начинается с 7 (РФ). Например "79991234567".
 */

/** Приводит произвольный ввод к каноническому "7XXXXXXXXXX" или null. */
export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  let d = digits;
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d; // ввели без кода страны
  if (d.length === 11 && d.startsWith("7")) return d;
  return null;
}

/** Красивый вид для отображения: +7 (999) 123-45-67 */
export function formatPhone(canonical: string): string {
  const d = normalizePhone(canonical);
  if (!d) return canonical;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

/**
 * Логин-идентификатор для Better-Auth (движок ждёт email-строку).
 * Телефон не отправляет писем — это синтетический уникальный ключ входа.
 */
export function phoneToLoginEmail(canonical: string): string {
  return `${canonical}@phone.svadba`;
}
