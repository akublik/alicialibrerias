// src/components/PlatformAssistantDialog.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { chatWithPlatformAssistant, type ChatWithPlatformAssistantInput } from '@/ai/flows/platform-assistant';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AliciaLogoIcon } from './AliciaLogoIcon';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function PlatformAssistantDialog() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            content: `¡Hola! Soy AlicIA, tu asistente virtual. Estoy aquí para ayudarte a entender cómo funciona Alicia Libros. ¿En qué puedo ayudarte?`
        }
    ]);
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            const flowInput: ChatWithPlatformAssistantInput = {
                chatHistory: currentMessages,
            };
            
            const result = await chatWithPlatformAssistant(flowInput);
            
            const modelMessage: Message = { role: 'model', content: result.response };
            setMessages((prev) => [...prev, modelMessage]);

        } catch (error) {
            console.error('Error calling platform assistant flow:', error);
            toast({
                title: 'Error del Asistente',
                description: 'Lo siento, he tenido un problema para procesar tu solicitud.',
                variant: 'destructive',
            });
            // Remove the user message if the call fails
            setMessages(prev => prev.slice(0, prev.length -1));
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = (content: string) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = content.split(linkRegex);

        return parts.map((part, index) => {
            if (index % 3 === 1) { 
                const url = parts[index + 1];
                return (
                    <Link key={index} href={url} className="text-primary underline hover:opacity-80" target={url.startsWith('http') ? '_blank' : '_self'}>
                        {part}
                    </Link>
                );
            }
            if (index % 3 === 2) {
                return null;
            }
            return part;
        });
    };

    return (
        <>
            <header className="p-4 border-b flex items-center gap-3 bg-primary/5">
                <div className="relative w-10 h-10">
                    <AliciaLogoIcon className="w-full h-full text-primary" />
                </div>
                <div>
                    <p className="font-semibold text-primary">AlicIA</p>
                    <p className="text-xs text-muted-foreground">Tu Asistente Virtual</p>
                </div>
            </header>
            <ScrollArea className="flex-grow p-4">
                <div className="space-y-4">
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
                        {renderContent(message.content)}
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
        </>
    );
}
