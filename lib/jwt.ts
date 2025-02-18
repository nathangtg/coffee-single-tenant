import jwt from 'jsonwebtoken';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export const signJWT = (user: User) => {
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyJWT = (token: string): (User | null) => {
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch (error) {
    console.log(error)
    return null;
  }
};
