

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
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl group flex flex-col h-full">
        <CardHeader className="p-0">
            {library.imageUrl && (
                <Link href={`/libraries/${library.id}`} className="block relative h-40 overflow-hidden bg-card flex justify-center items-center p-4">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-30" 
                      style={{ backgroundImage: `url('https://alicialectura.com/assets/images/patterns/pattern-1.png')` }}
                      data-ai-hint="subtle pattern"
                    ></div>
                    <Image
                        src={library.imageUrl}
                        alt={`Logo de ${library.name}`}
                        width={200}
                        height={100}
                        className="object-contain h-full w-auto transition-transform duration-300 group-hover:scale-105 relative z-10"
                        data-ai-hint={library.dataAiHint || 'library logo'}
                    />
                </Link>
            )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <Link href={`/libraries/${library.id}`}>
                <CardTitle className="font-headline text-xl hover:text-primary transition-colors line-clamp-2">{library.name}</CardTitle>
            </Link>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{library.location}</span>
            </div>
            {library.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{library.description}</p>}
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
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
