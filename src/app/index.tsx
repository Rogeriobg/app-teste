import { useEffect } from 'react';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function Index() {
  const { currentUser, authReady } = useApp();

  useEffect(() => {
    // espera o storage carregar para não piscar o login em quem já está
    // autenticado — e para não entrar no dashboard com sessão antiga
    if (!authReady) return;
    router.replace(currentUser ? '/dashboard' : '/login');
  }, [currentUser, authReady]);

  return null;
}
