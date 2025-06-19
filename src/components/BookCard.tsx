import type { Book } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  size?: 'normal' | 'small';
}

export function BookCard({ book, size = 'normal' }: BookCardProps) {
  const imageWidth = size === 'small' ? 160 : 300;
  const imageHeight = size === 'small' ? 240 : 450;

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <Link href={`/books/${book.id}`} aria-label={`Ver detalles de ${book.title}`}>
          <Image
            src={book.imageUrl}
            alt={`Portada de ${book.title}`}
            width={imageWidth}
            height={imageHeight}
            className="w-full h-auto aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={book.dataAiHint || 'book cover'}
          />
        </Link>
      </CardHeader>
      <CardContent className={cn("flex-grow", size === 'small' ? 'p-3' : 'p-4')}>
        <Link href={`/books/${book.id}`}>
          <CardTitle 
            className={cn(
              "font-headline leading-tight mb-1 hover:text-primary transition-colors",
              size === 'small' ? 'text-base' : 'text-lg'
            )}
          >
            {book.title}
          </CardTitle>
        </Link>
        <p 
          className={cn(
            "text-muted-foreground mb-2",
            size === 'small' ? 'text-xs' : 'text-sm'
          )}
        >
          {book.authors.join(', ')}
        </p>
        {book.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{book.description}</p>}
        <div className="flex items-center space-x-1 text-sm text-amber-500 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-current' : ''}`} />
          ))}
          <span className="text-muted-foreground text-xs">(123 reseñas)</span>
        </div>
      </CardContent>
      <CardFooter 
        className={cn(
          "flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2",
          size === 'small' ? 'p-3 pt-0' : 'p-4 pt-0'
        )}
      >
        <p 
          className={cn(
            "font-semibold text-primary",
            size === 'small' ? 'text-lg' : 'text-xl'
          )}
        >
          ${book.price.toFixed(2)}
        </p>
        <Button size="sm" className="w-full sm:w-auto font-body">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </CardFooter>
    </Card>
  );
}
