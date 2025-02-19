import { LayoutDashboard, Settings } from "lucide-react";

export default function AdminSidebar() {
    return (
        <div className="w-64 border-r h-full py-8 px-4 space-y-6">
            <div className="space-y-2">
                <div className="px-3 py-2 text-sm font-medium text-gray-500">MENU</div>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-900">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    )
}