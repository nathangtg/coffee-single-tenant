'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from './alert';
import { useAuth } from '@/context/AuthContext';

const AuthForms = () => {
    const router = useRouter();
    const { user, login, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            router.push('/admin/dashboard');
        }
    }, [user, router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(e.target);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const success = await login(email, password);
            if (!success) {
                throw new Error('Invalid email or password');
            }
            setSuccess('Login successful!');
            router.push('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Registration failed. Please try again.');
            }

            setSuccess('Registration successful! Please login.');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Project 1.0</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || loading}
                                >
                                    {isLoading || loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name"
                                        required
                                        className="w-full"
                                    />
                                    <Input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name"
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                    className="w-full"
                                />
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    required
                                    className="w-full"
                                />
                                <Input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number"
                                    required
                                    className="w-full"
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Registering...' : 'Register'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mt-4">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthForms;
