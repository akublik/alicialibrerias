// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}
