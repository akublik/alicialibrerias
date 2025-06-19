// src/app/page.tsx
import AppLayout from './(app)/layout';
import HomePage from './(app)/page'; // This is the component from src/app/(app)/page.tsx

export default function RootPage() {
  return (
    <AppLayout>
      <HomePage />
    </AppLayout>
  );
}
