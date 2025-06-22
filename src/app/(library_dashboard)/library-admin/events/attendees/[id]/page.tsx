// src/app/(library_dashboard)/library-admin/events/attendees/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Loader2, CalendarDays } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import type { LibraryEvent, EventRegistration } from "@/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EventAttendeesPage() {
  const [event, setEvent] = useState<LibraryEvent | null>(null);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const eventId = params.id as string;

  useEffect(() => {
    if (!eventId || !db) {
      setIsLoading(false);
      return;
    }

    const fetchEventAndAttendees = async () => {
      setIsLoading(true);
      try {
        // Fetch event details
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          setEvent({
              id: eventSnap.id,
              ...eventData,
              date: eventData.date?.toDate ? eventData.date.toDate().toISOString() : eventData.date,
          } as LibraryEvent);
        }

        // Fetch attendees
        const attendeesRef = collection(db, "eventRegistrations");
        const q = query(attendeesRef, where("eventId", "==", eventId), orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        const attendeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration));
        setAttendees(attendeesList);

      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventAndAttendees();
  }, [eventId]);

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/library-admin/events" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Eventos">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          {isLoading ? (
             <h1 className="font-headline text-3xl font-bold text-primary">Cargando Asistentes...</h1>
          ) : (
            <>
                <h1 className="font-headline text-3xl font-bold text-primary flex items-center">
                    <Users className="mr-3 h-8 w-8"/>
                    Asistentes Registrados
                </h1>
                 <p className="text-lg text-foreground/80">
                    Para el evento: <strong>{event?.title}</strong>
                </p>
            </>
          )}
        </div>
      </div>
      
      <Card className="shadow-lg">
          <CardHeader>
            {event && (
                <CardDescription className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4"/> {format(new Date(event.date), "PPP 'a las' p", { locale: es })}
                </CardDescription>
            )}
            <CardTitle>Lista de Asistentes ({attendees.length})</CardTitle>
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
                      <TableHead>Nombre</TableHead>
                      <TableHead>WhatsApp</TableHead>
                       <TableHead>Fecha de Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.length > 0 ? attendees.map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell className="font-medium">{attendee.name}</TableCell>
                        <TableCell>{attendee.whatsapp}</TableCell>
                        <TableCell>{attendee.createdAt?.toDate ? format(attendee.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                      </TableRow>
                    )) : (
                       <TableRow>
                          <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                              Nadie se ha registrado para este evento todavía.
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
    </div>
  );
}
