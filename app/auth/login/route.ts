import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
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
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return NextResponse.json({ message: 'User already exists' }, { status: 400 });
            }

            // Hash the password before storing
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the user in the database
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: UserRole.USER,
                },
            });

            // Generate JWT token
            const token = signJWT({
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                firstName: user.firstName, 
                lastName: user.lastName    
            });
            

            return NextResponse.json({ token });
        } catch (error) {
            console.error('Error registering user:', error);
            return NextResponse.json({ message: 'Error registering user' }, { status: 500 });
        }
    }
}