import { isAdmin, isLoggedIn, getAuthenticatedUser } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        if (!isAdmin(req)) {
            if (!isLoggedIn(req)) {
                return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
            }
            const user = getAuthenticatedUser(req);
            const cartOptions = await prisma.cartItemOption.findMany({
                where: {
                    cartItem: {
                        cart: {
                            userId: user.id
                        }
                    }
                },
                include: {
                    cartItem: {
                        include: {
                            item: true
                        }
                    },
                    option: true
                }
            });
            return NextResponse.json(cartOptions);
        }

        // Admin view
        const cartOptions = await prisma.cartItemOption.findMany({
            include: {
                cartItem: {
                    include: {
                        item: true
                    }
                },
                option: true
            }
        });

        return NextResponse.json(cartOptions);
    } catch (error) {
        console.error('Error fetching cart item options:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!isAdmin(req)) {
            if (!isLoggedIn(req)) {
                return NextResponse.json({ message: "Unauthorized, login required" }, { status: 401 });
            }
        }

        const user = getAuthenticatedUser(req);
        const data = await req.json();
        const { cartItemId, optionId } = data;

        if (!cartItemId || !optionId) {
            return NextResponse.json({
                message: "Invalid request: cartItemId and optionId are required",
                requiredFields: { cartItemId: !!cartItemId, optionId: !!optionId }
            }, { status: 400 });
        }

        // Verify cart item ownership
        const cartItem = await prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                cart: {
                    userId: user.id
                }
            }
        });

        if (!cartItem && !isAdmin(req)) {
            return NextResponse.json({ message: "Cart item not found or access denied" }, { status: 404 });
        }

        const cartItemOption = await prisma.cartItemOption.create({
            data: {
                cartItemId,
                optionId
            },
            include: {
                cartItem: true,
                option: true
            }
        });

        return NextResponse.json(cartItemOption, { status: 201 });
    } catch (error) {
        console.error("Error creating cart item option:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

