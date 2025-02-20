import { getAuthenticatedUser, isAdmin, isLoggedIn } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { message: "OrderItemOption ID is required" },
                { status: 400 }
            );
        }

        // Check authentication
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const user = getAuthenticatedUser(req);
        const userId = user.id;
        const userIsAdmin = isAdmin(req);

        // Find the order item option with its relations
        const orderItemOption = await prisma.orderItemOption.findUnique({
            where: { id },
            include: {
                orderItem: {
                    include: {
                        order: true, // Include order to check ownership
                    }
                },
                option: true, // Include the related ItemOption
            },
        });

        if (!orderItemOption) {
            return NextResponse.json(
                { message: "Order item option not found" },
                { status: 404 }
            );
        }

        // Check authorization
        const isOwner = orderItemOption.orderItem.order.userId === userId;
        if (!userIsAdmin && !isOwner) {
            return NextResponse.json(
                { message: "Unauthorized to view this option" },
                { status: 403 }
            );
        }

        return NextResponse.json(orderItemOption, { status: 200 });

    } catch (error) {
        console.error("Error fetching order item option:", error);
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
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { message: "OrderItemOption ID is required" },
                { status: 400 }
            );
        }

        // Check authentication
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const user = getAuthenticatedUser(req);
        const userId = user.id;
        const userIsAdmin = isAdmin(req);

        // Find the order item option with its relations to check ownership
        const orderItemOption = await prisma.orderItemOption.findUnique({
            where: { id },
            include: {
                orderItem: {
                    include: {
                        order: true,
                    }
                },
            },
        });

        if (!orderItemOption) {
            return NextResponse.json(
                { message: "Order item option not found" },
                { status: 404 }
            );
        }

        // Check authorization
        const isOwner = orderItemOption.orderItem.order.userId === userId;
        if (!userIsAdmin && !isOwner) {
            return NextResponse.json(
                { message: "Unauthorized to delete this option" },
                { status: 403 }
            );
        }

        // Delete the option
        await prisma.orderItemOption.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Option successfully deleted" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting order item option:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}