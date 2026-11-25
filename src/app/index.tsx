import { useEffect } from 'react';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function Index() {
  const { currentUser } = useApp();

  useEffect(() => {
    if (currentUser) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [currentUser]);

  return null;
}
