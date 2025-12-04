import { useState, useEffect } from 'react';
import { getToken } from '../services/auth';

export default function useAuth() {
  const [token, setToken] = useState<string | null>(getToken());

  useEffect(() => {
    const onStorage = () => setToken(getToken());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { token, isAuthenticated: !!token };
}
