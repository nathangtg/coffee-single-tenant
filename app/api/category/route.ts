import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/auth-utils';
import { CategoryData } from '@/enums/CategoryData';

const prisma = new PrismaClient();

// GET all categories with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const active = searchParams.get('isActive');

    const filterOptions: { name?: { contains: string; mode: 'insensitive' }; isActive?: boolean } = {};

    if (name) filterOptions.name = { contains: name, mode: 'insensitive' };
    if (active) filterOptions.isActive = active === 'true';

    const categories = await prisma.category.findMany({
      where: filterOptions,
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// CREATE new category (admin only)
export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }

    const data = await req.json() as CategoryData;
    const { name, description, isActive } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        message: 'Category name is required',
      }, { status: 400 });
    }

    // Check if category with same name exists
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json({ message: 'A category with this name already exists' }, { status: 409 });
    }

    // Create the category
    const newCategory = await prisma.category.create({
      data: {
        name,
        description,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}