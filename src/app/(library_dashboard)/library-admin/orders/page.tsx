// src/app/(library_dashboard)/library-admin/orders/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ShoppingCart, Loader2, PackageOpen, ArrowLeft, FilterX } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types";
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusTranslations: Record<Order['status'], string> = {
  pending: 'Pendiente',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function LibraryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookIdFilter = searchParams.get('bookId');
  const bookTitleFilter = searchParams.get('bookTitle');

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      setIsLoading(false);
      console.warn("User data not found in localStorage.");
      return;
    }
    const userData = JSON.parse(userDataString);
    const libraryId = userData.libraryId;
    if (!libraryId) {
      setIsLoading(false);
      console.warn("Library ID not found for the current user.");
      return;
    }

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("libraryId", "==", libraryId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const libraryOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        libraryOrders.push({ 
          id: doc.id,
          ...data,
          // Ensure createdAt is a serializable object, not a Firestore Timestamp
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
         } as Order);
      });
      // Sort orders on the client-side
      libraryOrders.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
      setOrders(libraryOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching orders: ", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!bookIdFilter) return orders;
    return orders.filter(order => order.items.some(item => item.bookId === bookIdFilter));
  }, [orders, bookIdFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!db) return;
    setIsUpdatingStatus(orderId);
    const orderRef = doc(db, "orders", orderId);
    try {
      // Award points if the new status is 'delivered' and the previous status was not
      const order = orders.find(o => o.id === orderId);
      if (newStatus === 'delivered' && order && order.status !== 'delivered') {
        if (order.buyerId) {
            // Calculate points from subtotal of items
            const pointsToAward = Math.floor(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0));
            
            if (pointsToAward > 0) {
              const userRef = doc(db, "users", order.buyerId);
              await updateDoc(userRef, {
                loyaltyPoints: increment(pointsToAward)
              });
              toast({
                title: "¡Puntos Asignados!",
                description: `Se han añadido ${pointsToAward} puntos de lealtad al cliente.`,
              });
            }
        }
      }
      
      // Update order status
      await updateDoc(orderRef, { status: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `El estado del pedido se ha cambiado a "${statusTranslations[newStatus]}".`,
      });
    } catch (error: any) {
       toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const statusOptions: Order['status'][] = ['pending', 'shipped', 'delivered', 'cancelled'];
  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'shipped': return 'default';
      case 'delivered': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      {bookIdFilter ? (
        <div className="flex items-center mb-8">
            <Button variant="outline" size="icon" className="mr-4" onClick={() => router.push('/library-admin/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="font-headline text-3xl font-bold text-primary flex items-center">
                    <ShoppingCart className="mr-3 h-8 w-8"/>
                    Pedidos del Libro
                </h1>
                <p className="text-lg text-foreground/80">
                    Mostrando pedidos que incluyen: <strong>{bookTitleFilter || 'Libro específico'}</strong>
                </p>
            </div>
            <Button variant="ghost" className="ml-auto" onClick={() => router.push('/library-admin/orders')}>
              <FilterX className="mr-2 h-4 w-4"/> Limpiar filtro
            </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <ShoppingCart className="mr-3 h-8 w-8"/>
              Historial de Pedidos
            </h1>
            <p className="text-lg text-foreground/80">
              Gestiona todos los pedidos de tu librería.
            </p>
          </div>
        </div>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Todos los Pedidos</CardTitle>
          <CardDescription>
            Mostrando {filteredOrders.length} de {orders.length} pedidos totales.
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
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Libros</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                    <TableCell>
                      <div>{order.buyerName}</div>
                      <div className="text-xs text-muted-foreground">{order.buyerEmail}</div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="font-medium truncate" title={order.items.map(item => `${item.title} (x${item.quantity})`).join(', ')}>
                        {order.items.map(item => `${item.title} (x${item.quantity})`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt as string), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant={getStatusVariant(order.status)} size="sm" className="capitalize w-28" disabled={isUpdatingStatus === order.id}>
                              {isUpdatingStatus === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                              {statusTranslations[order.status]}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {statusOptions.map(status => (
                              <DropdownMenuItem key={status} onSelect={() => handleUpdateStatus(order.id, status)} className="capitalize">
                                {statusTranslations[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                       <div className="flex flex-col items-center gap-2">
                        <PackageOpen className="h-12 w-12" />
                        <h3 className="font-semibold">No se encontraron pedidos</h3>
                        <p>{bookIdFilter ? "Ningún pedido encontrado para este libro." : "Aún no tienes ningún pedido."}</p>
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
