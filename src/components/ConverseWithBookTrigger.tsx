// src/components/ConverseWithBookTrigger.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Wand2 } from 'lucide-react';
import { ConverseWithBookDialog } from './ConverseWithBookDialog';
import { AliciaLogoIcon } from './AliciaLogoIcon';

interface ConverseWithBookTriggerProps {
    bookTitle: string;
}

export function ConverseWithBookTrigger({ bookTitle }: ConverseWithBookTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    size="lg"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-[100] flex items-center justify-center p-0"
                    aria-label="Conversar con el libro"
                >
                    <AliciaLogoIcon className="h-10 w-10" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-[90vw] max-w-md p-0 flex flex-col z-[101]" // Ensure it's on top
                onInteractOutside={(e) => e.preventDefault()}
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center">
                        <Wand2 className="h-6 w-6 text-primary mr-3" />
                        <span className="font-headline text-xl text-primary">Conversar sobre el Libro</span>
                    </SheetTitle>
                </SheetHeader>
                <ConverseWithBookDialog bookTitle={bookTitle} />
            </SheetContent>
        </Sheet>
    );
}