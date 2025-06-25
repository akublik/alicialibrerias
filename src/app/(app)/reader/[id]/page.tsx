
// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { 
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  FileText,
  Settings,
  Sun,
  Moon,
  Book,
  Minus,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Rendition } from 'epubjs';
import type BookType from 'epubjs/types/book';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

export default function ReaderPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Reader state
  const renditionRef = useRef<Rendition | null>(null);
  const bookInstanceRef = useRef<BookType | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [fontSize, setFontSize] = useState(100); // as a percentage
  const [location, setLocation] = useState<string | number>('-');
  const [totalPages, setTotalPages] = useState(0);


  useEffect(() => {
    if (!bookId || !db) {
      setIsLoading(false);
      setError("Error de configuración de la aplicación.");
      return;
    }

    const fetchBook = async () => {
      setIsLoading(true);
      try {
        const bookRef = doc(db, "digital_books", bookId);
        const docSnap = await getDoc(bookRef);
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() } as DigitalBook);
        } else {
          setError("Libro no encontrado en la biblioteca digital.");
        }
      } catch (e: any) {
        setError(`Error al cargar el libro: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  useEffect(() => {
    if (!book || !book.epubUrl || !viewerRef.current) {
        setIsRendering(false);
        return;
    }
    
    let isMounted = true;
    setIsRendering(true);
    
    // Clean up previous instance if any
    if (viewerRef.current.innerHTML) {
      bookInstanceRef.current?.destroy();
      viewerRef.current.innerHTML = '';
    }
    
    import('epubjs').then(({ default: ePub }) => {
        if (!isMounted || !viewerRef.current) return;

        const bookInstance = ePub(book.epubUrl!);
        bookInstanceRef.current = bookInstance;

        const rendition = bookInstance.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "auto",
        });
        renditionRef.current = rendition;

        rendition.themes.register('light', { body: { 'color': '#212121', 'background-color': '#fafafa' } });
        rendition.themes.register('dark', { body: { 'color': '#fafafa', 'background-color': '#212121' } });
        rendition.themes.register('sepia', { body: { 'color': '#5b4636', 'background-color': '#f4f0e8' } });
        
        rendition.themes.select(theme);
        rendition.themes.fontSize(`${fontSize}%`);
        
        rendition.on('displayed', () => {
            if (isMounted) {
                setIsRendering(false);

                // Generate locations in the background after displaying
                bookInstance.ready.then(() => bookInstance.locations.generate(1650))
                .then(locations => {
                    if (isMounted) {
                        setTotalPages(locations.length);
                        const currentLocation = renditionRef.current?.currentLocation();
                        if (currentLocation && currentLocation.start) {
                            const page = bookInstanceRef.current?.locations.locationFromCfi(currentLocation.start.cfi);
                            setLocation(page || 0);
                        }
                    }
                }).catch(err => console.warn("Could not generate book locations:", err));
            }
        });

        rendition.on('relocated', (locationData: any) => {
            if (isMounted && bookInstanceRef.current?.locations?.length > 0) {
                const page = bookInstanceRef.current.locations.locationFromCfi(locationData.start.cfi);
                setLocation(page || 0);
            }
        });

        rendition.display().catch((err: Error) => {
             if (isMounted) {
                console.error("Error displaying rendition:", err);
                setError(`Hubo un problema al mostrar el libro. Esto puede ser un problema de CORS si el libro está alojado en otro servidor. Error: ${err.message}.`);
                setIsRendering(false);
            }
        });

    }).catch(err => {
        console.error("Failed to load epubjs module", err);
        if(isMounted) {
            setError("No se pudo cargar el visor de libros.");
            setIsRendering(false);
        }
    });

    return () => {
      isMounted = false;
      bookInstanceRef.current?.destroy();
      renditionRef.current = null;
      bookInstanceRef.current = null;
    };
  }, [book, fontSize, theme]);

  const goNext = () => {
    if(isRendering || !renditionRef.current) return;
    renditionRef.current.next();
  }
  const goPrev = () => {
    if(isRendering || !renditionRef.current) return;
    renditionRef.current.prev();
  }
  
  const changeFontSize = (newSize: number) => {
    const clampedSize = Math.max(80, Math.min(200, newSize)); // Clamp between 80% and 200%
    setFontSize(clampedSize);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-muted">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Ocurrió un error</h1>
        <p className="text-muted-foreground max-w-lg">{error}</p>
        <Link href="/my-library" className="mt-6">
          <Button>Volver a la Biblioteca</Button>
        </Link>
      </div>
    );
  }

  if (!book) return null;

  if (!book.epubUrl) {
    return (
         <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
            <BookOpen className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">{book.title}</h1>
            <p className="text-muted-foreground mb-6">Este libro no está disponible en formato EPUB para el lector integrado.</p>
             {book.pdfUrl && (
                <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Abrir PDF
                    </Button>
                </a>
            )}
             <Link href="/my-library" className="mt-4">
                <Button variant="link">Volver a la Biblioteca</Button>
            </Link>
        </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col h-screen font-body transition-colors",
      theme === 'light' && 'bg-[#fafafa] text-[#212121]',
      theme === 'dark' && 'bg-[#212121] text-[#fafafa]',
      theme === 'sepia' && 'bg-[#f4f0e8] text-[#5b4636]'
    )}>
      <header className={cn(
        "flex-shrink-0 flex items-center justify-between p-3 border-b transition-colors",
        theme === 'light' && 'bg-background border-border',
        theme === 'dark' && 'bg-zinc-900 border-zinc-800',
        theme === 'sepia' && 'bg-[#e9e3d8] border-[#dcd3c5]'
        )}>
        <Link href="/my-library" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Biblioteca
          </Button>
        </Link>
        <div className="text-center truncate px-4">
            <h1 className="font-headline text-lg font-semibold text-primary truncate">{book.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{book.author}</p>
        </div>
        <div className="w-40 flex justify-end">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Ajustes
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium leading-none mb-2">Tema</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4"/>Claro</Button>
                                <Button variant={theme === 'sepia' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('sepia')}><Book className="mr-2 h-4 w-4"/>Sepia</Button>
                                <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4"/>Oscuro</Button>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-medium leading-none mb-2">Tamaño de Fuente</h4>
                            <div className="flex items-center gap-2">
                               <Button variant="outline" size="icon" onClick={() => changeFontSize(fontSize - 10)}><Minus className="h-4 w-4"/></Button>
                               <span className="text-sm font-medium w-12 text-center">{fontSize}%</span>
                               <Button variant="outline" size="icon" onClick={() => changeFontSize(fontSize + 10)}><Plus className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
      </header>

      <main className="flex-grow relative">
         <div id="viewer" ref={viewerRef} className="w-full h-full" />
         {isRendering && (
            <div className="absolute inset-0 bg-background/80 flex justify-center items-center z-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
         )}
         <Button variant="ghost" onClick={goPrev} disabled={isRendering} className="absolute left-0 top-0 h-full w-1/5 max-w-[100px] text-muted-foreground/5 opacity-0 hover:opacity-100 transition-opacity z-20" aria-label="Página anterior">
            <ArrowLeft className="h-8 w-8" />
         </Button>
         <Button variant="ghost" onClick={goNext} disabled={isRendering} className="absolute right-0 top-0 h-full w-1/5 max-w-[100px] text-muted-foreground/5 opacity-0 hover:opacity-100 transition-opacity z-20" aria-label="Página siguiente">
            <ArrowRight className="h-8 w-8" />
        </Button>
      </main>

       <footer className={cn(
        "flex-shrink-0 flex items-center justify-center gap-4 p-3 border-t shadow-sm",
        theme === 'light' && 'bg-background border-border',
        theme === 'dark' && 'bg-zinc-900 border-zinc-800',
        theme === 'sepia' && 'bg-[#e9e3d8] border-[#dcd3c5]'
       )}>
            <Button variant="ghost" onClick={goPrev} disabled={isRendering} aria-label="Página anterior">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm text-muted-foreground tabular-nums">
                Página {isRendering ? '-' : location} de {isRendering ? '-' : (totalPages > 0 ? totalPages : '-')}
            </div>
            <Button variant="ghost" onClick={goNext} disabled={isRendering} aria-label="Página siguiente">
              <ArrowRight className="h-5 w-5" />
            </Button>
      </footer>
    </div>
  );
}
