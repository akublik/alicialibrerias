// src/app/(library_dashboard)/library-admin/events/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, CalendarDays, Loader2, Edit, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { LibraryEvent } from "@/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LibraryEventsPage() {
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [eventToAction, setEventToAction] = useState<LibraryEvent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      setIsLoading(false);
      return;
    }
    
    const userData = JSON.parse(userDataString);
    const libraryId = userData.libraryId;
    
    if (!libraryId) {
      setIsLoading(false);
      return;
    }

    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("libraryId", "==", libraryId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const libraryEvents: LibraryEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        libraryEvents.push({ 
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as LibraryEvent);
      });
      libraryEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(libraryEvents);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleDeleteEvent = async () => {
    if (!eventToAction || !db) return;
    setIsActionLoading(true);
    const eventRef = doc(db, "events", eventToAction.id);
    try {
      await deleteDoc(eventRef);
      toast({
        title: "Evento Eliminado",
        description: `El evento "${eventToAction.title}" ha sido eliminado.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setIsDeleteDialogOpen(false);
      setEventToAction(null);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
         <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <CalendarDays className="mr-3 h-8 w-8"/>
              Eventos de la Librería
            </h1>
            <p className="text-lg text-foreground/80">
              Crea y gestiona los eventos y actividades de tu librería.
            </p>
          </div>
          <Link href="/library-admin/events/new">
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Evento
              </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Mis Eventos</CardTitle>
            <CardDescription>
              Mostrando {events.length} eventos.
            </CardDescription>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden w-[100px] sm:table-cell">Imagen</TableHead>
                      <TableHead>Título del Evento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead><span className="sr-only">Acciones</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length > 0 ? events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={`Imagen de ${event.title}`}
                            className="aspect-video rounded-md object-cover"
                            height="64"
                            src={event.imageUrl}
                            width="100"
                            data-ai-hint={event.dataAiHint || 'event image'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{format(new Date(event.date), "PPP 'a las' p", { locale: es })}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isActionLoading && eventToAction?.id === event.id}>
                                {isActionLoading && eventToAction?.id === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/library-admin/events/edit/${event.id}`}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                  setEventToAction(event);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                       <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                              Aún no has creado ningún evento.
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el evento "{eventToAction?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isActionLoading}
            >
              {isActionLoading && eventToAction?.id === eventToAction?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, eliminar evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
