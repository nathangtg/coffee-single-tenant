import { CartItemInput } from "@/enums/CartItemInput";
import { getAuthenticatedUser, isAdmin, isLoggedIn } from "@/lib/auth-utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'Cart Item ID is required' }, { status: 400 });
        }

        const data = await req.json();
        const { quantity, notes, options }: CartItemInput = data;

        if (!quantity || quantity <= 0) {
            return NextResponse.json({ message: 'Invalid quantity' }, { status: 400 });
        }

        // Check access rights
        if (!isAdmin(req)) {
            const user = getAuthenticatedUser(req);
            // Verify the cart item belongs to the user
            const existingCartItem = await prisma.cartItem.findFirst({
                where: {
                    id,
                    cart: {
                        userId: user.id
                    }
                }
            });

            if (!existingCartItem) {
                return NextResponse.json({ message: 'Cart item not found or access denied' }, { status: 404 });
            }
        }

        // Update cart item in a transaction
        const updatedCartItem = await prisma.$transaction(async (prisma) => {
            // Delete existing options if new options are provided
            if (options) {
                await prisma.cartItemOption.deleteMany({
                    where: { cartItemId: id }
                });
            }

            return prisma.cartItem.update({
                where: { id },
                data: {
                    quantity,
                    notes,
                    options: options ? {
                        create: options.map(opt => ({
                            optionId: opt.optionId
                        }))
                    } : undefined
                },
                include: {
                    item: true,
                    options: {
                        include: {
                            option: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(updatedCartItem);
    } catch (error) {
        console.error('Error updating cart item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'Cart Item ID is required' }, { status: 400 });
        }

        // Check access rights
        if (!isAdmin(req)) {
            const user = getAuthenticatedUser(req);
            // Verify the cart item belongs to the user
            const existingCartItem = await prisma.cartItem.findFirst({
                where: {
                    id,
                    cart: {
                        userId: user.id
                    }
                }
            });

            if (!existingCartItem) {
                return NextResponse.json({ message: 'Cart item not found or access denied' }, { status: 404 });
            }
        }

        // Delete cart item and its options in a transaction
        await prisma.$transaction(async (prisma) => {
            await prisma.cartItemOption.deleteMany({
                where: { cartItemId: id }
            });
            await prisma.cartItem.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: 'Cart item deleted successfully' });
    } catch (error) {
        console.error('Error deleting cart item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'Cart Item ID is required' }, { status: 400 });
        }

        // Different queries based on user role
        if (!isAdmin(req)) {
            const user = getAuthenticatedUser(req);
            // Regular users can only view their own cart items
            const cartItem = await prisma.cartItem.findFirst({
                where: {
                    id,
                    cart: {
                        userId: user.id
                    }
                },
                include: {
                    item: true,
                    options: {
                        include: {
                            option: true
                        }
                    }
                }
            });

            if (!cartItem) {
                return NextResponse.json({ message: 'Cart item not found or access denied' }, { status: 404 });
            }

            return NextResponse.json(cartItem);
        }

        // Admin can view any cart item
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: {
                item: true,
                cart: true,
                options: {
                    include: {
                        option: true
                    }
                }
            }
        });

        if (!cartItem) {
            return NextResponse.json({ message: 'Cart item not found' }, { status: 404 });
        }

        return NextResponse.json(cartItem);
    } catch (error) {
        console.error('Error fetching cart item:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}