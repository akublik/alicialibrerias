// src/components/LiteratureBot.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  user: 'user' | 'bot';
  timestamp: any;
}

const LiteratureBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
        toast({ title: "Error de Conexión", description: "No se pudo conectar a la base de datos para el chat.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    const q = query(collection(db, 'literature_messages'), orderBy('timestamp'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages: ", error);
        toast({ title: "Error al cargar mensajes", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);


  const generateBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('cervantes')) {
      return 'Miguel de Cervantes Saavedra fue un novelista, poeta y dramaturgo español, conocido principalmente por su obra maestra "Don Quijote de la Mancha".';
    } else if (lowerInput.includes('kafka')) {
      return 'Franz Kafka fue un escritor checo. Sus obras, llenas de existencialismo y absurdo, exploran la alienación y la burocracia. "La metamorfosis" es una de sus obras más famosas.';
    } else if (lowerInput.includes('literatura griega')) {
      return 'La literatura de la Antigua Grecia es fundamental en la cultura occidental. Destacan las epopeyas de Homero, "La Ilíada" y "La Odisea", así como las tragedias de Sófocles y Eurípides.';
    } else if (lowerInput.includes('shakespeare')) {
      return 'William Shakespeare fue un dramaturgo, poeta y actor inglés, considerado el escritor más importante en lengua inglesa. Entre sus obras más conocidas están "Hamlet", "Romeo y Julieta" y "Macbeth".';
    } else if (lowerInput.includes('gabriel garcía márquez') || lowerInput.includes('gabo')) {
      return 'Gabriel García Márquez, el famoso "Gabo", fue un escritor y periodista colombiano. Es conocido por ser el máximo exponente del realismo mágico, y su novela "Cien años de soledad" es una de las obras más importantes de la literatura universal.';
    } else {
      return 'Disculpa, no puedo ayudarte con esa consulta. Como experto en literatura universal, puedo hablar sobre autores, obras, movimientos literarios o géneros.';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    if (!db) return;

    const userInput = input;
    const botResponseText = generateBotResponse(userInput);
    setInput('');

    try {
      await addDoc(collection(db, 'literature_messages'), {
        text: userInput,
        user: 'user',
        timestamp: serverTimestamp(),
      });

      await addDoc(collection(db, 'literature_messages'), {
        text: botResponseText,
        user: 'bot',
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error al escribir el documento: ", error);
      toast({ title: "Error", description: "No se pudo enviar tu mensaje.", variant: "destructive" });
    }
  };

  return (
    <Card className="h-[70vh] w-full flex flex-col shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span>Asistente Literario</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
             <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
                ) : (
                    messages.map((msg) => (
                         <div key={msg.id} className={cn("flex items-start gap-3", msg.user === 'user' ? 'justify-end' : 'justify-start')}>
                           {msg.user === 'bot' && (
                               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                   <Bot className="w-5 h-5 text-primary" />
                               </div>
                           )}
                           <div className={cn(
                               "p-3 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap shadow-sm",
                               msg.user === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                           )}>
                               <p>{msg.text}</p>
                           </div>
                           {msg.user === 'user' && (
                               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                   <User className="w-5 h-5 text-muted-foreground" />
                               </div>
                           )}
                        </div>
                    ))
                )}
             </div>
          </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={sendMessage} className="flex w-full items-center space-x-2">
            <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre literatura universal..."
            className="flex-1"
            />
            <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
            </Button>
      </form>
      </CardFooter>
    </Card>
  );
};

export default LiteratureBot;
