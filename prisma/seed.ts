import { PrismaClient, UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuration
const SAMPLE_IMAGES_DIR = path.join(process.cwd(), 'sample-images');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Make sure the upload directory exists
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
    fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}

// Helper to copy a random image from sample directory to public uploads
function copyRandomImage(filename: string): string {
    if (!fs.existsSync(SAMPLE_IMAGES_DIR)) {
        console.warn(`Sample images directory not found. Returning placeholder URL.`);
        return 'https://placehold.co/400x300?text=Coffee+Item';
    }

    const sampleImages = fs.readdirSync(SAMPLE_IMAGES_DIR).filter(file =>
        ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase())
    );

    if (sampleImages.length === 0) {
        console.warn('No sample images found. Returning placeholder URL.');
        return 'https://placehold.co/400x300?text=Coffee+Item';
    }

    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    const sourcePath = path.join(SAMPLE_IMAGES_DIR, randomImage);
    const targetPath = path.join(PUBLIC_UPLOADS_DIR, filename);

    fs.copyFileSync(sourcePath, targetPath);

    return `/uploads/${filename}`;
}

// Generate a hash for user passwords
async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

// Generate order number
function generateOrderNumber(): string {
    return `ORD-${faker.string.numeric(6)}`;
}

// Main seed function
async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('Cleaning existing data...');
    await prisma.review.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItemOption.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItemOption.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.itemOption.deleteMany();
    await prisma.item.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.storeSettings.deleteMany();

    // 1. Create Store Settings
    console.log('Creating store settings...');
    await prisma.storeSettings.create({
        data: {
            storeName: 'Brew Haven Coffee Shop',
            address: '123 Coffee Street, Brewville, CA 94123',
            phone: '(555) 123-4567',
            email: 'contact@brewhaven.com',
            logoUrl: '/logo.png',
            openingHours: {
                monday: { open: '07:00', close: '20:00' },
                tuesday: { open: '07:00', close: '20:00' },
                wednesday: { open: '07:00', close: '20:00' },
                thursday: { open: '07:00', close: '20:00' },
                friday: { open: '07:00', close: '22:00' },
                saturday: { open: '08:00', close: '22:00' },
                sunday: { open: '08:00', close: '18:00' }
            },
            taxRate: 8.5,
            currencySymbol: '$'
        }
    });

    // 2. Create Users
    console.log('Creating users...');

    // Admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
        data: {
            email: 'admin@brewhaven.com',
            firstName: 'Admin',
            lastName: 'User',
            password: adminPassword,
            role: UserRole.ADMIN,
            phone: '(555) 111-2222',
            address: '456 Admin Street, Brewville, CA 94123',
            isActive: true
        }
    });

    // Staff users
    const staffPassword = await hashPassword('staff123');
    for (let i = 0; i < 3; i++) {
        await prisma.user.create({
            data: {
                email: `staff${i + 1}@brewhaven.com`,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                password: staffPassword,
                role: UserRole.STAFF,
                phone: faker.phone.number(),
                address: faker.location.streetAddress(),
                isActive: true
            }
        });
    }

    // Regular users
    const userPassword = await hashPassword('user123');
    const regularUsers = [];
    for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                password: userPassword,
                role: UserRole.USER,
                phone: faker.phone.number(),
                address: faker.location.streetAddress(),
                isActive: true
            }
        });
        regularUsers.push(user);
    }

    // 3. Create Categories
    console.log('Creating categories...');
    const categories = [
        { name: 'Hot Coffee', description: 'Freshly brewed hot coffee drinks' },
        { name: 'Cold Coffee', description: 'Refreshing iced and cold brew coffee options' },
        { name: 'Tea', description: 'Selection of fine teas from around the world' },
        { name: 'Pastries', description: 'Freshly baked pastries and desserts' },
        { name: 'Sandwiches', description: 'Delicious sandwiches made with fresh ingredients' },
        { name: 'Breakfast', description: 'Start your day with our nutritious breakfast options' }
    ];

    const createdCategories = [];
    for (const category of categories) {
        const createdCategory = await prisma.category.create({
            data: {
                name: category.name,
                description: category.description,
                isActive: true
            }
        });
        createdCategories.push(createdCategory);
        console.log(`Created category: ${createdCategory.name}`);
    }

    // 4. Create Items with options
    console.log('Creating menu items with options...');

    const coffeeItems = [
        { name: 'Espresso', price: 3.5, preparationTime: 5 },
        { name: 'Cappuccino', price: 4.5, preparationTime: 7 },
        { name: 'Latte', price: 4.0, preparationTime: 6 },
        { name: 'Americano', price: 3.0, preparationTime: 4 },
        { name: 'Macchiato', price: 4.2, preparationTime: 5 }
    ];

    const coldCoffeeItems = [
        { name: 'Iced Coffee', price: 3.5, preparationTime: 3 },
        { name: 'Cold Brew', price: 4.5, preparationTime: 3 },
        { name: 'Frappuccino', price: 5.5, preparationTime: 8 },
        { name: 'Iced Latte', price: 4.5, preparationTime: 5 },
        { name: 'Iced Mocha', price: 5.0, preparationTime: 6 }
    ];

    const teaItems = [
        { name: 'Earl Grey', price: 3.0, preparationTime: 4 },
        { name: 'Green Tea', price: 3.0, preparationTime: 4 },
        { name: 'Chai Tea Latte', price: 4.5, preparationTime: 6 },
        { name: 'Chamomile', price: 3.0, preparationTime: 4 },
        { name: 'Matcha Latte', price: 5.0, preparationTime: 7 }
    ];

    const pastryItems = [
        { name: 'Croissant', price: 3.0, preparationTime: 2 },
        { name: 'Chocolate Muffin', price: 3.5, preparationTime: 2 },
        { name: 'Blueberry Scone', price: 3.5, preparationTime: 2 },
        { name: 'Cinnamon Roll', price: 4.0, preparationTime: 3 },
        { name: 'Apple Danish', price: 3.5, preparationTime: 2 }
    ];

    const sandwichItems = [
        { name: 'Turkey & Swiss', price: 8.5, preparationTime: 10 },
        { name: 'Veggie Wrap', price: 7.5, preparationTime: 8 },
        { name: 'BLT', price: 7.0, preparationTime: 8 },
        { name: 'Chicken Pesto', price: 9.0, preparationTime: 10 },
        { name: 'Ham & Cheese', price: 7.5, preparationTime: 8 }
    ];

    const breakfastItems = [
        { name: 'Avocado Toast', price: 8.0, preparationTime: 12 },
        { name: 'Breakfast Burrito', price: 9.0, preparationTime: 15 },
        { name: 'Oatmeal Bowl', price: 6.0, preparationTime: 8 },
        { name: 'Egg & Cheese Sandwich', price: 7.0, preparationTime: 10 },
        { name: 'Yogurt Parfait', price: 5.5, preparationTime: 5 }
    ];

    const allItemsByCategory = [
        coffeeItems,
        coldCoffeeItems,
        teaItems,
        pastryItems,
        sandwichItems,
        breakfastItems
    ];

    const createdItems = [];

    for (let i = 0; i < createdCategories.length; i++) {
        const category = createdCategories[i];
        const items = allItemsByCategory[i];

        for (const itemData of items) {
            const imageFilename = `${Date.now()}-${faker.string.alphanumeric(8)}.jpg`;
            const imageUrl = copyRandomImage(imageFilename);

            const item = await prisma.item.create({
                data: {
                    name: itemData.name,
                    description: faker.lorem.paragraph(),
                    price: itemData.price,
                    imageUrl: imageUrl,
                    isAvailable: faker.datatype.boolean(0.9), // 90% chance of being available
                    preparationTime: itemData.preparationTime,
                    categoryId: category.id
                }
            });

            createdItems.push(item);
            console.log(`Created item: ${item.name} in category ${category.name}`);

            // Create options for this item
            const numOptions = faker.number.int({ min: 1, max: 5 });
            for (let j = 0; j < numOptions; j++) {
                let optionName, priceModifier;

                // Generate appropriate options based on category
                if (category.name.includes('Coffee') || category.name.includes('Tea')) {
                    const coffeeOptions = [
                        { name: 'Extra Shot', price: 1.0 },
                        { name: 'Soy Milk', price: 0.5 },
                        { name: 'Almond Milk', price: 0.75 },
                        { name: 'Oat Milk', price: 0.75 },
                        { name: 'Vanilla Syrup', price: 0.5 },
                        { name: 'Caramel Syrup', price: 0.5 },
                        { name: 'Hazelnut Syrup', price: 0.5 },
                        { name: 'Whipped Cream', price: 0.5 },
                        { name: 'Large Size', price: 1.0 }
                    ];
                    const option = coffeeOptions[faker.number.int({ min: 0, max: coffeeOptions.length - 1 })];
                    optionName = option.name;
                    priceModifier = option.price;
                } else if (category.name === 'Pastries' || category.name === 'Breakfast') {
                    const foodOptions = [
                        { name: 'Add Butter', price: 0.0 },
                        { name: 'Gluten-Free', price: 1.5 },
                        { name: 'Add Jam', price: 0.5 },
                        { name: 'Warmed Up', price: 0.0 },
                        { name: 'Extra Berries', price: 1.0 }
                    ];
                    const option = foodOptions[faker.number.int({ min: 0, max: foodOptions.length - 1 })];
                    optionName = option.name;
                    priceModifier = option.price;
                } else {
                    const sandwichOptions = [
                        { name: 'Extra Cheese', price: 1.0 },
                        { name: 'Add Avocado', price: 1.5 },
                        { name: 'Gluten-Free Bread', price: 1.5 },
                        { name: 'Extra Meat', price: 2.0 },
                        { name: 'Add Bacon', price: 1.5 },
                        { name: 'Toasted', price: 0.0 }
                    ];
                    const option = sandwichOptions[faker.number.int({ min: 0, max: sandwichOptions.length - 1 })];
                    optionName = option.name;
                    priceModifier = option.price;
                }

                await prisma.itemOption.create({
                    data: {
                        itemId: item.id,
                        name: optionName,
                        priceModifier: priceModifier
                    }
                });
            }
        }
    }

    // 5. Create Carts for some users
    console.log('Creating user carts...');

    for (const user of regularUsers.slice(0, 5)) { // Create carts for half the users
        const cart = await prisma.cart.create({
            data: {
                userId: user.id
            }
        });

        // Add random items to cart
        const numCartItems = faker.number.int({ min: 1, max: 4 });
        for (let i = 0; i < numCartItems; i++) {
            const randomItem = createdItems[faker.number.int({ min: 0, max: createdItems.length - 1 })];

            const cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    itemId: randomItem.id,
                    quantity: faker.number.int({ min: 1, max: 3 }),
                    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 })
                }
            });

            // Get options for this item
            const options = await prisma.itemOption.findMany({
                where: { itemId: randomItem.id }
            });

            // Add some options to cart items
            if (options.length > 0) {
                const randomOption = options[faker.number.int({ min: 0, max: options.length - 1 })];
                await prisma.cartItemOption.create({
                    data: {
                        cartItemId: cartItem.id,
                        optionId: randomOption.id
                    }
                });
            }
        }

        console.log(`Created cart for user: ${user.email} with ${numCartItems} items`);
    }

    // 6. Create Orders with OrderItems and Payments
    console.log('Creating past orders...');

    const orderStatuses = Object.values(OrderStatus);
    const paymentMethods = Object.values(PaymentMethod);
    const paymentStatuses = Object.values(PaymentStatus);

    for (let i = 0; i < 20; i++) { // Create 20 past orders
        const randomUser = regularUsers[faker.number.int({ min: 0, max: regularUsers.length - 1 })];
        const orderStatus = orderStatuses[faker.number.int({ min: 0, max: orderStatuses.length - 1 })];
        const createdDate = faker.date.recent({ days: 30 });

        let completedAt = null;
        if (orderStatus === OrderStatus.COMPLETED) {
            completedAt = new Date(createdDate);
            completedAt.setMinutes(completedAt.getMinutes() + faker.number.int({ min: 15, max: 60 }));
        }

        // Create 1-5 order items
        const numOrderItems = faker.number.int({ min: 1, max: 5 });
        let totalAmount = 0;

        // Prepare order items data
        const orderItemsData = [];
        for (let j = 0; j < numOrderItems; j++) {
            const randomItem = createdItems[faker.number.int({ min: 0, max: createdItems.length - 1 })];
            const quantity = faker.number.int({ min: 1, max: 3 });
            const unitPrice = randomItem.price;

            totalAmount += unitPrice * quantity;

            orderItemsData.push({
                item: randomItem,
                quantity,
                unitPrice,
                notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 })
            });
        }

        // Apply tax
        const tax = parseFloat((totalAmount * 0.085).toFixed(2)); // 8.5% tax
        totalAmount += tax;

        // Create the order
        const order = await prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId: randomUser.id,
                status: orderStatus,
                totalAmount,
                discount: faker.helpers.maybe(() => parseFloat((totalAmount * faker.number.float({ min: 0.05, max: 0.2 })).toFixed(2)), { probability: 0.2 }),
                tax,
                notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
                createdAt: createdDate,
                updatedAt: createdDate,
                completedAt
            }
        });

        // Create order items
        for (const itemData of orderItemsData) {
            const orderItem = await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    itemId: itemData.item.id,
                    quantity: itemData.quantity,
                    unitPrice: itemData.unitPrice,
                    notes: itemData.notes,
                    createdAt: createdDate,
                    updatedAt: createdDate
                }
            });

            // Get options for this item
            const options = await prisma.itemOption.findMany({
                where: { itemId: itemData.item.id }
            });

            // Add some options to order items
            if (options.length > 0) {
                const numOptions = faker.number.int({ min: 0, max: Math.min(options.length, 2) });
                const selectedOptions = faker.helpers.arrayElements(options, numOptions);

                for (const option of selectedOptions) {
                    await prisma.orderItemOption.create({
                        data: {
                            orderItemId: orderItem.id,
                            optionId: option.id,
                            priceModifier: option.priceModifier
                        }
                    });
                }
            }
        }

        // Create payment for this order
        let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
        if (orderStatus === OrderStatus.COMPLETED || orderStatus === OrderStatus.READY) {
            paymentStatus = PaymentStatus.PAID;
        } else if (orderStatus === OrderStatus.CANCELLED) {
            paymentStatus = faker.helpers.arrayElement([PaymentStatus.FAILED, PaymentStatus.REFUNDED]);
        }

        await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: totalAmount,
                paymentMethod: faker.helpers.arrayElement(paymentMethods),
                status: paymentStatus,
                transactionId: faker.helpers.maybe(() => `TXN-${faker.string.alphanumeric(8).toUpperCase()}`, { probability: 0.8 }),
                paymentDate: paymentStatus === PaymentStatus.PAID ? createdDate : null,
                createdAt: createdDate,
                updatedAt: createdDate
            }
        });

        console.log(`Created order: ${order.orderNumber} with status ${orderStatus} for user ${randomUser.email}`);
    }

    // 7. Create Favorites
    console.log('Creating user favorites...');

    for (const user of regularUsers) {
        const numFavorites = faker.number.int({ min: 0, max: 5 });
        const randomItems = faker.helpers.arrayElements(createdItems, numFavorites);

        for (const item of randomItems) {
            await prisma.favorite.create({
                data: {
                    userId: user.id,
                    itemId: item.id
                }
            });
        }

        console.log(`Created ${numFavorites} favorites for user: ${user.email}`);
    }

    // 8. Create Reviews
    console.log('Creating item reviews...');

    for (const user of regularUsers) {
        const numReviews = faker.number.int({ min: 0, max: 5 });
        const randomItems = faker.helpers.arrayElements(createdItems, numReviews);

        for (const item of randomItems) {
            await prisma.review.create({
                data: {
                    userId: user.id,
                    itemId: item.id,
                    rating: faker.number.int({ min: 3, max: 5 }), // Mostly positive reviews
                    comment: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.7 })
                }
            });
        }

        console.log(`Created ${numReviews} reviews for user: ${user.email}`);
    }

    console.log('🚀 Database seeding completed successfully!');
}

main()
    .catch(e => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });