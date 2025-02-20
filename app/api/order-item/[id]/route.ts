import { getAuthenticatedUser, isAdmin, isLoggedIn } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const { id: orderedItemId } = resolvedParams;

        if (!orderedItemId) {
            return NextResponse.json(
                { message: "Ordered item ID is required" },
                { status: 400 }
            );
        }

        // Check if user is logged in
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const user = getAuthenticatedUser(req);
        const userId = user.id;
        const userIsAdmin = isAdmin(req);

        // Get the order item with its relations
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderedItemId },
            include: {
                order: true,  // Include order to check ownership
                item: true,
                options: true,
            },
        });

        if (!orderItem) {
            return NextResponse.json(
                { message: "Order item not found" },
                { status: 404 }
            );
        }

        // Check if user is authorized to view this order item
        const isOwner = orderItem.order.userId === userId;

        if (!userIsAdmin && !isOwner) {
            return NextResponse.json(
                { message: "Unauthorized, insufficient permissions" },
                { status: 403 }
            );
        }

        // Remove sensitive information if needed
        const sanitizedOrderItem = {
            ...orderItem,
            order: userIsAdmin ? orderItem.order : {
                id: orderItem.order.id,
                status: orderItem.order.status,
            }
        };

        return NextResponse.json(sanitizedOrderItem, { status: 200 });

    } catch (error) {
        console.error("Error fetching order item:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const { id: orderedItemId } = resolvedParams;

        if (!orderedItemId) {
            return NextResponse.json(
                { message: "Ordered item ID is required" },
                { status: 400 }
            );
        }

        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const userIsAdmin = isAdmin(req);
        const user = getAuthenticatedUser(req);
        const userId = user.id;

        // Get the order item with its relations
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderedItemId },
            include: {
                order: true,  // Include order to check ownership
            },
        });

        if (!orderItem) {
            return NextResponse.json(
                { message: "Order item not found" },
                { status: 404 }
            );
        }

        // Check if user is authorized to delete this order item
        const isOwner = orderItem.order.userId === userId;

        if (!userIsAdmin && !isOwner) {
            return NextResponse.json(
                { message: "Unauthorized, insufficient permissions" },
                { status: 403 }
            );
        }

        const allowedOrderStatuses = ['PENDING'];
        if (!allowedOrderStatuses.includes(orderItem.order.status) && !userIsAdmin) {
            return NextResponse.json(
                { message: "Cannot delete items from orders that are already processed" },
                { status: 400 }
            );
        }

        // Delete the order item
        await prisma.orderItem.delete({
            where: { id: orderedItemId },
        });

        return NextResponse.json(
            { message: "Order item successfully deleted" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting order item:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
