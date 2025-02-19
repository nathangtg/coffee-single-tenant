import { getAuthenticatedUser, isAdmin, isLoggedIn } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        // Role based views
        if(!isAdmin(req)) {
            // Fetch the cart for the logged in user
            getAuthenticatedUser(req);
            const user = getAuthenticatedUser(req);
            const cart = await prisma.cart.findFirst({
                where: {
                    userId: user.id
                },
                include: {
                    cartItems: {
                        include: {
                            item: true
                        }
                    }
                }
            });
            return NextResponse.json(cart);
        }

        // Admin view
        const carts = await prisma.cart.findMany({
            include: {
                cartItems: {
                    include: {
                        item: true
                    }
                }
            }
        });

        return NextResponse.json(carts);
    }

    catch (error) {
        console.error('Error fetching carts:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        // Check if user is logged in
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: "Unauthorized, login required" }, { status: 401 });
        }

        // Get Authenticated User
        const user = getAuthenticatedUser(req);
        if (!user || !user.id) {
            return NextResponse.json({ message: "User authentication failed" }, { status: 403 });
        }
        const userId = user.id;

        const data = await req.json();
        const { items } = data;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({
                message: "Invalid request: items must be a non-empty array",
                requiredFields: { userId: !!userId, items: !!items }
            }, { status: 400 });
        }

        // Validate each item
        for (const item of items) {
            if (!item.itemId || typeof item.itemId !== "string") {
                return NextResponse.json({ message: "Each item must have a valid itemId" }, { status: 400 });
            }
            if (!item.quantity || typeof item.quantity !== "number" || item.quantity <= 0) {
                return NextResponse.json({ message: `Invalid quantity for item ${item.itemId}` }, { status: 400 });
            }
        }

        // Create a new Cart with associated CartItems in a transaction
        const cart = await prisma.$transaction(async (prisma) => {
            return prisma.cart.create({
                data: {
                    userId,
                    cartItems: {
                        create: items.map((item) => ({
                            itemId: item.itemId,
                            quantity: item.quantity,
                            notes: item.notes || null,
                            options: item.options ? { create: item.options } : undefined
                        }))
                    }
                },
                include: { cartItems: true }
            });
        });

        return NextResponse.json(cart, { status: 201 });

    } catch (error) {
        console.error("Error creating cart:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
