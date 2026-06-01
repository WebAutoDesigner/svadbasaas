import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    // Интеграционные тесты бьют реальную БД и реальный bcrypt (cost 12).
    // Дефолтные 5с малы, когда несколько bcrypt-операций идут под параллельной
    // нагрузкой воркеров — поднимаем, чтобы не было ложных таймаут-флак.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
