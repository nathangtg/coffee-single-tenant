import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { isLoggedIn, getAuthenticatedUser, isAdmin } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// Types for order creation
interface OrderItemOption {
    id: string;
}

interface OrderItem {
    id: string;
    quantity: number;
    options?: OrderItemOption[];
    notes?: string;
}

interface CreateOrderInput {
    items: OrderItem[];
    notes?: string;
}

async function generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Ensure uniqueness
    const existingOrder = await prisma.order.findUnique({
        where: { orderNumber }
    });

    if (existingOrder) {
        return generateOrderNumber(); // Try again if collision
    }

    return orderNumber;
}

export async function calculateOrderDetails(items: OrderItem[]) {
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
        const menuItem = await prisma.item.findUnique({
            where: { id: item.id },
            include: {
                options: true,
            },
        });

        if (!menuItem) {
            throw new Error(`Item with ID ${item.id} not found`);
        }

        if (!menuItem.isAvailable) {
            throw new Error(`Item ${menuItem.name} is currently unavailable`);
        }

        let itemTotal = menuItem.price * item.quantity;
        const itemOptions = [];

        // Calculate options cost and prepare options data
        if (item.options?.length) {
            const optionsData = await prisma.itemOption.findMany({
                where: {
                    id: {
                        in: item.options.map(opt => opt.id)
                    }
                }
            });

            for (const option of optionsData) {
                itemTotal += option.priceModifier * item.quantity;
                itemOptions.push({
                    optionId: option.id,
                    priceModifier: option.priceModifier
                });
            }
        }

        totalAmount += itemTotal;
        orderItems.push({
            itemId: item.id,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            notes: item.notes,
            options: {
                create: itemOptions
            }
        });
    }

    return { totalAmount, orderItems };
}

export async function GET(req: NextRequest) {
    try {
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        // Check if the user is an admin
        const isUserAdmin = isAdmin(req);

        // Get the authenticated user
        const user = getAuthenticatedUser(req);

        let orders;

        // Fetch orders based on user role
        if (isUserAdmin) {
            // Admin can see all orders
            orders = await prisma.order.findMany({
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
                    payment: true
                },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            // Regular users can only see their own orders
            orders = await prisma.order.findMany({
                where: {
                    userId: user.id,
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
                orderBy: { createdAt: 'desc' },
            });
        }

        // Return the orders as a JSON response
        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        if (!isLoggedIn(req)) {
            return NextResponse.json({ message: 'Unauthorized, login required' }, { status: 401 });
        }

        const user = getAuthenticatedUser(req);
        const data: CreateOrderInput = await req.json();
        const { items, notes } = data;

        // Input validation
        if (!items?.length) {
            return NextResponse.json({
                message: 'Invalid order data. At least one item is required.'
            }, { status: 400 });
        }

        // Validate quantities
        if (items.some(item => item.quantity < 1)) {
            return NextResponse.json({
                message: 'Invalid quantity. All items must have a quantity greater than 0.'
            }, { status: 400 });
        }

        // Generate unique order number and calculate totals
        const [orderNumber, { totalAmount, orderItems }] = await Promise.all([
            generateOrderNumber(),
            calculateOrderDetails(items)
        ]);

        // Create the order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: user.id,
                totalAmount,
                status: OrderStatus.PENDING,
                notes,
                orderItems: {
                    create: orderItems
                }
            },
            include: {
                orderItems: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            }
                        },
                        options: {
                            include: {
                                option: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}