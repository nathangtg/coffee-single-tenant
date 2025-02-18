'use client';

import { useAuth } from '@/context/AuthContext';
import React from 'react';

export const AuthTest: React.FC = () => {
  const { user, loading, login, logout } = useAuth();

  return (
    <div>
      <h1>Auth Context Test</h1>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <>
          <p>Logged in as: {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button
            onClick={async () => {
              const success = await login('test@example.com', 'password123');
              if (!success) alert('Login failed');
            }}
          >
            Login
          </button>
        </>
      )}
    </div>
  );
}
