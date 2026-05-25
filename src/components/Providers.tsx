"use client";

import * as React from "react";
import { ToastProvider, ConfirmProvider } from "./Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
