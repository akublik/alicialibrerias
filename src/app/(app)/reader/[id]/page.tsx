// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { DigitalBook, Review } from '@/types';
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
  Plus,
  Star,
  ThumbsUp,
  Bot,
  Send,
  User,
  Tag,
  BookOpenCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReactReader, IReactReaderStyle } from "react-reader";
import type { Rendition } from 'epubjs';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { converseWithBook } from '@/ai/flows/converse-with-book';

// Define chat message type locally
type ChatMessage = {
  role: 'user' | 'model';
  content: { text: string }[];
};

const StarRating = ({ rating, interactive = false, setRating }: { rating: number, interactive?: boolean, setRating?: (r:number) => void }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 transition-colors ${
            star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
          } ${interactive ? "cursor-pointer hover:text-amber-300" : ""}`}
          onClick={() => interactive && setRating && setRating(star)}
        />
      ))}
    </div>
  );
};

export default function ReaderPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Reader state
  const renditionRef = useRef<Rendition | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [fontSize, setFontSize] = useState(100); // as a percentage

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', content: [{ text: '¡Hola! Soy AlicIA, tu asistente de lectura experta. ¿Qué te gustaría saber sobre este libro?' }] },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

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
          const bookData = { id: docSnap.id, ...docSnap.data() } as DigitalBook;
          setBook(bookData);

          // Fetch reviews by book title
          const reviewsRef = collection(db, "reviews");
          const q = query(reviewsRef, where("bookTitle", "==", bookData.title), limit(5));
          const reviewsSnapshot = await getDocs(q);
          const fetchedReviews = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Review));
          fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReviews(fetchedReviews);
          
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
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize]);

  useEffect(() => {
    if (renditionRef.current) {
        renditionRef.current.themes.select(theme);
    }
  }, [theme]);
  
  const goNext = () => renditionRef.current?.next();
  const goPrev = () => renditionRef.current?.prev();
  
  const changeFontSize = (newSize: number) => {
    const clampedSize = Math.max(80, Math.min(200, newSize)); // Clamp between 80% and 200%
    setFontSize(clampedSize);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || !book) return;

    const userMessage: ChatMessage = { role: 'user', content: [{ text: chatInput }] };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const responseText = await converseWithBook({
        bookTitle: book.title,
        history: [...chatMessages, userMessage],
      });

      const assistantMessage: ChatMessage = { role: 'model', content: [{ text: responseText }] };
      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage: ChatMessage = { role: 'model', content: [{ text: 'Tuve un problema al procesar tu pregunta. Inténtalo de nuevo.' }] };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatScrollAreaRef.current) {
        chatScrollAreaRef.current.scrollTo({
            top: chatScrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [chatMessages]);

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
        <p className="text-muted-foreground max-w-lg whitespace-pre-wrap">{error}</p>
        <Link href="/my-library" className="mt-6">
          <Button>Volver a la Biblioteca</Button>
        </Link>
      </div>
    );
  }

  if (!book) return null;

  if (!book.epubFilename) {
    return (
         <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
            <BookOpen className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">{book.title}</h1>
            <p className="text-muted-foreground mb-6">Este libro no está disponible en formato EPUB para el lector integrado.</p>
             {book.pdfFilename && (
                <a href={`/pdfs/${book.pdfFilename}`} target="_blank" rel="noopener noreferrer">
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

  const readerStyles: IReactReaderStyle = {
    readerArea: {
      position: 'relative',
      height: '100%',
      backgroundColor: theme === 'dark' ? '#212121' : (theme === 'sepia' ? '#f4f0e8' : '#fafafa'),
    },
    // Ensure the view has transparent background so readerArea color shows
    view: {
        background: 'transparent'
    },
    arrow: {
        color: theme === 'dark' ? 'white' : 'black'
    }
  };


  const hasInfoToDisplay = book.description || book.format || book.categories?.length || book.tags?.length || reviews.length > 0;

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
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsChatOpen(prev => !prev)}>
                <Bot className="mr-2 h-4 w-4" />
                Conversa con el libro
            </Button>
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

      <main className="flex-grow relative" style={{ height: 'calc(100vh - 104px)'}}>
           <ReactReader
              url={`/epubs/${book.epubFilename}`}
              location={location}
              locationChanged={(epubcfi: string) => {
                setLocation(epubcfi);
                if (renditionRef.current) {
                  const page = renditionRef.current.locations.locationFromCfi(epubcfi);
                  setCurrentPage(page);
                }
              }}
              getRendition={(_rendition) => {
                renditionRef.current = _rendition;
                _rendition.themes.register('light', { body: { 'color': '#212121', 'background-color': 'transparent' } });
                _rendition.themes.register('dark', { body: { 'color': '#fafafa', 'background-color': 'transparent' } });
                _rendition.themes.register('sepia', { body: { 'color': '#5b4636', 'background-color': 'transparent' } });
                _rendition.themes.select(theme);
                _rendition.themes.fontSize(`${fontSize}%`);
                _rendition.book.ready.then(() => {
                    setTotalPages(_rendition.book.locations.length());
                });
              }}
              readerStyles={readerStyles}
              loadingView={
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              }
            />
      </main>

       <footer className={cn(
        "flex-shrink-0 flex items-center justify-center gap-4 p-3 border-t shadow-sm",
        theme === 'light' && 'bg-background border-border',
        theme === 'dark' && 'bg-zinc-900 border-zinc-800',
        theme === 'sepia' && 'bg-[#e9e3d8] border-[#dcd3c5]'
       )}>
            <Button variant="ghost" onClick={goPrev} aria-label="Página anterior">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm text-muted-foreground tabular-nums">
                Página {currentPage} de {totalPages || '-'}
            </div>
            <Button variant="ghost" onClick={goNext} aria-label="Página siguiente">
              <ArrowRight className="h-5 w-5" />
            </Button>
      </footer>
      
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent className="w-[90vw] max-w-md p-0 flex flex-col" side="right">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Conversa con el libro</SheetTitle>
            <SheetDescription>Estás hablando con AlicIA, tu asistente de lectura experta.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow p-4" ref={chatScrollAreaRef}>
              <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                      <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                          {message.role === 'model' && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Bot className="w-5 h-5 text-primary" />
                              </div>
                          )}
                          <div className={cn("p-3 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                              {message.content.map(c => c.text).join('')}
                          </div>
                          {message.role === 'user' && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                          )}
                      </div>
                  ))}
                  {isChatLoading && (
                      <div className="flex items-start gap-3 justify-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-primary" />
                          </div>
                          <div className="p-3 rounded-lg bg-muted flex items-center">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                      </div>
                  )}
              </div>
          </ScrollArea>
          <div className="p-4 border-t">
              <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                  <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Pregúntale algo al libro..."
                      disabled={isChatLoading}
                      autoComplete="off"
                  />
                  <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                  </Button>
              </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
