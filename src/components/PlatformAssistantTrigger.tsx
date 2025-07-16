// src/components/PlatformAssistantTrigger.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { PlatformAssistantDialog } from './PlatformAssistantDialog';
import { AliciaLogoIcon } from './AliciaLogoIcon';

export function PlatformAssistantTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="lg"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-40 flex items-center justify-center p-0"
                    aria-label="Conversar con AlicIA"
                >
                    <AliciaLogoIcon className="h-10 w-10" />
                </Button>
            </DialogTrigger>
            <DialogContent
                className="w-[90vw] max-w-md p-0 flex flex-col z-50 h-[70vh] max-h-[700px]"
            >
                <DialogHeader className="p-4 border-b text-left">
                    <DialogTitle className="flex items-center gap-3">
                        <AliciaLogoIcon className="h-8 w-8 text-primary" />
                        <span className="font-headline text-2xl text-primary">AlicIA</span>
                    </DialogTitle>
                    <DialogDescription>
                        Tu asistente experta de la plataforma Alicia Libros.
                    </DialogDescription>
                </DialogHeader>
                <PlatformAssistantDialog />
            </DialogContent>
        </Dialog>
    );
}
