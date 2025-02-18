import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // You should set this in environment variables
const JWT_EXPIRATION = '1h'; // Token expiration time, can be adjusted

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
export const getAuthenticatedUser = (authorization: string | undefined): User | null => {
  if (!authorization) return null;

  const token = authorization.split(' ')[1]; // Assuming the token is in the format "Bearer <token>"
  return verifyToken(token);
};

