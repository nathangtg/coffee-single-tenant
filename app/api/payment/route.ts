import { getAuthenticatedUser, isAdmin, isLoggedIn } from '@/lib/auth-utils';
import { PaymentStatus, PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';


const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: "Unauthorized, login required" }, { status: 401 });
        }

        const user = getAuthenticatedUser(req);
        const userId = user.id;
        const userIsAdmin = isAdmin(req);

        const payments = await prisma.payment.findMany({
            where: userIsAdmin ? {} : { order: { userId } },
            include: {
                order: {
                    include: {
                        user: {
                            select: { id: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(payments, { status: 200 });
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}


// POST new payment
export async function POST(req: NextRequest) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json(
                { message: "Unauthorized, login required" },
                { status: 401 }
            );
        }

        const user = getAuthenticatedUser(req);
        const userId = user.id;
        const userIsAdmin = isAdmin(req);

        const data = await req.json();
        const { orderId, amount, paymentMethod, transactionId } = data;

        // Validate required fields
        if (!orderId || !amount || !paymentMethod) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify order exists and check authorization
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true }
        });

        if (!order) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        if (!userIsAdmin && order.userId !== userId) {
            return NextResponse.json(
                { message: "Unauthorized to create payment for this order" },
                { status: 403 }
            );
        }

        if (order.payment) {
            return NextResponse.json(
                { message: "Payment already exists for this order" },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.create({
            data: {
                orderId,
                amount,
                paymentMethod,
                transactionId,
                status: PaymentStatus.PENDING,
            },
            include: {
                order: true
            }
        });

        return NextResponse.json(payment, { status: 201 });

    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}