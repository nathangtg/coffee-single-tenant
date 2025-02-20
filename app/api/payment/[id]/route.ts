import { getAuthenticatedUser, isAdmin, isLoggedIn } from "@/lib/auth-utils";
import { OrderStatus, PaymentStatus, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface updateData {
    status?: PaymentStatus;
    transactionId?: string;
    paymentDate?: Date;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const { id } = params;
        const user = getAuthenticatedUser(req);
        const userIsAdmin = isAdmin(req);

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        user: {
                            select: { id: true, email: true }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return NextResponse.json(
                { message: "Payment not found" },
                { status: 404 }
            );
        }

        // Check if user is either admin or the order owner
        const isOrderOwner = payment.order.user.id === user.id;

        if (!userIsAdmin && !isOrderOwner) {
            return NextResponse.json(
                { message: "You don't have permission to view this payment" },
                { status: 403 }
            );
        }

        return NextResponse.json(payment, { status: 200 });

    } catch (error) {
        console.error("Error fetching payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const { id } = params;
        const data = await req.json();
        const { status, transactionId, paymentDate } = data;

        const user = getAuthenticatedUser(req);
        const userId = user.id;
        const userIsAdmin = isAdmin(req);

        // Fetch the payment and related order
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                order: true
            }
        });

        if (!payment) {
            return NextResponse.json(
                { message: "Payment not found" },
                { status: 404 }
            );
        }

        // Check if user is either admin or the order owner
        const isOrderOwner = payment.order.userId === userId;
        if (!userIsAdmin && !isOrderOwner) {
            return NextResponse.json(
                { message: "You don't have permission to update this payment" },
                { status: 403 }
            );
        }

        // Validate status transitions based on user role
        if (!userIsAdmin && isOrderOwner) {
            // Order owners can only update to PAID status and only from PENDING
            if (status !== 'PAID' || payment.status !== 'PENDING') {
                return NextResponse.json(
                    { message: "You can only mark pending payments as paid" },
                    { status: 403 }
                );
            }
        }

        // Prepare update data
        const updateData: updateData = {};

        // Order owners can only update status
        if (isOrderOwner && !userIsAdmin) {
            updateData.status = status;
            updateData.paymentDate = new Date(); // Automatically set payment date
        } else if (userIsAdmin) {
            // Admins can update all fields
            updateData.status = status || undefined;
            updateData.transactionId = transactionId || undefined;
            updateData.paymentDate = paymentDate ? new Date(paymentDate) : undefined;
        }

        // Update the payment
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: updateData,
            include: {
                order: true
            }
        });

        // If payment is marked as PAID, update order status to PROCESSING
        if (updatedPayment.status === 'PAID' && payment.order.status === 'PENDING') {
            await prisma.order.update({
                where: { id: payment.order.id },
                data: { status: OrderStatus.PREPARING }
            });
        }

        return NextResponse.json(updatedPayment, { status: 200 });

    } catch (error) {
        console.error("Error updating payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE payment
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const { id } = params;
        const userIsAdmin = isAdmin(req);

        // Only admins can delete payments
        if (!userIsAdmin) {
            return NextResponse.json(
                { message: "Only administrators can delete payments" },
                { status: 403 }
            );
        }

        const payment = await prisma.payment.findUnique({
            where: { id }
        });

        if (!payment) {
            return NextResponse.json(
                { message: "Payment not found" },
                { status: 404 }
            );
        }

        await prisma.payment.delete({
            where: { id }
        });

        return NextResponse.json(
            { message: "Payment successfully deleted" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

