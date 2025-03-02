'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);

    useEffect(() => {
        fetchRestaurantSettings();
    }, []);

    const fetchRestaurantSettings = async () => {
        try {
            const response = await fetch('/api/restaurant-settings');
            const data = await response.json();
            setRestaurant(data);
        } catch (error) {
            console.error('Error fetching restaurant settings:', error);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        {restaurant?.logoUrl && (
                            <img src={restaurant.logoUrl} alt="Logo" className="h-8 w-8 object-cover" />
                        )}
                        <span className="font-mono text-xl font-bold">
                            {restaurant?.storeName || 'Loading...'}
                        </span>
                    </Link>

                    <nav className="flex items-center space-x-6">
                        <Link
                            href="/pages/coffee-shop"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Coffee Shop
                        </Link>
                        {!user ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/pages/auth"
                                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/pages/auth"
                                    className="rounded-md border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                                >
                                    Register
                                </Link>
                            </div>
                        ) : (
                            <Link
                                href="/pages/profile"
                                className="flex items-center space-x-2"
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-200" />
                                <span className="text-sm font-medium">Profile</span>
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
