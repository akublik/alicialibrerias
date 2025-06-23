
// src/app/(superadmin_dashboard)/superadmin/libraries/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2, Store, MoreHorizontal, Eye, BarChart3, ShoppingCart, BookCopy, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Library, Book, Order, LibraryAnalytics } from "@/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageLibrariesPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allAnalytics, setAllAnalytics] = useState<LibraryAnalytics[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const collectionsToFetch = [
      { ref: collection(db, "libraries"), setter: setLibraries },
      { ref: collection(db, "books"), setter: setAllBooks },
      { ref: collection(db, "orders"), setter: setAllOrders },
      { ref: collection(db, "libraryAnalytics"), setter: setAllAnalytics },
    ];
    let loadedCount = 0;

    collectionsToFetch.forEach(({ ref, setter }) => {
        const unsubscribe = onSnapshot(ref, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(items as any);
            loadedCount++;
            if (loadedCount === collectionsToFetch.length) setIsLoading(false);
        }, (error) => {
            console.error(`Error fetching ${ref.path}:`, error);
            toast({ title: `Error al cargar ${ref.path}`, variant: "destructive" });
            setIsLoading(false);
        });
        unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [toast]);
  
  const libraryStats = useMemo(() => {
    if (!selectedLibrary) return null;

    const libraryBooks = allBooks.filter(b => b.libraryId === selectedLibrary.id);
    const libraryOrders = allOrders.filter(o => o.libraryId === selectedLibrary.id);
    const librarySales = libraryOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const libraryVisits = allAnalytics.find(a => a.id === selectedLibrary.id)?.visitCount || 0;

    return {
        bookCount: libraryBooks.length,
        orderCount: libraryOrders.length,
        totalSales: librarySales,
        visits: libraryVisits,
    };
  }, [selectedLibrary, allBooks, allOrders, allAnalytics]);


  const handleStatusChange = async (library: Library, newStatus: boolean) => {
    if (!db || !library.id) return;

    setIsUpdating(library.id);
    const libraryRef = doc(db, "libraries", library.id);
    try {
      await updateDoc(libraryRef, { isActive: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `La librería ${library.name} ha sido ${newStatus ? 'activada' : 'desactivada'}.`
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

  const handleOpenDetails = (library: Library) => {
    setSelectedLibrary(library);
    setIsDetailsOpen(true);
  };


  return (
    <>
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Store className="mr-3 h-8 w-8"/>
            Gestionar Librerías
          </h1>
          <p className="text-lg text-foreground/80">
            Activa o desactiva las librerías que forman parte de la plataforma.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Todas las Librerías</CardTitle>
          <CardDescription>Mostrando {libraries.length} librerías registradas.</CardDescription>
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
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Email de Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.map(library => (
                  <TableRow key={library.id}>
                    <TableCell>
                       <Image
                            alt={`Logo de ${library.name}`}
                            className="aspect-square rounded-md object-cover"
                            height="40"
                            src={library.imageUrl || 'https://placehold.co/40x40.png'}
                            width="40"
                          />
                    </TableCell>
                    <TableCell className="font-medium">{library.name}</TableCell>
                    <TableCell>{library.location}</TableCell>
                    <TableCell>{library.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isUpdating === library.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           <Switch
                                checked={library.isActive !== false} // Active if undefined or true
                                onCheckedChange={(newStatus) => handleStatusChange(library, newStatus)}
                                disabled={isUpdating === library.id}
                                aria-label={`Activar o desactivar ${library.name}`}
                            />
                        )}
                        <span className="text-sm text-muted-foreground">{library.isActive !== false ? 'Activa' : 'Inactiva'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenDetails(library)}>
                               <Eye className="mr-2 h-4 w-4" />
                               Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem asChild>
                                <Link href={`/libraries/${library.id}`} target="_blank">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Visitar Página
                                </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    
     <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
             <Image src={selectedLibrary?.imageUrl || 'https://placehold.co/40x40.png'} alt="logo" width={40} height={40} className="rounded-full" />
             Resumen de {selectedLibrary?.name}
          </DialogTitle>
          <DialogDescription>Estadísticas clave de la librería.</DialogDescription>
        </DialogHeader>
        {libraryStats && (
            <div className="grid grid-cols-2 gap-4 py-4">
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                   <BookCopy className="h-6 w-6 text-primary"/>
                   <div>
                       <p className="text-sm text-muted-foreground">Libros</p>
                       <p className="text-lg font-bold">{libraryStats.bookCount}</p>
                   </div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                   <ShoppingCart className="h-6 w-6 text-primary"/>
                   <div>
                       <p className="text-sm text-muted-foreground">Pedidos</p>
                       <p className="text-lg font-bold">{libraryStats.orderCount}</p>
                   </div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                   <BarChart3 className="h-6 w-6 text-primary"/>
                   <div>
                       <p className="text-sm text-muted-foreground">Ventas</p>
                       <p className="text-lg font-bold">${libraryStats.totalSales.toFixed(2)}</p>
                   </div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                   <Eye className="h-6 w-6 text-primary"/>
                   <div>
                       <p className="text-sm text-muted-foreground">Visitas</p>
                       <p className="text-lg font-bold">{libraryStats.visits}</p>
                   </div>
               </div>
            </div>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsDetailsOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
