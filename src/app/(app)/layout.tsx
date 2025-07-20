// src/app/(app)/layout.tsx
// This is now a Server Component, which allows child pages to export 'generateMetadata'.

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import AliciaAssistantWidget from '@/components/AliciaAssistantWidget';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout applies to all pages within the (app) group,
  // except for routes that have their own nested layout, like the reader page.
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <AliciaAssistantWidget />
    </div>
  );
}
