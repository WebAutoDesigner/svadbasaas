import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Прод-образ (docker/Dockerfile) копирует .next/standalone — без этого
  // флага standalone не генерируется и сборка образа падает.
  output: "standalone",
  // Прячем дев-индикатор Next.js (кнопка «N» с Route/Bundler/Preferences).
  // Это инструмент фреймворка, только для dev — в проде его и так нет.
  devIndicators: false,
  experimental: {
    serverActions: {
      // Загрузка документов идёт через Server Action (uploadDocumentAction).
      // Дефолтный лимит тела Server Action — 1 МБ, иначе файлы >1 МБ падают с 413.
      // MAX_FILE_SIZE = 50 МБ + запас на multipart-оверхед.
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
