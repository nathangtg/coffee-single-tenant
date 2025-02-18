import jwt from 'jsonwebtoken';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Function to sign JWT token for the user
export const signJWT = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Function to verify the JWT token and return user object or null
export const verifyJWT = (token: string): User | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid token');
    } else {
      console.log('Error verifying token:', error);
    }
    return null;
  }
};

// Helper function to extract token from the Authorization header
export const extractTokenFromHeader = (authorization: string | undefined): string | null => {
  if (!authorization) return null;
  
  const token = authorization.split(' ')[1]; // Assuming it's in the format "Bearer <token>"
  return token || null;
};
