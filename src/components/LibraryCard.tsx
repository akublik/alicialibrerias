
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
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        {library.imageUrl && (
          <Link href={`/libraries/${library.id}`} aria-label={`Visitar ${library.name}`} className="flex-shrink-0">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-md border-2 border-primary/20">
              <Image
                src={library.imageUrl}
                alt={`Logo de ${library.name}`}
                layout="fill"
                objectFit="cover"
                data-ai-hint={library.dataAiHint || 'library logo'}
              />
            </div>
          </Link>
        )}
        <div className="flex-grow">
          <Link href={`/libraries/${library.id}`}>
            <CardTitle className="font-headline text-xl hover:text-primary transition-colors line-clamp-2">{library.name}</CardTitle>
          </Link>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{library.location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        {library.description && <p className="text-sm text-muted-foreground line-clamp-3">{library.description}</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0">
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
