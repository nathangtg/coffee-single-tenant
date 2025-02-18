import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { signJWT } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    // Make the Method check
    if (req.method === 'POST') {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Please fill in all fields' }, { status: 400 });
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        try {            

            // Login with the user
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
            }

            // Compare the password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
            }

            // Generate JWT token
            const token = await signJWT(user)


            return NextResponse.json({ token });
        } catch (error) {
            console.error('Error registering user:', error);
            return NextResponse.json({ message: 'Error registering user' }, { status: 500 });
        }
    }
}