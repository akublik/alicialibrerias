// src/app/(auth)/layout.tsx
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <BookOpen className="h-8 w-8" />
          <span className="font-headline text-2xl font-bold">Alicia Libros</span>
        </Link>
      </div>
      <main className="w-full max-w-md">{children}</main>
       <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
         &copy; 2024 Alicia Libros. Todos los derechos reservados. {/* Using a static year */}
      </footer>
    </div>
  );
}
