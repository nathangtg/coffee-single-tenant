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
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
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
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
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
        const data = await req.json();
        const { notes } = data;

        // Fetch user's cart with all related items and options
        const cart = await prisma.cart.findFirst({
            where: {
                userId: user.id
            },
            include: {
                cartItems: {
                    include: {
                        item: true,
                        options: {
                            include: {
                                option: true
                            }
                        }
                    }
                }
            }
        });

        if (!cart || cart.cartItems.length === 0) {
            return NextResponse.json({
                message: 'Cart is empty. Please add items before creating an order.'
            }, { status: 400 });
        }

        // Calculate total amount and prepare order items
        let totalAmount = 0;
        const orderItems = cart.cartItems.map(cartItem => {
            const itemTotal = cartItem.item.price * cartItem.quantity;

            // Calculate options price modifiers
            const optionsTotal = cartItem.options.reduce((sum, opt) =>
                sum + (opt.option.priceModifier || 0), 0);

            const itemTotalWithOptions = (itemTotal + optionsTotal * cartItem.quantity);
            totalAmount += itemTotalWithOptions;

            return {
                itemId: cartItem.itemId,
                quantity: cartItem.quantity,
                unitPrice: cartItem.item.price,
                notes: cartItem.notes,
                options: {
                    create: cartItem.options.map(opt => ({
                        optionId: opt.optionId,
                        priceModifier: opt.option.priceModifier || 0
                    }))
                }
            };
        });

        // Generate unique order number
        const orderNumber = await generateOrderNumber();

        // Create order and delete cart in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
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

            // Delete the cart items
            await tx.cartItem.deleteMany({
                where: {
                    cartId: cart.id
                }
            });

            // Delete the cart itself
            await tx.cart.delete({
                where: {
                    id: cart.id
                }
            });

            return newOrder;
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Error creating order from cart:', error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}