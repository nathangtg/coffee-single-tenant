import { getAuthenticatedUser, isAdmin, isLoggedIn } from "@/lib/auth-utils";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { orderItemId, optionId } = data;

        // Validate required fields
        if (!orderItemId || !optionId) {
            return NextResponse.json(
                { message: "Missing required fields" },
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

        // Verify order item exists and get its related order
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderItemId },
            include: {
                order: true,
                options: true,
            },
        });

        if (!orderItem) {
            return NextResponse.json(
                { message: "Order item not found" },
                { status: 404 }
            );
        }

        // Check authorization
        const isOwner = orderItem.order.userId === userId;
        if (!userIsAdmin && !isOwner) {
            return NextResponse.json(
                { message: "Unauthorized to modify this order item" },
                { status: 403 }
            );
        }

        // Check if option already exists for this order item
        const existingOption = orderItem.options.find(
            option => option.optionId === optionId
        );

        if (existingOption) {
            return NextResponse.json(
                { message: "Option already added to this order item" },
                { status: 400 }
            );
        }

        // Get the item option to fetch its current price modifier
        const itemOption = await prisma.itemOption.findUnique({
            where: { id: optionId },
        });

        if (!itemOption) {
            return NextResponse.json(
                { message: "Item option not found" },
                { status: 404 }
            );
        }

        // Create the order item option
        const orderItemOption = await prisma.orderItemOption.create({
            data: {
                orderItemId,
                optionId,
                priceModifier: itemOption.priceModifier, // Capture current price modifier
            },
            include: {
                option: true, // Include the related option details
            },
        });

        return NextResponse.json(orderItemOption, { status: 201 });

    } catch (error) {
        console.error("Error creating order item option:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}