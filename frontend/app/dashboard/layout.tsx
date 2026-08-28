"use client";

import { ModuleProcessingProvider } from "@/components/school/ModuleProcessingProvider";

/**
 * Wraps every dashboard route so OCR job tracking keeps running while the admin
 * moves between the modules list and the upload wizard.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleProcessingProvider>{children}</ModuleProcessingProvider>;
}
