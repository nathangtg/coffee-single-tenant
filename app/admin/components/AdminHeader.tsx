import { Search, Coffee, Bell, User } from "lucide-react";

export default function AdminHeader() {
    return (
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-md">
            <div className="flex items-center space-x-3">
                <Coffee className="h-8 w-8 text-amber-300" />
                <div>
                    <h1 className="text-2xl font-bold">Cafe Project 1.0</h1>
                    <p className="text-xs text-amber-200">Coffee Shop Management System</p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search inventory, orders..."
                        className="pl-10 pr-4 py-2 rounded-full text-sm border-none bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300 w-64"
                    />
                </div>

                <button className="relative p-2 rounded-full hover:bg-amber-800 transition-colors">
                    <Bell className="h-5 w-5 text-amber-100" />
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center space-x-2 p-1.5 rounded-full bg-amber-800 hover:bg-amber-700 transition-colors cursor-pointer">
                    <div className="h-8 w-8 bg-amber-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-800" />
                    </div>
                    <span className="mr-2 text-sm font-medium hidden md:block">Barista Admin</span>
                </div>
            </div>
        </div>
    );
}