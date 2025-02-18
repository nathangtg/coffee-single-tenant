import { User } from '@/types/user';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Function to sign JWT token for the user
export const signJWT = async (user: User): Promise<string> => {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  })
    .setProtectedHeader({ alg: 'HS256' }) // Algorithm
    .setExpirationTime(JWT_EXPIRES_IN) // Expiration time
    .sign(secret); // Sign with the secret key

  return token;
};

function isUser(payload: unknown): payload is User {
  // Check if payload is an object
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  // Check if the payload has the required properties
  return (
    'id' in payload &&
    'email' in payload &&
    'firstName' in payload &&
    'lastName' in payload &&
    'role' in payload &&
    'createdAt' in payload
  );
}
export const verifyJWT = async (token: string): Promise<User | null> => {
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);

    if (isUser(payload)) {
      return payload;
    } else {
      console.log('Invalid payload structure');
      return null;
    }
  } catch (error) {
    console.log('Error verifying token:', error);
    return null;
  }
};