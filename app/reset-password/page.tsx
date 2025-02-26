'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPassword() {
    const searchParams = useSearchParams();
    const [userId, setUserId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Get userId from URL query parameter
        const userIdParam = searchParams?.get('userId');
        if (userIdParam) {
            setUserId(userIdParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setMessage('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, verificationCode, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Password reset successfully');
                setSuccess(true);

                // Redirect to login after a delay
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setMessage(data.message || 'Password reset failed');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            setMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Reset Your Password</h1>
                <p className="text-center text-gray-600">
                    Create a new password for your account
                </p>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                                User ID
                            </label>
                            <input
                                id="userId"
                                type="text"
                                required
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="User ID"
                            />
                        </div>

                        <div>
                            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                                Verification Code
                            </label>
                            <input
                                id="verificationCode"
                                type="text"
                                required
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="6-digit verification code"
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="At least 8 characters"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Confirm your new password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center p-4 bg-green-50 text-green-800 rounded-md">
                        <p className="font-semibold">Password Reset Successful!</p>
                        <p>You will be redirected to the login page shortly.</p>
                        <Link href="/login" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
                            Go to login now →
                        </Link>
                    </div>
                )}

                {message && !success && (
                    <div className="text-center p-2 bg-blue-50 text-blue-800 rounded-md">
                        {message}
                    </div>
                )}

                <div className="text-center">
                    <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-800">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}