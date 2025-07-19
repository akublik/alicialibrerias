import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function AuthLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4 relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <BookOpen className="h-8 w-8" />
          <span className="font-headline text-2xl font-bold">Alicia Libros - Portal Librerías</span>
        </Link>
      </div>
      <main className="w-full max-w-lg flex-grow flex items-center justify-center">
        {children}
      </main>
      <footer className="w-full text-center py-4 text-sm text-muted-foreground shrink-0">
         &copy; {new Date().getFullYear()} Alicia Libros. Todos los derechos reservados.
      </footer>
    </div>
  );
}
