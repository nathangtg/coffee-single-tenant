import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// Helper function to check if user is admin
const isAdmin = (req: NextRequest): boolean => {
  const user = getAuthenticatedUser(req);
  return user?.role === 'ADMIN';
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }
    
    // The where clause needs an object with the id property
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
          },
        },
        _count: {
          select: { items: true },
        },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }

    // Await the params and extract the dynamic "id"
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Read the request body for update data
    const data = await req.json();
    const { name, description, imageUrl, isActive } = data;

    // Check if category exists using the dynamic id
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // If "name" is being updated, verify it is not already in use by another category
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
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }

    // Await the params and extract the dynamic "id"
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if category exists (and include item count)
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } }
    });
    
    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // Prevent deletion if the category has associated items
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
