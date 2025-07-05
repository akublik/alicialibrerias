// src/app/(auth)/register/page.tsx
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterForm />
    </Suspense>
  );
}
