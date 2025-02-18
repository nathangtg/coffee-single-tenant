import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// Helper function to check if user is admin
const isAdmin = (req: NextRequest): boolean => {
    const user = getAuthenticatedUser(req);
    return user?.role === 'ADMIN';
};

// Type for option data
interface ItemOptionData {
    name: string;
    price: number;
}

// Type for filter options
interface ItemFilterOptions {
    categoryId?: string;
    name?: { contains: string; mode: 'insensitive' };
    isAvailable?: boolean;
}

// GET all items with optional filtering
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId');
        const name = searchParams.get('name');
        const available = searchParams.get('isAvailable');

        const filterOptions: ItemFilterOptions = {};

        if (categoryId) filterOptions.categoryId = categoryId;
        if (name) filterOptions.name = { contains: name, mode: 'insensitive' };
        if (available) filterOptions.isAvailable = available === 'true';

        const items = await prisma.item.findMany({
            where: filterOptions,
            include: {
                category: true,
                options: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// GET single item by ID
export async function HEAD(req: NextRequest) {
    try {
        const id = req.url.split('/').pop();

        if (!id) {
            return NextResponse.json({ message: 'Item ID is required' }, { status: 400 });
        }

        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                category: true,
                options: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// CREATE new item (admin only)
export async function POST(req: NextRequest) {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const data = await req.json();
        const { name, description, price, imageUrl, isAvailable, preparationTime, categoryId, options } = data;

        // Validate required fields
        if (!name || !price || !categoryId) {
            return NextResponse.json({
                message: 'Please provide all required fields',
                requiredFields: {
                    name: !name,
                    price: !price,
                    categoryId: !categoryId
                }
            }, { status: 400 });
        }

        // Create the item
        const newItem = await prisma.item.create({
            data: {
                name,
                description,
                price: parseFloat(price.toString()),
                imageUrl,
                isAvailable: isAvailable ?? true,
                preparationTime: preparationTime ? parseInt(preparationTime.toString()) : null,
                categoryId,
                options: options ? {
                    createMany: {
                        data: options.map((opt: ItemOptionData) => ({
                            name: opt.name,
                            price: parseFloat(opt.price.toString() || '0'),
                        }))
                    }
                } : undefined,
            },
            include: {
                category: true,
                options: true,
            },
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// UPDATE item (admin only)
export async function PUT(req: NextRequest) {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const data = await req.json();
        const { id, name, description, price, imageUrl, isAvailable, preparationTime, categoryId, options } = data;

        if (!id) {
            return NextResponse.json({ message: 'Item ID is required' }, { status: 400 });
        }

        // Check if item exists
        const existingItem = await prisma.item.findUnique({ where: { id } });
        if (!existingItem) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        // Update the item
        await prisma.item.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined,
                price: price !== undefined ? parseFloat(price.toString()) : undefined,
                imageUrl: imageUrl !== undefined ? imageUrl : undefined,
                isAvailable: isAvailable !== undefined ? isAvailable : undefined,
                preparationTime: preparationTime !== undefined ? parseInt(preparationTime.toString()) : undefined,
                categoryId: categoryId !== undefined ? categoryId : undefined,
            },
        });

        // Handle options update if provided
        if (options) {
            // First delete existing options
            await prisma.itemOption.deleteMany({ where: { itemId: id } });

            // Then create new options
            if (options.length > 0) {
                await prisma.itemOption.createMany({
                    data: options.map((opt: ItemOptionData) => ({
                        itemId: id,
                        name: opt.name,
                        price: parseFloat(opt.price.toString() || '0'),
                    }))
                });
            }
        }

        // Fetch updated item with fresh options
        const finalItem = await prisma.item.findUnique({
            where: { id },
            include: {
                category: true,
                options: true,
            },
        });

        return NextResponse.json(finalItem);
    } catch (error) {
        console.error('Error updating item:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// DELETE item (admin only)
export async function DELETE(req: NextRequest) {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Item ID is required' }, { status: 400 });
        }

        // Check if item exists
        const existingItem = await prisma.item.findUnique({ where: { id } });
        if (!existingItem) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        // Delete the item
        await prisma.item.delete({ where: { id } });

        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}