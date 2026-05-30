import type { ChecklistPeriod } from "@prisma/client";

export const PERIOD_ORDER: ChecklistPeriod[] = [
  "SIX_MONTHS",
  "THREE_MONTHS",
  "ONE_MONTH",
  "ONE_WEEK",
  "ONE_DAY",
  "AFTER",
];

export const PERIOD_LABELS: Record<ChecklistPeriod, string> = {
  SIX_MONTHS: "За 6 месяцев",
  THREE_MONTHS: "За 3 месяца",
  ONE_MONTH: "За месяц",
  ONE_WEEK: "За неделю",
  ONE_DAY: "В день свадьбы",
  AFTER: "После свадьбы",
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  items: { period: ChecklistPeriod; title: string }[];
};

const CLASSIC: ChecklistTemplate = {
  id: "classic",
  name: "Классическая свадьба",
  items: [
    { period: "SIX_MONTHS", title: "Определить бюджет свадьбы" },
    { period: "SIX_MONTHS", title: "Составить список гостей (предварительный)" },
    { period: "SIX_MONTHS", title: "Выбрать и забронировать площадку" },
    { period: "SIX_MONTHS", title: "Забронировать ведущего" },
    { period: "SIX_MONTHS", title: "Забронировать фотографа и видеографа" },
    { period: "SIX_MONTHS", title: "Определиться со стилистикой и цветовой гаммой" },

    { period: "THREE_MONTHS", title: "Выбрать платье невесты" },
    { period: "THREE_MONTHS", title: "Выбрать костюм жениха" },
    { period: "THREE_MONTHS", title: "Заказать торт" },
    { period: "THREE_MONTHS", title: "Согласовать меню с кейтерингом" },
    { period: "THREE_MONTHS", title: "Заказать декор и флористику" },
    { period: "THREE_MONTHS", title: "Разослать приглашения" },

    { period: "ONE_MONTH", title: "Финальная примерка нарядов" },
    { period: "ONE_MONTH", title: "Утвердить рассадку гостей" },
    { period: "ONE_MONTH", title: "Согласовать тайминг дня со всеми подрядчиками" },
    { period: "ONE_MONTH", title: "Подтвердить количество гостей" },
    { period: "ONE_MONTH", title: "Купить обручальные кольца" },

    { period: "ONE_WEEK", title: "Финальный созвон со всеми подрядчиками" },
    { period: "ONE_WEEK", title: "Передать организатору наличные/конверты для оплат" },
    { period: "ONE_WEEK", title: "Собрать «тревожный чемоданчик» (косметика, лекарства)" },
    { period: "ONE_WEEK", title: "Проверить готовность нарядов и аксессуаров" },

    { period: "ONE_DAY", title: "Контроль приезда декора и подрядчиков" },
    { period: "ONE_DAY", title: "Координация сбора невесты и жениха" },
    { period: "ONE_DAY", title: "Контроль тайминга банкета" },
    { period: "ONE_DAY", title: "Расчёт с подрядчиками" },

    { period: "AFTER", title: "Вернуть взятый в аренду реквизит" },
    { period: "AFTER", title: "Собрать отзывы у пары" },
    { period: "AFTER", title: "Передать фото/видео от подрядчиков" },
  ],
};

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [CLASSIC];

export function getTemplate(id: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find((t) => t.id === id);
}
