import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@/types/user';
import { NextRequest } from 'next/server';
import { request } from '@playwright/test';
import { TEST_CONFIG } from '@/test.config';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 
const JWT_EXPIRATION = '1h';

// Function to hash the password (for storing in the database)
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Function to compare a plain password with a hashed password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Function to generate a JWT token for the user
export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Function to verify the JWT token and decode its payload
export const verifyToken = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Function to get the authenticated user from a request (assuming the token is sent in Authorization header)
export const getAuthenticatedUser = (req: NextRequest): User | null => {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) return null;
    
    try {
      const token = authHeader.split(' ')[1]; // Assuming the format is "Bearer <token>"
      if (!token) return null;
      
      const decoded = jwt.verify(token, JWT_SECRET) as User;
      return decoded;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  };

export const requireAdmin = (req: NextRequest): { user: User | null; error?: { message: string, status: number } } => {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      return {
        user: null,
        error: {
          message: 'Unauthorized: Authentication required',
          status: 401
        }
      };
    }
    
    if (user.role !== 'ADMIN') {
      return {
        user,
        error: {
          message: 'Forbidden: Admin access required',
          status: 403
        }
      };
    }
    
    return { user };
  };
  
// Helper function to check if user is admin
export const isAdmin = (req: NextRequest): boolean => {
  const user = getAuthenticatedUser(req);
  return user?.role === 'ADMIN';
};

export const setupAuthHeaders = (token: string) => {
  if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          if (init === undefined) {
              init = {};
          }
          if (init.headers === undefined) {
              init.headers = {};
          }
          
          // Add authorization header to all requests except login
          if (!input.toString().includes('/api/auth/login')) {
              (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          }

          return originalFetch(input, init);
      };
  }
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!getAuthToken();
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
  }
};

export async function signIn() {
  const context = await request.newContext();
  const response = await context.post(`${TEST_CONFIG.BASE_URL}${TEST_CONFIG.API_ROUTES.AUTH}/login`, {
    data: TEST_CONFIG.TEST_USER,
  });
  
  if (response.status() !== 200) {
    throw new Error('Authentication failed');
  }
  
  const responseBody = await response.json();
  return responseBody.token;
}

export function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
