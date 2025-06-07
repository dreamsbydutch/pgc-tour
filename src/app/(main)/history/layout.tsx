/**
 * History Module Layout
 * Layout wrapper for the history section
 */

import type { ReactNode } from "react";

interface HistoryLayoutProps {
  children: ReactNode;
}

export default function HistoryLayout({ children }: HistoryLayoutProps) {
  return <div className="history-module">{children}</div>;
}
