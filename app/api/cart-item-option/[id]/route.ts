import { isAdmin, isLoggedIn, getAuthenticatedUser } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isAdmin(req)) {
            if (!isLoggedIn(req)) {
                return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
            }
        }

        const user = getAuthenticatedUser(req);
        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'CartItemOption ID is required' }, { status: 400 });
        }

        // Verify ownership of the cart item option
        const existingOption = await prisma.cartItemOption.findFirst({
            where: {
                id,
                cartItem: {
                    cart: {
                        userId: user.id
                    }
                }
            }
        });

        if (!existingOption && !isAdmin(req)) {
            return NextResponse.json({ message: 'Cart item option not found or access denied' }, { status: 404 });
        }

        const data = await req.json();
        const { optionId } = data;

        if (!optionId) {
            return NextResponse.json({ message: 'Option ID is required' }, { status: 400 });
        }

        const updatedOption = await prisma.cartItemOption.update({
            where: { id },
            data: { optionId },
            include: {
                cartItem: true,
                option: true
            }
        });

        return NextResponse.json(updatedOption, { status: 200 });
    } catch (error) {
        console.error('Error updating cart item option:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        if (!isAdmin(req)) {
            if (!isLoggedIn(req)) {
                return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
            }

            const user = getAuthenticatedUser(req);
            const resolvedParams = await params;
            const { id } = resolvedParams;

            // Verify ownership of the cart item option
            const existingOption = await prisma.cartItemOption.findFirst({
                where: {
                    id,
                    cartItem: {
                        cart: {
                            userId: user.id
                        }
                    }
                }
            });

            if (!existingOption) {
                return NextResponse.json({ message: 'Cart item option not found or access denied' }, { status: 404 });
            }
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ message: 'CartItemOption ID is required' }, { status: 400 });
        }

        await prisma.cartItemOption.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Cart item option deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting cart item option:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

