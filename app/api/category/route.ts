import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// Helper function to check if user is admin
const isAdmin = (req: NextRequest): boolean => {
  const user = getAuthenticatedUser(req);
  return user?.role === 'ADMIN';
};

// Interface for create/update category data
interface CategoryData {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

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

// GET single category by ID
export async function HEAD(req: NextRequest) {
  try {
    const id = req.url.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        items: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            preparationTime: true,
          }
        },
        _count: {
          select: { items: true }
        }
      },
    });
    
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
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
    const { name, description, imageUrl, isActive } = data;
    
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
        imageUrl,
        isActive: isActive ?? true,
      },
    });
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// UPDATE category (admin only)
export async function PUT(req: NextRequest) {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }
    
    const data = await req.json();
    const { id, name, description, imageUrl, isActive } = data;
    
    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    
    // If name is being updated, check that it's not already in use
    if (name && name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({ where: { name } });
      if (nameExists) {
        return NextResponse.json({ message: 'A category with this name already exists' }, { status: 409 });
      }
    }
    
    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE category (admin only)
export async function DELETE(req: NextRequest) {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } }
    });
    
    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    
    // Check if category has associated items
    if (existingCategory._count.items > 0) {
      return NextResponse.json({
        message: 'Cannot delete category with associated items. Please remove or reassign items first.',
        itemCount: existingCategory._count.items
      }, { status: 409 });
    }
    
    // Delete the category
    await prisma.category.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}