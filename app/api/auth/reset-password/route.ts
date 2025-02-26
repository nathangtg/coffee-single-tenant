// app/api/auth/reset-password/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    if (req.method === 'POST') {
        const { userId, verificationCode, newPassword } = await req.json();

        if (!userId || !verificationCode || !newPassword) {
            return NextResponse.json({ message: 'Please provide all required information' }, { status: 400 });
        }

        if (
            typeof userId !== 'string' ||
            typeof verificationCode !== 'string' ||
            typeof newPassword !== 'string'
        ) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        // Password validation
        if (newPassword.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        try {
            // Find user with this verification code that hasn't expired
            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                    verificationCode,
                    verificationCodeExpiry: {
                        gt: new Date(),
                    },
                },
            });

            if (!user) {
                return NextResponse.json({ message: 'Invalid or expired verification code' }, { status: 400 });
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user's password and clear reset/verification data
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                    verificationCode: null,
                    verificationCodeExpiry: null,
                },
            });

            return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

        } catch (error) {
            console.error('Error resetting password:', error);
            return NextResponse.json({ message: 'Error processing your request' }, { status: 500 });
        }
    }
}