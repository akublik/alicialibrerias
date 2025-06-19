
import type { Book } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Star, Eye, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  size?: 'normal' | 'small';
}

export function BookCard({ book, size = 'normal' }: BookCardProps) {
  const imageWidth = size === 'small' ? 140 : 200;
  const imageHeight = size === 'small' ? 210 : 300;

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full">
      <CardHeader className="p-0 relative flex justify-center"> {/* Added flex justify-center */}
        <Link href={`/books/${book.id}`} aria-label={`Ver detalles de ${book.title}`}>
          <Image
            src={book.imageUrl}
            alt={`Portada de ${book.title}`}
            width={imageWidth}
            height={imageHeight}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
        {book.description && (
          <p className={cn(
              "text-muted-foreground",
              size === 'small' ? "text-xs line-clamp-1 mb-1" : "text-sm line-clamp-2 mb-2"
            )}
          >
            {book.description}
          </p>
        )}
        <div className={cn(
            "flex items-center space-x-1 text-amber-500 mb-2",
            size === 'small' ? 'text-xs' : 'text-sm'
          )}
        >
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                i < 4 ? 'fill-current' : '', 
                size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
              )} 
            />
          ))}
          <span className={cn("text-muted-foreground", size === 'small' ? 'text-xs' : 'text-xs')}>(123 reseñas)</span>
        </div>
      </CardContent>
      <CardFooter
        className={cn(
          "flex items-center justify-between",
          size === 'small' ? 'p-3 pt-2' : 'p-4 pt-2'
        )}
      >
        <p
          className={cn(
            "font-semibold text-primary",
            size === 'small' ? 'text-base' : 'text-lg'
          )}
        >
          ${book.price.toFixed(2)}
        </p>
        <div className="flex items-center space-x-1">
          <Link href={`/books/${book.id}`} passHref>
            <Button asChild variant="ghost" size={size === 'small' ? 'icon' : 'sm'} aria-label="Ver libro">
              <span>
                <Eye className={cn("h-4 w-4", size !== 'small' && "mr-1")} />
                {size !== 'small' && "Ver"}
              </span>
            </Button>
          </Link>
          <Button size={size === 'small' ? 'icon' : 'sm'} className="font-body" aria-label="Añadir al carrito">
            <ShoppingCart className={cn("h-4 w-4", size !== 'small' && "mr-1")} />
            {size !== 'small' && "Añadir"}
          </Button>
          <Button variant="ghost" size={size === 'small' ? 'icon' : 'sm'} aria-label="Marcar como favorito">
            <Heart className={cn("h-4 w-4", size !== 'small' && "mr-1")} />
            {size !== 'small' && "Favorito"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
