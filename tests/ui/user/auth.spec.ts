import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Utility function to generate random data
const generateRandomString = (length = 8) => Math.random().toString(36).substring(2, 2 + length);
const generateRandomEmail = () => `${generateRandomString()}@example.com`;
const generateRandomPhone = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

// Shared Email
const sharedEmail = generateRandomEmail();

// Registration test
test('User registration flow', async ({ page }) => {
    // Generate test data
    const firstName = generateRandomString(6);
    const lastName = generateRandomString(6);
    const email = sharedEmail
    const password = 'SecurePassword123!';
    const phone = generateRandomPhone();

    console.log(`Registering with: ${email}`);

    // Navigate to the dev URL
    await page.goto(process.env.DEV_URL);

    // Click the register link
    await page.getByRole('link', { name: 'Register' }).click();

    // Wait for navigation and click the register tab
    await page.locator('button[id^="radix-"][aria-controls^="radix-"][aria-controls*="content-register"]').click();

    // Fill in the registration form
    await page.locator('input[name="firstName"]').fill(firstName);
    await page.locator('input[name="lastName"]').fill(lastName);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="phone"]').fill(phone);

    // Click the register button
    await page.locator('button[type="submit"]:has-text("Register")').click();

    // Expect success message
    await expect(page.locator('div.text-sm:has-text("Registration successful! Please login.")')).toBeVisible();

    // Store generated email and password for login test
    test.info().attach('userCredentials', {
        body: JSON.stringify({ email, password }, null, 2),
        contentType: 'application/json'
    });
});

// Login test
test('User login flow', async ({ page }) => {
    // Generate test data (same as above for consistency)
    const email = sharedEmail
    const password = 'SecurePassword123!';

    console.log(`Logging in with: ${email}`);

    // Navigate to the dev URL
    await page.goto(process.env.DEV_URL);

    // Click the login link
    await page.getByRole('link', { name: 'Login' }).click();

    // Fill in login credentials
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);

    // Click the login button
    await page.locator('button[type="submit"]:has-text("Login")').click();

    // Expect to be redirected back to DEV_URL
    await expect(page).toHaveURL(process.env.DEV_URL);
});
