import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '@/test.config';
import { signIn, getAuthHeaders } from '@/lib/auth-utils';

const ITEM_URL = `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.ITEM}`;
const ITEM_OPTION_URL = `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.ITEM_OPTION}`;
const CATEGORY_URL = `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.CATEGORY}`;

interface TestContext {
  authToken?: string;
  categoryId?: string;
  itemId?: string;
  itemOptionId?: string;
}

const testContext: TestContext = {};

test.beforeAll(async ({ request }) => {
  try {
    // Get auth token
    testContext.authToken = await signIn();
    
    // Create test category
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

    const category = await categoryResponse.json();
    testContext.categoryId = category.id;

    // Create test item
    const itemResponse = await request.post(ITEM_URL, {
      headers: {
        ...getAuthHeaders(testContext.authToken),
        'Content-Type': 'application/json',
      },
      data: {
        name: `Test Item  ${Date.now()}`,
        description: 'Test Item Description',
        price: 9.99,
        preparationTime: 10,
        imageUrl: 'https://example.com/test.jpg',
        categoryId: testContext.categoryId,
        isAvailable: true,
      },
    });

    const item = await itemResponse.json();
    testContext.itemId = item.id;
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

test.describe('Item Option API Tests', () => {
  const testItemOption = {
    name: 'Extra Shot',
    priceModifier: 0.50,
  };

  test('POST /item-option - Create a new item option', async ({ request }) => {
    const response = await request.post(ITEM_OPTION_URL, {
      headers: {
        ...getAuthHeaders(testContext.authToken!),
        'Content-Type': 'application/json',
      },
      data: {
        ...testItemOption,
        itemId: testContext.itemId,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    testContext.itemOptionId = body.id;
    
    expect(body).toMatchObject({
      name: testItemOption.name,
      priceModifier: testItemOption.priceModifier,
      itemId: testContext.itemId,
    });
  });

  test('GET /item-option - Fetch all item options', async ({ request }) => {
    const response = await request.get(ITEM_OPTION_URL, {
      headers: getAuthHeaders(testContext.authToken!),
    });

    expect(response.status()).toBe(200);
    const options = await response.json();
    expect(Array.isArray(options)).toBeTruthy();

    // Access the first item option
    const firstOption = options[0];
    expect(firstOption).toHaveProperty('id');
    expect(firstOption).toHaveProperty('name');
    expect(firstOption).toHaveProperty('priceModifier');
  });

  test('GET /item-option/:id - Fetch a single item option', async ({ request }) => {
    const response = await request.get(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: getAuthHeaders(testContext.authToken!),
    });

    expect(response.status()).toBe(200);
    const option = await response.json();
    expect(option.id).toBe(testContext.itemOptionId);
    expect(option.itemId).toBe(testContext.itemId);
  });

  test('PUT /item-option/:id - Update item option', async ({ request }) => {
    const updateData = {
      name: 'Double Shot',
      priceModifier: 1.00,
    };

    const response = await request.put(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: {
        ...getAuthHeaders(testContext.authToken!),
        'Content-Type': 'application/json',
      },
      data: updateData,
    });

    expect(response.status()).toBe(200);
    const updatedOption = await response.json();
    expect(updatedOption.id).toBe(testContext.itemOptionId);
    expect(updatedOption.name).toBe(updateData.name);
    expect(updatedOption.priceModifier).toBe(updateData.priceModifier);
    expect(updatedOption.itemId).toBe(testContext.itemId);
  });

  test('PUT /item-option/:id - Should validate required fields', async ({ request }) => {
    const response = await request.put(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: {
        ...getAuthHeaders(testContext.authToken!),
        'Content-Type': 'application/json',
      },
      data: {
        name: '', // Empty name should fail validation
        priceModifier: null, // Missing price should fail validation
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('requiredFields');
  });

  test('DELETE /item-option/:id - Delete item option', async ({ request }) => {
    const response = await request.delete(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: getAuthHeaders(testContext.authToken!),
    });

    expect(response.status()).toBe(200);
    
    // Verify option is deleted
    const getResponse = await request.get(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: getAuthHeaders(testContext.authToken!),
    });
    expect(getResponse.status()).toBe(404);
  });

  test('Authorization Tests', async ({ request }) => {
    // Test unauthorized creation
    const createResponse = await request.post(ITEM_OPTION_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        ...testItemOption,
        itemId: testContext.itemId,
      },
    });
    expect(createResponse.status()).toBe(401);

    // Test unauthorized update
    const updateResponse = await request.put(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        name: 'Unauthorized Update',
        priceModifier: 1.50,
      },
    });
    expect(updateResponse.status()).toBe(401);

    // Test unauthorized deletion
    const deleteResponse = await request.delete(`${ITEM_OPTION_URL}/${testContext.itemOptionId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(deleteResponse.status()).toBe(401);
  });
});

test.afterAll(async ({ request }) => {
  try {
    // Clean up in reverse order
    if (testContext.itemId) {
      await request.delete(`${ITEM_URL}/${testContext.itemId}`, {
        headers: getAuthHeaders(testContext.authToken!),
      });
    }
    
    if (testContext.categoryId) {
      await request.delete(`${CATEGORY_URL}/${testContext.categoryId}`, {
        headers: getAuthHeaders(testContext.authToken!),
      });
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
});