import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/auth-utils';
import { ItemOptionData } from '@/enums/ItemOptionData';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { v4 } from 'uuid';

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
        const { name, description, price, image, isAvailable, preparationTime, categoryId, options } = data;

        // Check if item exists
        const existingItem = await prisma.item.findUnique({ where: { id } });
        if (!existingItem) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        let imagePath = existingItem.imageUrl;

        // Process image if it's a new base64-encoded string
        if (image && typeof image === 'string' && image.startsWith('data:image/')) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'items');
            await mkdir(uploadDir, { recursive: true });

            // Extract file type from base64 string
            const match = image.match(/^data:image\/(\w+);base64,/);
            if (!match) {
                return NextResponse.json({ message: 'Invalid image format' }, { status: 400 });
            }

            const fileExtension = match[1]; // e.g., png, jpg
            const fileName = `${v4()}.${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Convert base64 to buffer and save
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            await writeFile(filePath, buffer);

            imagePath = `/uploads/items/${fileName}`;
        }

        // Update the item
        await prisma.item.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined,
                price: price !== undefined ? parseFloat(price.toString()) : undefined,
                imageUrl: imagePath,
                isAvailable: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : undefined,
                preparationTime: preparationTime !== undefined ? parseInt(preparationTime.toString()) : undefined,
                categoryId: categoryId !== undefined ? categoryId : undefined,
            },
        });

        // Handle options update if provided
        if (options) {
            await prisma.itemOption.deleteMany({ where: { itemId: id } });

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
        return NextResponse.json({ message: 'Server error', error: (error as Error).message }, { status: 500 });
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

        // Check if item exists and get its image URL
        const existingItem = await prisma.item.findUnique({ where: { id } });
        if (!existingItem) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        // Delete the item
        await prisma.item.delete({ where: { id } });

        // If item had an image URL and it's a local file (starts with /uploads/), delete it
        if (existingItem.imageUrl && existingItem.imageUrl.startsWith('/uploads/')) {
            try {
                const imagePath = path.join(process.cwd(), 'public', existingItem.imageUrl);
                await unlink(imagePath);
                console.log(`Deleted image file: ${imagePath}`);
            } catch (fileError) {
                // Log but don't fail the request if file deletion fails
                console.error('Error deleting image file:', fileError);
            }
        }

        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
