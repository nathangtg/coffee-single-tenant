import { getAuthenticatedUser, isAdmin, isLoggedIn } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Authentication check
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        const user = getAuthenticatedUser(req);

        // Extract the order ID from the params
        const resolvedParams = await params;
        const { id: orderId } = resolvedParams;

        if (!orderId) {
            return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
        }

        // Check if the order exists and belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        if (order.userId !== user.id) {
            return NextResponse.json({ message: 'Forbidden: You cannot delete this order' }, { status: 403 });
        }

        // Delete the order
        await prisma.order.delete({
            where: { id: orderId },
        });

        return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        // Authentication check
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        const user = getAuthenticatedUser(req);
        const resolvedParams = await params;
        const { id: orderId } = resolvedParams

        if (!orderId) {
            return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
        }

        // Check if the order exists and belongs to the user (or an admin)
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        if (order.userId !== user.id && !isAdmin(req)) {
            return NextResponse.json({ message: 'Forbidden: You cannot update this order' }, { status: 403 });
        }

        // Parse the request body
        const body = await req.json();

        // Update the order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: body.status,
                notes: body.notes,
                discount: body.discount,
                tax: body.tax,
                totalAmount: body.totalAmount,
            },
            include: {
                orderItems: {
                    include: {
                        item: true,
                        options: {
                            include: {
                                option: true,
                            },
                        },
                    },
                },
                payment: true,
            },
        });

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
