import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '@/lib/auth-utils';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// GET restaurant settings
export async function GET() {
    try {
        let settings = await prisma.storeSettings.findFirst();

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: {
                    storeName: "Coffee Shop",
                    taxRate: 0,
                    currencySymbol: "$"
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching restaurant settings:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// UPDATE restaurant settings (admin only)
export async function PUT(req: NextRequest) {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        // Get the first settings record (should be only one)
        const currentSettings = await prisma.storeSettings.findFirst();

        if (!currentSettings) {
            return NextResponse.json({ message: 'Settings not found' }, { status: 404 });
        }

        // Parse the form data
        const formData = await req.formData();

        // Extract fields
        const storeName = formData.get('storeName') as string;
        const address = formData.get('address') as string;
        const phone = formData.get('phone') as string;
        const email = formData.get('email') as string;
        const openingHoursJson = formData.get('openingHours') as string;
        const openingHours = openingHoursJson ? JSON.parse(openingHoursJson) : null;
        const taxRate = formData.get('taxRate') as string;
        const currencySymbol = formData.get('currencySymbol') as string;

        // Handle logo file
        const logoFile = formData.get('logo') as File;
        let logoPath = currentSettings.logoUrl;

        // Process logo if provided
        if (logoFile) {
            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logo');
            await mkdir(uploadDir, { recursive: true });

            // Generate unique filename
            const fileExtension = logoFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Save the file
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            await writeFile(filePath, buffer);

            // Set relative path for database
            logoPath = `/uploads/logo/${fileName}`;
        }

        // Update the settings
        const updatedSettings = await prisma.storeSettings.update({
            where: {
                id: currentSettings.id
            },
            data: {
                storeName: storeName || currentSettings.storeName,
                address: address ?? currentSettings.address,
                phone: phone ?? currentSettings.phone,
                email: email ?? currentSettings.email,
                logoUrl: logoPath,
                openingHours: openingHours ?? currentSettings.openingHours,
                taxRate: taxRate ? parseFloat(taxRate) : currentSettings.taxRate,
                currencySymbol: currencySymbol || currentSettings.currencySymbol,
            }
        });

        return NextResponse.json(updatedSettings);
    } catch (error) {
        console.error('Error updating restaurant settings:', error);
        return NextResponse.json({ message: 'Server error', error: (error as Error).message }, { status: 500 });
    }
}

// CREATE new restaurant settings (admin only)
// Note: This is mainly for initialization purposes since we should only have one record
export async function POST(req: NextRequest) {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        // Check if settings already exist
        const existingSettings = await prisma.storeSettings.findFirst();

        if (existingSettings) {
            return NextResponse.json({
                message: 'Settings already exist, use PUT to update',
                settings: existingSettings
            }, { status: 400 });
        }

        // Parse the form data
        const formData = await req.formData();

        // Extract fields
        const storeName = formData.get('storeName') as string;
        const address = formData.get('address') as string;
        const phone = formData.get('phone') as string;
        const email = formData.get('email') as string;
        const openingHoursJson = formData.get('openingHours') as string;
        const openingHours = openingHoursJson ? JSON.parse(openingHoursJson) : null;
        const taxRate = formData.get('taxRate') as string;
        const currencySymbol = formData.get('currencySymbol') as string;

        // Handle logo file
        const logoFile = formData.get('logo') as File;
        let logoPath: string | null = null;

        // Process logo if provided
        if (logoFile) {
            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logo');
            await mkdir(uploadDir, { recursive: true });

            // Generate unique filename
            const fileExtension = logoFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Save the file
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            await writeFile(filePath, buffer);

            // Set relative path for database
            logoPath = `/uploads/logo/${fileName}`;
        }

        // Create new settings
        const newSettings = await prisma.storeSettings.create({
            data: {
                storeName: storeName || "Coffee Shop",
                address,
                phone,
                email,
                logoUrl: logoPath,
                openingHours,
                taxRate: taxRate ? parseFloat(taxRate) : 0,
                currencySymbol: currencySymbol || "$",
            }
        });

        return NextResponse.json(newSettings, { status: 201 });
    } catch (error) {
        console.error('Error creating restaurant settings:', error);
        return NextResponse.json({ message: 'Server error', error: (error as Error).message }, { status: 500 });
    }
}

// DELETE restaurant settings (admin only)
export async function DELETE(req: NextRequest) {
    try {
        // Check if user is admin
        if (!isAdmin(req)) {
            return NextResponse.json({ message: 'Unauthorized, admin access required' }, { status: 401 });
        }

        // Get the first settings record
        const settings = await prisma.storeSettings.findFirst();

        if (!settings) {
            return NextResponse.json({ message: 'Settings not found' }, { status: 404 });
        }

        // Instead of deleting, reset to defaults
        const resetSettings = await prisma.storeSettings.update({
            where: {
                id: settings.id
            },
            data: {
                storeName: "Coffee Shop",
                address: null,
                phone: null,
                email: null,
                logoUrl: null,
                openingHours: null,
                taxRate: 0,
                currencySymbol: "$",
            }
        });

        return NextResponse.json({
            message: 'Settings reset to defaults',
            settings: resetSettings
        });
    } catch (error) {
        console.error('Error resetting restaurant settings:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}