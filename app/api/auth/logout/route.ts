import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create a response with an expired token cookie
        const response = NextResponse.json(
            { message: 'Logout successful' },
            { status: 200 }
        );

        response.cookies.set({
            name: 'token',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(0), // Expire the cookie immediately
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Error logging out:', error);
        return NextResponse.json(
            { message: 'Logout failed' },
            { status: 500 }
        );
    }
}
