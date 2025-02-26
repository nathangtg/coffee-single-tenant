import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    if (req.method === 'POST') {
        const { token, firstName, lastName } = await req.json();

        if (!token || !firstName || !lastName) {
            return NextResponse.json({ message: 'Please provide all required information' }, { status: 400 });
        }

        if (typeof token !== 'string' || typeof firstName !== 'string' || typeof lastName !== 'string') {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        try {
            // Hash the provided token to compare with stored token
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Find user with this token that hasn't expired
            const user = await prisma.user.findFirst({
                where: {
                    resetToken: hashedToken,
                    resetTokenExpiry: {
                        gt: new Date(),
                    },
                },
            });

            if (!user) {
                return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
            }

            // Verify first name and last name
            if (
                user.firstName.toLowerCase() !== firstName.toLowerCase() ||
                user.lastName.toLowerCase() !== lastName.toLowerCase()
            ) {
                return NextResponse.json({ message: 'Identity verification failed' }, { status: 400 });
            }

            // Generate a verification code (optional additional security)
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

            // Store verification code with expiry
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationCode,
                    verificationCodeExpiry: new Date(Date.now() + 600000), // 10 minutes
                },
            });

            // In a real app, you might send this code via email/SMS
            // Here we return it for demonstration

            return NextResponse.json({
                message: 'Identity verified successfully',
                verified: true,
                userId: user.id,
                // Only include code in development for testing
                ...(process.env.NODE_ENV !== 'production' && { verificationCode }),
            }, { status: 200 });

        } catch (error) {
            console.error('Error verifying identity:', error);
            return NextResponse.json({ message: 'Error processing your request' }, { status: 500 });
        }
    }
}