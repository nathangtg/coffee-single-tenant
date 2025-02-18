import { AuthProvider } from '@/context/AuthContext';
import { AuthTest } from './components/AuthTest';

export default function Home() {
  return (
    <AuthProvider>
      <AuthTest />
    </AuthProvider>
  );
}
