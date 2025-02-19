export const TEST_CONFIG = {
    BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    API_ROUTES: {
      AUTH: '/api/auth',
      CATEGORY: '/api/category',
      ITEM: '/api/item',
      ITEM_OPTION: '/api/itemOptions',
      CART: '/api/cart',
    },
    TEST_USER: {
      email: 'johndoe@example.com',
      password: 'SecurePassword123!',
    },
  };