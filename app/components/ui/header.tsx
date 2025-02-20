'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="relative h-8 w-8">
                            <Image
                                src="/public/logo.png"
                                alt="Project 1.0 Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="font-mono text-xl font-bold">Project 1.0</span>
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
                                    href="/login"
                                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-md border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                                >
                                    Register
                                </Link>
                            </div>
                        ) : (
                            <Link
                                href="/profile"
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