import type { Book } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Star } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <Link href={`/books/${book.id}`} aria-label={`Ver detalles de ${book.title}`}>
          <Image
            src={book.imageUrl}
            alt={`Portada de ${book.title}`}
            width={300}
            height={450}
            className="w-full h-auto aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={book.dataAiHint || 'book cover'}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/books/${book.id}`}>
          <CardTitle className="font-headline text-lg leading-tight mb-1 hover:text-primary transition-colors">
            {book.title}
          </CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mb-2">{book.authors.join(', ')}</p>
        {book.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{book.description}</p>}
        <div className="flex items-center space-x-1 text-sm text-amber-500 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-current' : ''}`} />
          ))}
          <span className="text-muted-foreground text-xs">(123 reseñas)</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <p className="text-xl font-semibold text-primary">${book.price.toFixed(2)}</p>
        <Button size="sm" className="w-full sm:w-auto font-body">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </CardFooter>
    </Card>
  );
}
