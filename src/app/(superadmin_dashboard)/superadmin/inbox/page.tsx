// src/app/(superadmin_dashboard)/superadmin/inbox/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox, Mail, MailOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification;
      });
      setNotifications(allNotifications);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error al cargar notificaciones", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleViewNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
        try {
            await updateDoc(doc(db, "notifications", notification.id), { isRead: true });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Inbox className="mr-3 h-8 w-8"/>
              Bandeja de Entrada
            </h1>
            <p className="text-lg text-foreground/80">
              Mensajes recibidos del formulario de contacto y otras notificaciones.
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Todos los Mensajes</CardTitle>
            <CardDescription>Mostrando {notifications.length} mensajes.</CardDescription>
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
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.length > 0 ? notifications.map(notif => (
                    <TableRow key={notif.id} className={!notif.isRead ? "font-bold" : ""}>
                      <TableCell>
                        {notif.isRead ? (
                            <MailOpen className="h-5 w-5 text-muted-foreground"/> 
                        ) : (
                            <Mail className="h-5 w-5 text-primary"/>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{notif.fromName}</div>
                        <div className="text-xs text-muted-foreground font-normal">{notif.fromEmail}</div>
                      </TableCell>
                      <TableCell>{notif.subject}</TableCell>
                      <TableCell>{format(new Date(notif.createdAt), 'dd MMM yyyy, p', { locale: es })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewNotification(notif)}>Ver Mensaje</Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="h-12 w-12" />
                            <h3 className="font-semibold">Bandeja de entrada vacía</h3>
                          </div>
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={!!selectedNotification} onOpenChange={(isOpen) => !isOpen && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.subject}</DialogTitle>
            <DialogDescription>
              De: {selectedNotification?.fromName} ({selectedNotification?.fromEmail})
              <br />
              Recibido: {selectedNotification && format(new Date(selectedNotification.createdAt), 'PPP p', { locale: es })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 whitespace-pre-wrap bg-muted p-4 rounded-md my-4 max-h-[50vh] overflow-y-auto">
            {selectedNotification?.message}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
