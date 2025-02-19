import { isAdmin } from "@/lib/auth-utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET single item option by ID
export async function GET(
    req: NextRequest, 
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {
        
        if (!id) {
            return NextResponse.json({ message: 'Item option ID is required' }, { status: 400 });
        }

        const itemOption = await prisma.itemOption.findUnique({
            where: { id },
        });

        if (!itemOption) {
            return NextResponse.json({ message: 'Item option not found' }, { status: 404 });
        }

        return NextResponse.json(itemOption);
    }

    catch (error) {
        console.error('Error fetching item option:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// UPDATE item option (admin only)
export async function PUT(
    req: NextRequest, 
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
        return NextResponse.json({ message: 'Item option ID is required' }, { status: 400 });
    }

    // Check if user is admin
    if (!isAdmin(req)) {
        return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }

    const data = await req.json();
    const { name, priceModifier } = data;

    // Validate required fields
    if (!name || !priceModifier) {
        return NextResponse.json({
            message: 'Please provide all required fields',
            requiredFields: {
                name: !name,
                priceModifier: !priceModifier
            }
        }, { status: 400 });
    }

    const itemOption = await prisma.itemOption.update({
        where: { id },
        data: {
            name,
            priceModifier: parseFloat(priceModifier.toString() || '0'),
        },
    });

    return NextResponse.json(itemOption);
}

// DELETE item option (admin only)
export async function DELETE(
    req: NextRequest, 
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
        return NextResponse.json({ message: 'Item option ID is required' }, { status: 400 });
    }

    // Check if user is admin
    if (!isAdmin(req)) {
        return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
    }

    const itemOption = await prisma.itemOption.delete({
        where: { id },
    });

    return NextResponse.json(itemOption);
}