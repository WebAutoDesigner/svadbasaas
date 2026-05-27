"use client";

import { Component, type ReactNode } from "react";

type State = { hasError: boolean };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    console.error("App error:", error);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold">Что-то сломалось</h1>
            <p className="text-muted-foreground">
              Попробуйте обновить страницу. Если не поможет — напишите в поддержку.
            </p>
            <button
              onClick={() => location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Обновить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
