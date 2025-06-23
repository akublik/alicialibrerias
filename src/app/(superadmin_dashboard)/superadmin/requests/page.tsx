// src/app/(superadmin_dashboard)/superadmin/requests/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MailQuestion, PackageOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { BookRequest } from "@/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusTranslations: Record<BookRequest['status'], string> = {
  pending: 'Pendiente',
  responded: 'Respondida',
};

export default function ManageBookRequestsPage() {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const requestsRef = collection(db, "bookRequests");
    const q = query(requestsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRequests = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        } as BookRequest
      });
      setRequests(allRequests);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching book requests:", error);
      toast({ title: "Error al cargar solicitudes", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleStatusChange = async (requestId: string, newStatus: BookRequest['status']) => {
    if (!db || !requestId) return;

    setIsUpdating(requestId);
    const requestRef = doc(db, "bookRequests", requestId);
    try {
      await updateDoc(requestRef, { status: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `La solicitud ha sido marcada como "${statusTranslations[newStatus]}".`
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };
  
  const statusOptions: BookRequest['status'][] = ['pending', 'responded'];
  
  const getStatusVariant = (status: BookRequest['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'responded': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
            <MailQuestion className="mr-3 h-8 w-8"/>
            Solicitudes de Libros
          </h1>
          <p className="text-lg text-foreground/80">
            Revisa las solicitudes de libros de los lectores.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bandeja de Solicitudes</CardTitle>
          <CardDescription>Mostrando {requests.length} solicitudes.</CardDescription>
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Lector</TableHead>
                  <TableHead>Título del Libro</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length > 0 ? requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.createdAt), 'dd/MM/yy', { locale: es })}</TableCell>
                    <TableCell>
                      <div>{req.userName}</div>
                      <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-medium">{req.bookTitle}</TableCell>
                    <TableCell>{req.bookAuthor}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={req.notes ?? undefined}>{req.notes}</TableCell>
                    <TableCell>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant={getStatusVariant(req.status)} size="sm" className="w-28 justify-center" disabled={isUpdating === req.id}>
                              {isUpdating === req.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                              {statusTranslations[req.status]}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {statusOptions.map(status => (
                              <DropdownMenuItem key={status} onSelect={() => handleStatusChange(req.id, status)}>
                                {statusTranslations[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <PackageOpen className="h-12 w-12" />
                          <h3 className="font-semibold">No hay solicitudes</h3>
                          <p>La bandeja de solicitudes está vacía.</p>
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
  );
}
