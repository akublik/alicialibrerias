'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Send, MessageSquare, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAliciaAssistant, type ChatWithAliciaAssistantInput } from '@/ai/flows/alicia-assistant-chat';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function AliciaAssistantWidget() {
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
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const flowInput: ChatWithAliciaAssistantInput = {
        chatHistory: [...messages, userMessage],
      };
      
      const result = await chatWithAliciaAssistant(flowInput);
      
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error calling sales assistant flow:', error);
       toast({
        title: 'Error del Asistente',
        description: 'Lo siento, he tenido un problema para procesar tu solicitud.',
        variant: 'destructive',
      });
       setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderMessageContent = (content: string) => {
    // Regex to find markdown links like [texto a mostrar](/ruta-o-url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = content.split(linkRegex);

    return parts.map((part, index) => {
        // The first part of the triplet is the text of the link
        if (index % 3 === 1) { 
            const url = parts[index + 1]; // The second part is the URL
            return (
                <Link key={index} href={url} className="font-bold underline text-primary hover:opacity-80" onClick={() => setIsOpen(false)}>
                    {part}
                </Link>
            );
        }
        // The second part is the URL itself, which we don't want to render directly
        if (index % 3 === 2) {
            return null;
        }
        // The first and any subsequent non-matching parts are just plain text
        return part;
    });
};

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 p-0 flex items-center justify-center transition-transform hover:scale-110"
          aria-label="Abrir chat de ayuda"
        >
          {isOpen ? (
            <X className="h-8 w-8" />
          ) : (
            <MessageSquare className="h-8 w-8" />
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
            <div className="relative w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                 <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="font-semibold text-primary">AlicIA</p>
                <p className="text-xs text-muted-foreground">Tu Asistente Virtual</p>
            </div>
        </header>
        
        <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                    <div className={cn('flex max-w-[90%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted')}>
                       ¡Hola! Soy AlicIA, tu asistente virtual experta en libros. Estoy aquí para resolver tus dudas sobre la plataforma. ¿En qué puedo ayudarte?
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
                      {renderMessageContent(message.content)}
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
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
