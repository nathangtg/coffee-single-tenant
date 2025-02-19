'use client'
import { usePathname } from 'next/navigation';
import type { Metadata } from "next";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { AuthProvider } from "@/context/AuthContext";

const metadata: Metadata = {
  title: "Coffee Shop Admin",
  description: "Admin panel for managing coffee shop items",
};

export function getMetadata() {
  return metadata;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Disable layout for the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthProvider>
        <AdminHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </AuthProvider>
    </div>
  );
}
