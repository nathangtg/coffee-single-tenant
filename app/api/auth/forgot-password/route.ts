import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    if (req.method === 'POST') {
        const { email } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ message: 'Please provide a valid email' }, { status: 400 });
        }

        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                // Don't reveal if email exists or not for security
                return NextResponse.json({ message: 'If your email exists in our system, you will receive a reset link' }, { status: 200 });
            }

            // Generate reset token and expiry
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            // Hash the token for storage
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Save the token to the user record
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: hashedToken,
                    resetTokenExpiry,
                },
            });

            // In a real app, send an email with a link to the reset page
            // For this example, we'll just return the token
            // The link would be like: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

            return NextResponse.json({
                message: 'If your email exists in our system, you will receive a reset link',
                // Only include token in development for testing
                ...(process.env.NODE_ENV !== 'production' && { resetToken }),
            }, { status: 200 });

        } catch (error) {
            console.error('Error requesting password reset:', error);
            return NextResponse.json({ message: 'Error processing your request' }, { status: 500 });
        }
    }
}