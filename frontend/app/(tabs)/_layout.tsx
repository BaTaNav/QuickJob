import React, { useEffect } from 'react';
import { useRouter } from "expo-router";

export default function TabLayout() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, []);
  
  return null;
}
