import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ItemFilterOptions } from '@/enums/ItemFilterOptions';
import { ItemOptionData } from '@/enums/ItemOptionData';
import { v4 as uuidv4 } from 'uuid';
import { isAdmin } from '@/lib/auth-utils';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

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

        // Parse the form data
        const formData = await req.formData();

        // Extract fields
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const isAvailable = formData.get('isAvailable') === 'true';
        const preparationTime = formData.get('preparationTime') as string;
        const categoryId = formData.get('categoryId') as string;
        const optionsJson = formData.get('options') as string;
        const options = optionsJson ? JSON.parse(optionsJson) : null;

        // Handle image file
        const imageFile = formData.get('image') as File;
        let imagePath: string | null = null;

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

        // Process image if provided
        if (imageFile) {
            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'items');
            await mkdir(uploadDir, { recursive: true });

            // Generate unique filename
            const fileExtension = imageFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Save the file
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            await writeFile(filePath, buffer);

            // Set relative path for database
            imagePath = `/uploads/items/${fileName}`;
        }

        // Create the item
        const newItem = await prisma.item.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                imageUrl: imagePath, // Use the stored file path
                isAvailable: isAvailable ?? true,
                preparationTime: preparationTime ? parseInt(preparationTime) : null,
                categoryId,
                options: options ? {
                    createMany: {
                        data: options.map((opt: ItemOptionData) => ({
                            name: opt.name,
                            priceModifier: parseFloat(opt.price?.toString() || '0'),
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
        return NextResponse.json({ message: 'Server error', error: (error as Error).message }, { status: 500 });
    }
}
