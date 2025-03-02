import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

test('Complete coffee shop order flow', async ({ page }) => {
    // Navigate to the dev URL
    await page.goto(process.env.DEV_URL);

    // Log in with provided credentials
    await page.getByRole('link', { name: 'Login' }).click();

    await page.locator('input[name="email"]').fill('johndoe@example.com');
    await page.locator('input[name="password"]').fill('SecurePassword123!');

    // Click login button
    await page.locator('button[type="submit"]:has-text("Login")').click();

    // Verify login was successful by checking we're back at the home page
    await expect(page).toHaveURL(process.env.DEV_URL);

    // Navigate to Coffee Shop - using a more specific selector
    await page.locator('a.text-sm.font-medium.text-gray-700:has-text("Coffee Shop")').click();

    // Wait until the page is loaded
    await page.waitForLoadState('networkidle');

    // Go to Appetizer section
    await page.locator('button[role="tab"]:has-text("Appettizer")').click();

    // Find and click the burger item
    const burgerCard = page.locator('div.font-semibold.text-lg.text-amber-900:has-text("This is a Burger")').first();
    await burgerCard.click();

    // Add extra cheese
    await page.locator('button:has-text("Extra Cheese")').click();

    // Verify total amount is correct
    await expect(page.locator('div.text-lg.text-amber-900:has-text("Total:")'))
        .toContainText('$10.99');

    // Add to cart
    await page.locator('button:has-text("Add to Cart")').click();

    // Verify item was added to cart by checking the cart counter
    await expect(page.locator('button[aria-label="View cart"] span.font-semibold'))
        .toHaveText('1');

    // Click on cart button
    await page.locator('button[aria-label="View cart"]').click();

    // Verify total amount in cart
    await expect(page.locator('span.text-amber-900.font-serif'))
        .toHaveText('$12.09');

    // Verify Extra Cheese add-on is listed
    await expect(page.locator('div.inline-flex:has-text("Extra Cheese (+$5.00)")'))
        .toBeVisible();

    // Proceed to checkout
    await page.locator('button:has-text("Proceed to Checkout")').click();

    // Confirm order
    await page.locator('button:has-text("Confirm Order")').click();

    // Select payment method
    await page.locator('button[role="combobox"]:has-text("Choose payment method")').click();

    // Select credit card option
    await page.locator('div[role="option"]:has-text("CREDIT CARD")').click();

    // Complete payment
    await page.locator('button:has-text("Complete Payment")').click();

    // Verify payment was successful
    await expect(page.locator('div.font-semibold:has-text("Payment Successful")'))
        .toBeVisible();

    // Additional verification for the success icon
    await expect(page.locator('svg.lucide-circle-check-big')).toBeVisible();
});