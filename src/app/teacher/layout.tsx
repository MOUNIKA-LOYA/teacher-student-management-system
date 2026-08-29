"use client";

import { ReactNode, useState } from "react";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherHeader from "@/components/teacher/TeacherHeader";

interface TeacherLayoutProps {
  children: ReactNode;
}

export default function TeacherLayout({
  children,
}: TeacherLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <TeacherSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:ml-[280px]">
        {/* Single header */}
        <TeacherHeader
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Current page */}
        {children}
      </div>
    </div>
  );
}