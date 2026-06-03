import { z } from "zod";

export const templateTypeEnum = z.enum([
  "QUESTIONNAIRE",
  "CHECKLIST",
  "TIMELINE",
  "BUDGET",
]);

export const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  QUESTIONNAIRE: "Анкета",
  CHECKLIST: "Чек-лист",
  TIMELINE: "Тайминг",
  BUDGET: "Бюджет",
};

// Этап 1: шаблон-анкета — название + список вопросов (свободный текст).
export const questionnaireTemplateSchema = z.object({
  name: z.string().min(1, "Введите название").max(200),
  questions: z
    .array(z.string().trim().min(1).max(1000))
    .min(1, "Добавьте хотя бы один вопрос")
    .max(100),
});
export type QuestionnaireTemplateInput = z.infer<
  typeof questionnaireTemplateSchema
>;

// Этап 2: шаблоны-списки. content хранится как {items:[...]}.
const checklistPeriodEnum = z.enum([
  "SIX_MONTHS",
  "THREE_MONTHS",
  "ONE_MONTH",
  "ONE_WEEK",
  "ONE_DAY",
  "AFTER",
]);

export const checklistTemplateSchema = z.object({
  name: z.string().min(1, "Введите название").max(200),
  items: z
    .array(
      z.object({
        period: checklistPeriodEnum,
        title: z.string().trim().min(1).max(300),
      }),
    )
    .min(1, "Добавьте хотя бы один пункт")
    .max(300),
});

export const timelineTemplateSchema = z.object({
  name: z.string().min(1, "Введите название").max(200),
  items: z
    .array(
      z.object({
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время ЧЧ:ММ"),
        durationMin: z.coerce.number().int().min(0).max(1440).default(0),
        title: z.string().trim().min(1).max(300),
      }),
    )
    .min(1, "Добавьте хотя бы одно событие")
    .max(300),
});

export const budgetTemplateSchema = z.object({
  name: z.string().min(1, "Введите название").max(200),
  items: z
    .array(z.object({ name: z.string().trim().min(1).max(200) }))
    .min(1, "Добавьте хотя бы одну статью")
    .max(300),
});
