import { Bell, ChevronDown, Coffee, Search } from "lucide-react";
import Image from "next/image";

export default function AdminHeader() {
    return (
        <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center space-x-4">
                <Coffee className="h-8 w-8 text-amber-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coffee Shop Admin</h1>
                    <p className="text-sm text-gray-500">Manage your coffee shop inventory</p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>

                <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                    <Image
                        src="/api/placeholder/32/32"
                        alt="Admin"
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>
            </div>
        </div>
    )
}