import type { Author } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface AuthorCardProps {
  author: Author;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const authorLink = author.slug ? `/authors/${author.slug}` : `/authors/${author.id}`;
  return (
    <Link href={authorLink}>
        <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl group flex flex-col h-full text-center">
        <CardHeader className="p-0">
            <div className="relative w-full aspect-square">
            <Image
                src={author.imageUrl}
                alt={`Foto de ${author.name}`}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={author.dataAiHint || 'author portrait'}
            />
            </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex items-center justify-center">
            <CardTitle className="font-headline text-xl text-primary group-hover:underline">
                {author.name}
            </CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Button variant="link" className="text-muted-foreground group-hover:text-primary mx-auto">
                Ver Perfil
                <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
        </CardFooter>
        </Card>
    </Link>
  );
}
