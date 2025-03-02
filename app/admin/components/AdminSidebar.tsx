"use client";

import { useState } from "react";
import { LayoutDashboard, Coffee, Settings, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminSidebar() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            label: "Dashboard",
            icon: <LayoutDashboard className="h-5 w-5" />,
            href: "/admin/dashboard"
        },
        {
            label: "Cafe Settings",
            icon: <Settings className="h-5 w-5" />,
            href: "/admin/restaurant"
        }
    ];

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-full bg-amber-800 text-white shadow-lg"
                aria-label="Toggle sidebar"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar */}
            <div className={`fixed left-0 top-0 h-full bg-white border-r border-amber-100 transition-all duration-300 z-30
                ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                md:translate-x-0 md:w-64 md:static md:shadow-none`
            }>
                <div className="py-6 h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="px-5 mb-6 flex items-center space-x-2">
                        <Coffee className="h-8 w-8 text-amber-700" />
                        <h1 className="text-xl font-bold text-amber-900">Project 1.0</h1>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1 flex-1 px-3 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = router?.pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200 
                                        ${isActive ? "bg-amber-600 text-white" : "text-gray-700 hover:bg-amber-50 hover:text-amber-800"}`
                                    }
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className={`${isActive ? "text-white" : "text-amber-600"}`}>{item.icon}</div>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer Section */}
                    <div className="mt-auto border-t border-amber-100">
                        <div className="px-5 py-3 text-xs text-gray-500 bg-amber-50">
                            <p>Project 1.0</p>
                            <p>© 2025 Cafe Administration</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
