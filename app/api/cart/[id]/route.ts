import { CartItemInput } from '@/enums/CartItemInput';
import { isAdmin } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'Cart ID is required' }, { status: 400 });
        }

        const cart = await prisma.cart.findUnique({
            where: { id },
            include: {
                cartItems: {
                    include: {
                        options: true,
                        item: true
                    }
                }
            }
        });

        if (!cart) {
            return NextResponse.json({ message: 'Cart not found' }, { status: 404 });
        }

        return NextResponse.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'Cart ID is required' }, { status: 400 });
        }

        const data = await req.json();
        const { cartItems }: { cartItems: CartItemInput[] } = data;

        const updatedCart = await prisma.cart.update({
            where: { id },
            data: {
                cartItems: {
                    deleteMany: {},  // Remove all existing cart items
                    create: cartItems.map((item) => ({
                        itemId: item.itemId,
                        quantity: item.quantity,
                        notes: item.notes,
                        options: {
                            create: item.options.map((opt) => ({
                                optionId: opt.optionId
                            }))
                        }
                    }))
                }
            },
            include: { cartItems: { include: { options: true } } }
        });

        return NextResponse.json(updatedCart, { status: 200 });
    } catch (error) {
        console.error('Error updating cart:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'Cart ID is required' }, { status: 400 });
        }

        await prisma.cartItemOption.deleteMany({ where: { cartItem: { cartId: id } } });
        await prisma.cartItem.deleteMany({ where: { cartId: id } });
        await prisma.cart.delete({ where: { id } });

        return NextResponse.json({ message: 'Cart deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting cart:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}