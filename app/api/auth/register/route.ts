import { NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { signJWT } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password, firstName, lastName, role, phone } = await req.json();

    console.log('Registering user:', req.body);

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: 'Please fill in all fields' , 
        missingFields: {
          email: !email,
          password: !password,
          firstName: !firstName,
          lastName: !lastName,
        }
      }, { status: 400 });
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
          firstName,
          lastName,
          role: role || UserRole.USER, // Default to 'USER' role if not provided
          phone: phone || null, // Handle phone if it's optional
        },
      });

      // Generate JWT token
      const token = await signJWT({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      });

      // Respond with the token and user data
      return NextResponse.json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    // Method Not Allowed
    return res.status(405).json({ message: 'Method not allowed' });
  }
}