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
