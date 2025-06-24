
import type { Book } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Star, Eye, Heart, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext'; // Added useCart
import { useToast } from "@/hooks/use-toast";

interface BookCardProps {
  book: Book;
  size?: 'normal' | 'small';
}

export function BookCard({ book, size = 'normal' }: BookCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const imageWidth = size === 'small' ? 140 : 200;
  const imageHeight = size === 'small' ? 210 : 300;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
  };
  
  const handleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
        title: "Función Próximamente",
        description: "Pronto podrás guardar tus libros favoritos.",
    });
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full group">
      <CardHeader className="p-0 relative">
        <Link href={`/books/${book.id}`} aria-label={`Ver detalles de ${book.title}`} className="block relative w-full aspect-[2/3] overflow-hidden">
          <Image
            src={book.imageUrl}
            alt={`Portada de ${book.title}`}
            layout="fill"
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

        {book.libraryName && (
          <div
            className={cn(
              "flex items-center text-muted-foreground mt-1",
              size === 'small' ? 'text-xs' : 'text-sm'
            )}
            title={book.libraryLocation}
          >
            <Store className={cn("mr-1.5", size === 'small' ? 'h-3 w-3' : 'h-4 w-4')} />
            <span className="truncate">{book.libraryName}</span>
          </div>
        )}
        
        <div className={cn(
            "flex items-center space-x-1 text-amber-500 mt-2",
            size === 'small' ? 'text-xs' : 'text-sm'
          )}
        >
          {[...Array(4)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                'fill-current', 
                size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
              )} 
            />
          ))}
           <Star key={5} className={cn('text-muted-foreground/50', size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />
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
          <Button size={size === 'small' ? 'icon' : 'sm'} className="font-body" aria-label="Añadir al carrito" onClick={handleAddToCart}>
            <ShoppingCart className={cn("h-4 w-4", size !== 'small' && "mr-1")} />
            {size !== 'small' && "Añadir"}
          </Button>
          <Button variant="ghost" size={size === 'small' ? 'icon' : 'sm'} aria-label="Marcar como favorito" onClick={handleFavorite}>
            <Heart className={cn("h-4 w-4")} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
