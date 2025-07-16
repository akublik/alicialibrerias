// src/components/PlatformAssistantTrigger.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PlatformAssistantDialog } from './PlatformAssistantDialog';
import { AliciaLogoIcon } from './AliciaLogoIcon';

export function PlatformAssistantTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    size="lg"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-40 flex items-center justify-center p-0"
                    aria-label="Conversar con AlicIA"
                >
                    <AliciaLogoIcon className="h-10 w-10" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-[90vw] max-w-md p-0 flex flex-col z-50"
            >
                <SheetHeader className="p-4 border-b text-left">
                    <SheetTitle className="flex items-center gap-3">
                        <AliciaLogoIcon className="h-8 w-8 text-primary" />
                        <span className="font-headline text-2xl text-primary">AlicIA</span>
                    </SheetTitle>
                    <SheetDescription>
                        Tu asistente experta de la plataforma Alicia Libros.
                    </SheetDescription>
                </SheetHeader>
                <PlatformAssistantDialog />
            </SheetContent>
        </Sheet>
    );
}
