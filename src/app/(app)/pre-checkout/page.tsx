// src/app/(app)/pre-checkout/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PreCheckoutClientPage from './client-page';

function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}

export default function PreCheckoutPage() {
    return (
        <Suspense fallback={<Loading />}>
            <PreCheckoutClientPage />
        </Suspense>
    )
}
