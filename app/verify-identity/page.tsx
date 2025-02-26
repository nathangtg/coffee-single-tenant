'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyIdentity() {
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [verified, setVerified] = useState(false);
    const [userId, setUserId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Get token from URL query parameter
        const tokenParam = searchParams?.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/verify-identity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, firstName, lastName }),
            });

            const data = await response.json();

            if (response.ok && data.verified) {
                setMessage('Identity verified successfully');
                setVerified(true);
                setUserId(data.userId);

                // In development, we might have returned the verification code
                if (data.verificationCode) {
                    setVerificationCode(data.verificationCode);
                }

                // In production, redirect or show next step
                // router.push(`/reset-password?userId=${data.userId}`);
            } else {
                setMessage(data.message || 'Verification failed');
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
                <h1 className="text-2xl font-bold text-center">Verify Your Identity</h1>
                <p className="text-center text-gray-600">
                    To continue the password reset process, please verify your identity by providing your first and last name.
                </p>

                {!verified ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                                Reset Token
                            </label>
                            <input
                                id="token"
                                type="text"
                                required
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Your reset token"
                            />
                        </div>

                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Your first name"
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Your last name"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Identity'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 text-green-800 rounded-md">
                            <p className="font-semibold">Identity Verified!</p>
                            <p>You can now reset your password.</p>
                        </div>

                        {verificationCode && (
                            <div className="text-center p-2 bg-yellow-50 text-yellow-800 rounded-md">
                                <p>Development mode: Use this verification code</p>
                                <p className="font-mono text-lg">{verificationCode}</p>
                            </div>
                        )}

                        <Link
                            href={`/reset-password?userId=${userId}`}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Continue to Reset Password
                        </Link>
                    </div>
                )}

                {message && !verified && (
                    <div className="text-center p-2 bg-blue-50 text-blue-800 rounded-md">
                        {message}
                    </div>
                )}

                <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                        Back to Forgot Password
                    </Link>
                </div>
            </div>
        </div>
    );
}