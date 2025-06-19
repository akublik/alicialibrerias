// src/components/layout/Footer.tsx
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-headline text-2xl font-bold text-primary">Alicia Lee</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Conectando lectores con librerías independientes en Ecuador y Latinoamérica.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-lg font-semibold text-foreground mb-3">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/libraries" className="text-muted-foreground hover:text-primary transition-colors">Librerías</Link></li>
              <li><Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">Comunidad</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline text-lg font-semibold text-foreground mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Alicia Lee. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
