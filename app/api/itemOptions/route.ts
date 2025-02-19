import { ItemOptionData } from "@/enums/ItemOptionData";
import { isAdmin } from "@/lib/auth-utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET all item options with optional filtering
export async function GET(req: NextRequest) {
    try {

        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');
        const name = searchParams.get('name');
        const priceModifier = searchParams.get('priceModifier');

        const filterOptions: ItemOptionData = {};

        if (itemId) filterOptions.itemId = itemId;
        if (name) filterOptions.name = name;
        if (priceModifier) filterOptions.price = parseFloat(priceModifier);

        const itemOptions = await prisma.itemOption.findMany({
            where: filterOptions,
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(itemOptions);

    }
    catch (error) {
        console.error('Error fetching item options:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// CREATE new item option (admin only)
export async function POST(req: NextRequest) {
    try {

        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const data = await req.json();
        const { itemId, name, priceModifier } = data;

        // Validate required fields
        if (!itemId || !name || !priceModifier) {
            return NextResponse.json({
                message: 'Please provide all required fields',
                requiredFields: {
                    itemId: !itemId,
                    name: !name,
                    price: !priceModifier
                }
            }, { status: 400 });
        }

        const itemOption = await prisma.itemOption.create({
            data: {
                itemId,
                name,
                priceModifier: parseFloat(priceModifier.toString() || '0'),
            }
        });

        return NextResponse.json(itemOption);

    }
    catch (error) {
        console.error('Error creating item option:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}