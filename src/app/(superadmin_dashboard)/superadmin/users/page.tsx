// src/app/(superadmin_dashboard)/superadmin/users/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Gift } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User, Order } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (userDataString) {
      setCurrentAdminId(JSON.parse(userDataString).id);
    }
  }, []);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    let loadedUsers = false;
    let loadedOrders = false;
    
    const checkLoadingDone = () => {
        if (loadedUsers && loadedOrders) {
            setIsLoading(false);
        }
    }

    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(allUsers);
      loadedUsers = true;
      checkLoadingDone();
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error al cargar usuarios", variant: "destructive" });
      setIsLoading(false);
    });

    const ordersUnsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const allOrders = snapshot.docs.map(doc => {
         const data = doc.data();
         return {
            id: doc.id,
            ...data,
            totalPrice: data.totalPrice || 0,
            buyerId: data.buyerId || '',
         } as Order;
      });
      setOrders(allOrders);
      loadedOrders = true;
      checkLoadingDone();
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast({ title: "Error al cargar pedidos", variant: "destructive" });
      setIsLoading(false);
    });


    return () => {
        usersUnsubscribe();
        ordersUnsubscribe();
    };
  }, [toast]);

  const userPoints = useMemo(() => {
    const pointsMap = new Map<string, number>();
    orders.forEach(order => {
      if (order.buyerId && order.totalPrice) {
        const points = Math.floor(order.totalPrice);
        const currentPoints = pointsMap.get(order.buyerId) || 0;
        pointsMap.set(order.buyerId, currentPoints + points);
      }
    });
    return pointsMap;
  }, [orders]);


  const handleStatusChange = async (user: User, newStatus: boolean) => {
    if (!db || !user.id || user.id === currentAdminId) return;

    setIsUpdating(user.id);
    const userRef = doc(db, "users", user.id);
    try {
      await updateDoc(userRef, { isActive: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `El usuario ${user.name} ha sido ${newStatus ? 'activado' : 'desactivado'}.`
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

  const getRoleBadgeVariant = (role: User['role']) => {
    if (role === 'superadmin') return 'destructive';
    if (role === 'library') return 'secondary';
    return 'outline';
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Users className="mr-3 h-8 w-8"/>
            Gestionar Usuarios
          </h1>
          <p className="text-lg text-foreground/80">
            Activa o desactiva el acceso de lectores y administradores de librerías.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>Mostrando {users.length} usuarios registrados en la plataforma.</CardDescription>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold text-primary">
                        <Gift className="h-4 w-4" />
                        {userPoints.get(user.id) || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isUpdating === user.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                    <span>
                                        <Switch
                                            checked={user.isActive !== false} // Active if undefined or true
                                            onCheckedChange={(newStatus) => handleStatusChange(user, newStatus)}
                                            disabled={user.id === currentAdminId || isUpdating === user.id}
                                            aria-label={`Activar o desactivar a ${user.name}`}
                                        />
                                    </span>
                                 </TooltipTrigger>
                                 {user.id === currentAdminId && <TooltipContent><p>No puedes desactivarte a ti mismo.</p></TooltipContent>}
                               </Tooltip>
                            </TooltipProvider>
                        )}
                        <span className="text-sm text-muted-foreground">{user.isActive !== false ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
