import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '@/test.config';
import { signIn, getAuthHeaders } from '@/lib/auth-utils';

const CATEGORY_URL = `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.CATEGORY}`;
let authToken: string;

test.beforeAll(async () => {
  authToken = await signIn();
});

test.describe('Category API Tests', () => {
  let categoryId: string;

  const testCategory = {
    name: `Test Category ${Date.now()}`,
    description: 'Premium coffee beans',
    imageUrl: 'https://example.com/coffee.jpg',
    isActive: true,
  };

  test('POST /category - Create a new category', async ({ request }) => {
    const response = await request.post(CATEGORY_URL, {
      headers: getAuthHeaders(authToken),
      data: testCategory,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    categoryId = body.id;
    expect(body.name).toBe(testCategory.name);
  });

  test('GET /category - Fetch all categories', async ({ request }) => {
    const response = await request.get(CATEGORY_URL);
    expect(response.status()).toBe(200);
    const categories = await response.json();
    expect(Array.isArray(categories)).toBeTruthy();
  });

  test('GET /category/:id - Fetch a single category', async ({ request }) => {
    const response = await request.get(`${CATEGORY_URL}/${categoryId}`);
    expect(response.status()).toBe(200);
    const category = await response.json();
    expect(category.id).toBe(categoryId);
  });

  test('PUT /category/:id - Update category', async ({ request }) => {
    const response = await request.put(`${CATEGORY_URL}/${categoryId}`, {
      headers: getAuthHeaders(authToken),
      data: { name: 'Updated Coffee Beans' },
    });

    expect(response.status()).toBe(200);
    const updatedCategory = await response.json();
    expect(updatedCategory.name).toBe('Updated Coffee Beans');
  });

  test('DELETE /category/:id - Delete category', async ({ request }) => {
    const response = await request.delete(`${CATEGORY_URL}/${categoryId}`, {
      headers: getAuthHeaders(authToken),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Category deleted successfully');
  });

  test('POST /category - Should return 401 for unauthorized user', async ({ request }) => {
    const response = await request.post(CATEGORY_URL, {
      data: { name: 'Unauthorized Category' },
    });
    expect(response.status()).toBe(401);
  });
});