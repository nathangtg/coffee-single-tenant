import type React from "react"
import type { Metadata } from "next"
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";


export const metadata: Metadata = {
  title: "Coffee Shop Admin",
  description: "Admin panel for managing coffee shop items",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

