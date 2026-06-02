import { z } from "zod";

// Создание анкеты-запроса (с нуля или из шаблона)
export const createQuestionnaireSchema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  message: z.string().max(2000).optional().or(z.literal("")),
  questions: z
    .array(z.string().trim().min(1).max(1000))
    .min(1, "Добавьте хотя бы один вопрос")
    .max(100),
});
export type CreateQuestionnaireInput = z.infer<
  typeof createQuestionnaireSchema
>;

// Slug разделов, к которым можно привязать задачу (плашка у пары)
export const requestLinkEnum = z.enum([
  "guests",
  "seating",
  "documents",
  "schedule",
]);
export const REQUEST_LINK_LABELS: Record<string, string> = {
  guests: "Гости",
  seating: "Рассадка",
  documents: "Документы",
  schedule: "Расписание",
};

export const createTaskSchema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  message: z.string().max(2000).optional().or(z.literal("")),
  linkTo: requestLinkEnum.optional().or(z.literal("")),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// Ответ пары на анкету: текст по каждому вопросу (может быть пустым)
export const answerSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      text: z.string().max(4000),
    }),
  ),
});
export type AnswerInput = z.infer<typeof answerSchema>;

// Ответ пары на задачу
export const completeTaskSchema = z.object({
  reply: z.string().max(4000).optional().or(z.literal("")),
});
