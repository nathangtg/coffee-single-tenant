import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/auth-utils';
import { ItemOptionData } from '@/enums/ItemOptionData';

const prisma = new PrismaClient();

// GET single item by ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {

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

// UPDATE item (admin only)
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
        return NextResponse.json({ message: 'Item ID is required' }, { status: 400 });
    }

    try {
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const data = await req.json();
        const { name, description, price, imageUrl, isAvailable, preparationTime, categoryId, options } = data;

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
                        priceModifier: parseFloat(opt.price.toString() || '0'),
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
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
        return NextResponse.json({ message: 'Item ID is required' }, { status: 400 });
    }

    console.log('id:', id);


    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

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