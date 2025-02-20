import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { orderId, itemId, quantity, notes, options } = data;

        // Validate required fields
        if (!orderId || !itemId || !quantity) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate quantity is positive
        if (quantity <= 0) {
            return NextResponse.json(
                { message: "Quantity must be greater than 0" },
                { status: 400 }
            );
        }

        // Get the item to fetch current price
        const item = await prisma.item.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return NextResponse.json(
                { message: "Item not found" },
                { status: 404 }
            );
        }

        // Verify order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        // Create the order item
        const orderItem = await prisma.orderItem.create({
            data: {
                orderId,
                itemId,
                quantity,
                unitPrice: item.price, // Assuming item has a price field
                notes: notes || undefined,
                options: {
                    create: options || [] // If options are provided, create them
                }
            },
            include: {
                options: true, // Include options in the response
                item: true     // Include item details in the response
            }
        });

        return NextResponse.json(orderItem, { status: 201 });

    } catch (error) {
        console.error("Error creating order item:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}