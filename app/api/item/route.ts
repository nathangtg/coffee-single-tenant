import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { ItemFilterOptions } from '@/enums/ItemFilterOptions';
import { ItemOptionData } from '@/enums/ItemOptionData';

const prisma = new PrismaClient();

// Helper function to check if user is admin
const isAdmin = (req: NextRequest): boolean => {
    const user = getAuthenticatedUser(req);
    return user?.role === 'ADMIN';
};

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
                            priceModifier: parseFloat(opt.price.toString() || '0'),
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