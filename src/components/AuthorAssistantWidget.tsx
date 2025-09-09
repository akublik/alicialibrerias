// src/components/AuthorAssistantWidget.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Send, Bot, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAuthorAssistant } from '@/ai/flows/author-marketing-assistant';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

type Message = {
  role: 'user' | 'model';
  content: string;
};

interface AuthorAssistantWidgetProps {
  user: User | null;
}

export default function AuthorAssistantWidget({ user }: AuthorAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithAuthorAssistant({
        authorName: user.name,
        chatHistory: currentMessages,
      });
      
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error calling author assistant flow:', error);
       toast({
        title: 'Error del Asistente',
        description: 'Lo siento, he tenido un problema para procesar tu solicitud.',
        variant: 'destructive',
      });
       setMessages(currentMessages); // Revert to messages before the bot's attempt
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 p-0 overflow-hidden flex items-center justify-center transition-transform hover:scale-110 bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Abrir Asistente AlicIA"
        >
          {isOpen ? (
            <X className="h-8 w-8" />
          ) : (
            <span className="font-headline text-4xl">A</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 md:w-96 h-[60vh] p-0 flex flex-col mr-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <header className="p-4 border-b flex items-center gap-3 bg-primary/5">
            <div className="relative w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                 <span className="font-headline text-2xl">A</span>
            </div>
            <div>
                <p className="font-semibold text-primary">AlicIA</p>
                <p className="text-xs text-muted-foreground">Tu Asistente de Marketing</p>
            </div>
        </header>
        
        <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                    <div className={cn('flex max-w-[90%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted')}>
                       ¡Hola, {user?.name}! Soy AlicIA, tu coach personal de marketing y edición. Pídeme feedback sobre un título, ideas para redes sociales, o consejos para tu lanzamiento. ¿En qué trabajamos hoy?
                    </div>
                )}
                {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex max-w-[90%] flex-col gap-2 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                        message.role === 'user'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted'
                      )}
                    >
                      {message.content}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start space-x-2">
                        <div className="bg-muted rounded-lg px-3 py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
        
        <div className="p-2 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pide un consejo o idea..."
              disabled={isLoading || !user}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !user}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
