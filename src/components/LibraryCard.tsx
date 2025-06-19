import type { Library } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';

interface LibraryCardProps {
  library: Library;
}

export function LibraryCard({ library }: LibraryCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl">
      {library.imageUrl && (
         <Link href={`/libraries/${library.id}`} aria-label={`Visitar ${library.name}`}>
          <Image
            src={library.imageUrl}
            alt={`Fachada de ${library.name}`}
            width={400}
            height={250}
            className="w-full h-48 object-cover"
            data-ai-hint={library.dataAiHint || 'bookstore front'}
          />
        </Link>
      )}
      <CardHeader>
        <Link href={`/libraries/${library.id}`}>
          <CardTitle className="font-headline text-xl hover:text-primary transition-colors">{library.name}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="mr-2 h-4 w-4" />
          {library.location}
        </div>
        {library.description && <p className="text-sm text-muted-foreground line-clamp-3">{library.description}</p>}
      </CardContent>
      <CardFooter>
        <Link href={`/libraries/${library.id}`} className="w-full">
          <Button variant="outline" className="w-full font-body">
            Visitar Librería
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
