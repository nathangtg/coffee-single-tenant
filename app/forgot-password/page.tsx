'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [resetToken, setResetToken] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                // In development mode, we may have returned the token for testing
                if (data.resetToken) {
                    setResetToken(data.resetToken);
                }
                // In production, redirect to a "check your email" page
                // router.push('/check-email');
            } else {
                setMessage(data.message || 'Something went wrong');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
                <p className="text-center text-gray-600">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="your@email.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : 'Reset Password'}
                    </button>
                </form>

                {message && (
                    <div className="text-center p-2 bg-blue-50 text-blue-800 rounded-md">
                        {message}
                    </div>
                )}

                {resetToken && (
                    <div className="text-center p-2 bg-yellow-50 text-yellow-800 rounded-md">
                        <p>Development mode: Use this token to verify your identity</p>
                        <p className="font-mono text-sm break-all">{resetToken}</p>
                        <Link href={`/verify-identity?token=${resetToken}`} className="mt-2 inline-block text-indigo-600 hover:text-indigo-800">
                            Go to verification page →
                        </Link>
                    </div>
                )}

                <div className="text-center">
                    <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-800">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}