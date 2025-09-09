// src/components/AuthorAssistantChat.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, UserCircle, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAuthorAssistant } from '@/ai/flows/author-marketing-assistant';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AuthorAssistantChatProps {
  user: User | null;
}

export default function AuthorAssistantChat({ user }: AuthorAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      if (!user) throw new Error("User not found");

      const result = await chatWithAuthorAssistant({
        authorName: user.name,
        chatHistory: currentMessages,
      });
      
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error: any) {
      console.error('Error calling author assistant flow:', error);
      toast({
        title: 'Error del Asistente',
        description: error.message || 'Lo siento, no pude procesar tu solicitud.',
        variant: 'destructive',
      });
      setMessages(prev => prev.slice(0, prev.length -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
            <Bot className="mr-3 h-7 w-7 text-primary"/>
            Tu Asistente de Marketing
        </CardTitle>
        <CardDescription>
            Hazme preguntas sobre estrategias de lanzamiento, cómo mejorar tu sinopsis, ideas para redes sociales, o pide feedback sobre un título.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
         <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
             <div className="space-y-6">
                {messages.length === 0 && (
                    <div className={cn('flex max-w-[90%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted')}>
                        ¡Hola, {user?.name}! Soy tu asistente personal de marketing. Estoy aquí para ayudarte a que tu libro sea un éxito. ¿En qué trabajamos hoy?
                    </div>
                )}
                {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-start gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'model' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'p-3 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap shadow-sm',
                          message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                        )}
                      >
                        {message.content}
                      </div>
                      {message.role === 'user' && (
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                           <UserCircle className="w-5 h-5 text-muted-foreground" />
                         </div>
                      )}
                    </div>
                ))}
                {isLoading && (
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
      </CardContent>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pide un consejo, una idea o feedback..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
        </form>
      </div>
    </Card>
  );
}
