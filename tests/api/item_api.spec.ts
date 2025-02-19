import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '@/test.config';
import { signIn, getAuthHeaders } from '@/lib/auth-utils';

const ITEM_URL = `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.ITEM}`;
const CATEGORY_URL = `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.CATEGORY}`;

// Define test context interface
interface TestContext {
  authToken?: string;
  categoryId?: string;
  itemId?: string;
}

// Create a fixture for shared context
const testContext: TestContext = {};

test.beforeAll(async ({ request }) => {
  try {
    // Get auth token
    testContext.authToken = await signIn();
    
    // Create a test category
    const categoryResponse = await request.post(CATEGORY_URL, {
      headers: {
        ...getAuthHeaders(testContext.authToken),
        'Content-Type': 'application/json',
      },
      data: {
        name: `Test Category ${Date.now()}`,
        description: 'Test Category Description',
        isActive: true,
        imageUrl: 'https://example.com/test.jpg',
      },
    });

    if (categoryResponse.status() !== 201) {
      throw new Error(`Failed to create test category: ${categoryResponse.status()}`);
    }

    const category = await categoryResponse.json();
    testContext.categoryId = category.id;
    
    expect(testContext.categoryId).toBeDefined();
    expect(typeof testContext.categoryId).toBe('string');
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

test.describe('Item API Tests', () => {
  const getTestItem = (categoryId: string) => ({
    name: 'Espresso',
    description: 'Strong and rich espresso',
    price: 2.99,
    imageUrl: 'https://example.com/espresso.jpg',
    isAvailable: true,
    preparationTime: 5,
    categoryId,
    options: [{ name: 'Extra Shot', price: 0.5 }],
  });

  test('POST /item - Create a new item', async ({ request }) => {
    expect(testContext.categoryId).toBeDefined();
    const testItem = getTestItem(testContext.categoryId!);

    const response = await request.post(ITEM_URL, {
      headers: {
        ...getAuthHeaders(testContext.authToken!),
        'Content-Type': 'application/json',
      },
      data: testItem,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    testContext.itemId = body.id;
    
    expect(testContext.itemId).toBeDefined();
    expect(typeof testContext.itemId).toBe('string');
    expect(body).toMatchObject({
      name: testItem.name,
      description: testItem.description,
      price: testItem.price,
      categoryId: testContext.categoryId,
    });
  });

  test('GET /item - Fetch all items', async ({ request }) => {
    const response = await request.get(ITEM_URL, {
      headers: getAuthHeaders(testContext.authToken!),
    });

    expect(response.status()).toBe(200);
    const items = await response.json();
    expect(Array.isArray(items)).toBeTruthy();
    
    const foundItem = items.find((item) => item.id === testContext.itemId);
    expect(foundItem).toBeDefined();
    expect(foundItem?.categoryId).toBe(testContext.categoryId);
  });

  test('GET /item/:id - Fetch a single item', async ({ request }) => {
    const response = await request.get(`${ITEM_URL}/${testContext.itemId}`, {
      headers: getAuthHeaders(testContext.authToken!),
    });

    expect(response.status()).toBe(200);
    const item = await response.json();
    expect(item.id).toBe(testContext.itemId);
    expect(item.categoryId).toBe(testContext.categoryId);
  });

  test('PUT /item/:id - Update item', async ({ request }) => {
    const updateData = {
      name: 'Updated Espresso',
      description: 'Updated description',
    };

    const response = await request.put(`${ITEM_URL}/${testContext.itemId}`, {
      headers: {
        ...getAuthHeaders(testContext.authToken!),
        'Content-Type': 'application/json',
      },
      data: updateData,
    });

    expect(response.status()).toBe(200);
    const updatedItem = await response.json();
    expect(updatedItem.id).toBe(testContext.itemId);
    expect(updatedItem.name).toBe(updateData.name);
    expect(updatedItem.description).toBe(updateData.description);
    expect(updatedItem.categoryId).toBe(testContext.categoryId);
  });

  test('DELETE /item/:id - Delete item', async ({ request }) => {
    const response = await request.delete(`${ITEM_URL}/${testContext.itemId}`, {
      headers: getAuthHeaders(testContext.authToken!),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('message');

    // Verify item is actually deleted
    const getResponse = await request.get(`${ITEM_URL}/${testContext.itemId}`, {
      headers: getAuthHeaders(testContext.authToken!),
    });
    expect(getResponse.status()).toBe(404);
  });

  test('POST /item - Should return 401 for unauthorized user', async ({ request }) => {
    const testItem = getTestItem(testContext.categoryId!);
    const response = await request.post(ITEM_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: testItem,
    });
    expect(response.status()).toBe(401);
  });
});

test.afterAll(async ({ request }) => {
  try {
    // Cleanup: Delete the test category
    if (testContext.categoryId) {
      const response = await request.delete(`${CATEGORY_URL}/${testContext.categoryId}`, {
        headers: getAuthHeaders(testContext.authToken!),
      });
      expect(response.status()).toBe(200);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
});