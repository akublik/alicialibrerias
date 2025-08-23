// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft, X, BookOpen, Volume2, Pause, Play, Download } from 'lucide-react';
import { ReactReader } from "react-reader";
import type { Rendition } from 'epubjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConverseWithBookTrigger } from '@/components/ConverseWithBookTrigger';

const availableVoices = ['Algenib', 'Achernar', 'Canopus', 'Sirius', 'Rigel', 'Procyon'];

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<Partial<DigitalBook> & { title: string; author: string, epubFileUrl: string } | null>(null);
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [location, setLocation] = useState<string | number>(0);
  const renditionRef = useRef<Rendition | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [isTocVisible, setIsTocVisible] = useState(false);

  // TTS State
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedVoice, setSelectedVoice] = useState('Algenib');
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookAndData = async () => {
      if (!bookId || !db) {
        setError("Error de configuración de la aplicación.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setEpubData(null);
      
      try {
        let bookData: Partial<DigitalBook> & { title: string; author: string, epubFileUrl: string } | null = null;
        
        let bookRef = doc(db, "digital_books", bookId);
        let docSnap = await getDoc(bookRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            bookData = {
                id: docSnap.id,
                title: data.title,
                author: data.author,
                epubFileUrl: data.epubFileUrl,
            };
        } else {
            bookRef = doc(db, "books", bookId);
            docSnap = await getDoc(bookRef);
            if(docSnap.exists()) {
                const data = docSnap.data();
                if (!data.epubFileUrl) {
                    throw new Error("Este libro no está disponible en un formato digital para leer.");
                }
                bookData = {
                    id: docSnap.id,
                    title: data.title,
                    author: Array.isArray(data.authors) ? data.authors.join(', ') : data.authors,
                    epubFileUrl: data.epubFileUrl,
                };
            } else {
                 throw new Error("Libro no encontrado en ninguna biblioteca.");
            }
        }
        
        if (!bookData || !bookData.epubFileUrl) {
          throw new Error("Este libro no tiene un archivo EPUB disponible para leer.");
        }

        setBook(bookData);
        
        const proxyUrl = `/api/proxy-epub?url=${encodeURIComponent(bookData.epubFileUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo cargar el archivo del libro (estado: ${response.status}). Detalles: ${errorText}`);
        }
        
        const data = await response.arrayBuffer();
        
        if (data.byteLength === 0) {
          throw new Error("El archivo del libro está vacío o no se pudo cargar correctamente.");
        }

        setEpubData(data);

      } catch (e: any) {
        console.error("Error al cargar el libro:", e);
        setError(`Error al cargar el libro: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookAndData();
  }, [bookId]);
  
  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed:", e);
            toast({
                title: "Error de reproducción",
                description: "El navegador bloqueó la reproducción automática. Por favor, haz clic de nuevo para reproducir.",
                variant: "destructive"
            });
            setIsPlaying(false);
        });
    }
  }, [audioUrl, toast]);

  const onTocLocationChanges = (href: string) => {
    if (renditionRef.current) {
        renditionRef.current.display(href);
        setIsTocVisible(false);
    }
  };
  
  const handleLocationChanged = (epubcfi: string) => {
    setLocation(epubcfi);
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handleTextToSpeech = async () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      return;
    }

    if (!renditionRef.current) return;
    
    setIsLoadingAudio(true);
    try {
      // @ts-ignore
      const contents = renditionRef.current.getContents();
      const text = contents.map((c: any) => c.document?.body?.textContent?.trim() || '').join('\n').trim();

      if (!text) {
        toast({
          title: "No hay texto para leer",
          description: "No se encontró texto en la página actual para leer en voz alta.",
          variant: "destructive",
        });
        setIsLoadingAudio(false);
        return;
      }

      const response = await textToSpeech({ text, voice: selectedVoice });
      setAudioUrl(response.media);
    } catch (error: any) {
      console.error("Error generating audio:", error);
      toast({
        title: "Error al generar audio",
        description: error.message || "No se pudo crear la narración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAudio(false);
    }
  };
  
  const getButtonContent = () => {
    if (isLoadingAudio) {
      return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</>;
    }
    if (audioUrl && isPlaying) {
      return <><Pause className="mr-2 h-4 w-4" />Pausar</>;
    }
    if (audioUrl && !isPlaying) {
      return <><Play className="mr-2 h-4 w-4" />Reproducir</>;
    }
    return <><Volume2 className="mr-2 h-4 w-4" />Leer en voz alta</>;
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-muted">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando libro...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Ocurrió un error</h1>
          <p className="text-muted-foreground max-w-lg whitespace-pre-wrap">{error}</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-6">
            Volver a Mi Panel
          </Button>
        </div>
      );
    }
  
    if (!epubData || epubData.byteLength === 0) {
      return (
          <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
              <h1 className="text-2xl font-bold text-destructive mb-2">Error de Datos</h1>
              <p className="text-muted-foreground max-w-lg">No se pudo cargar el contenido del libro. El archivo puede estar dañado o vacío.</p>
               <Button onClick={() => router.push('/dashboard')} className="mt-6">
                Volver a Mi Panel
              </Button>
          </div>
      );
    }
    
    return (
      <div className="flex flex-col h-screen w-screen bg-muted overflow-hidden">
        <header className="flex-shrink-0 bg-background shadow-md z-30">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href="/dashboard" passHref>
                      <Button variant="outline" size="sm">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Mi Panel
                      </Button>
                  </Link>
                   <Button variant="outline" size="sm" onClick={() => setIsTocVisible(!isTocVisible)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Índice
                  </Button>
                </div>
                <div className="text-center hidden sm:block mx-4 overflow-hidden">
                    <h1 className="font-headline text-xl font-bold text-primary truncate">{book?.title}</h1>
                    <p className="text-sm text-muted-foreground truncate">{book?.author}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-[120px] h-9 text-xs">
                        <SelectValue placeholder="Selecciona una voz" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map(voice => (
                          <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleTextToSpeech} disabled={isLoadingAudio}>
                      {getButtonContent()}
                    </Button>
                </div>
            </div>
        </header>
        
        <div className="flex-grow flex relative">
            <aside className={cn(
                "absolute sm:relative top-0 left-0 h-full bg-background z-20 transition-transform duration-300 ease-in-out w-72 border-r shadow-lg",
                isTocVisible ? "translate-x-0" : "-translate-x-full"
            )}>
                 <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-headline text-lg text-primary">Índice</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsTocVisible(false)}>
                        <X className="h-5 w-5"/>
                    </Button>
                 </div>
                 <ScrollArea className="h-[calc(100%-4.5rem)]">
                    <ul className="p-2">
                    {toc.map((item, index) => (
                        <li key={index}>
                            <button
                                onClick={() => onTocLocationChanges(item.href)}
                                className="block w-full text-left p-2 rounded-md hover:bg-muted text-sm text-foreground/80"
                            >
                                {item.label.trim()}
                            </button>
                        </li>
                    ))}
                    </ul>
                 </ScrollArea>
            </aside>

            <div className="flex-grow h-full relative" id="reader-wrapper">
                <ReactReader
                    key={book?.id}
                    url={epubData}
                    location={location}
                    locationChanged={handleLocationChanged}
                    getRendition={(rendition) => {
                        renditionRef.current = rendition;
                        // @ts-ignore
                        rendition.book.loaded.navigation.then(({ toc: bookToc }) => {
                            setToc(bookToc);
                        });
                    }}
                />
            </div>
        </div>
        
        <div 
            className="fixed left-0 top-16 h-[calc(100%-4rem)] w-1/4 z-10 cursor-pointer group"
            onClick={() => renditionRef.current?.prev()}
        >
            <ArrowLeft className="fixed left-4 top-1/2 -translate-y-1/2 h-16 w-16 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
        </div>
        <div 
            className="fixed right-0 top-16 h-[calc(100%-4rem)] w-1/4 z-10 cursor-pointer group"
            onClick={() => renditionRef.current?.next()}
        >
            <ArrowLeft className="fixed right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform rotate-180"/>
        </div>
        <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
        {book && <ConverseWithBookTrigger bookTitle={book.title} />}
      </div>
    );
  }

  return renderContent();
}
