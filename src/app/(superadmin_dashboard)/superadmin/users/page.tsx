
// src/app/(superadmin_dashboard)/superadmin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Gift, MoreHorizontal, Edit, AlertCircle, PlusCircle, MinusCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp, addDoc, query, orderBy, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User, PointsTransaction } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(allUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error al cargar usuarios", variant: "destructive" });
      setIsLoading(false);
    });

    return () => usersUnsubscribe();
  }, [toast]);
  
  useEffect(() => {
    if (!selectedUser || !db) return;

    setIsLoadingHistory(true);
    // Removed orderBy from the query to prevent needing a composite index. Sorting is now done on the client.
    const q = query(collection(db, "pointsTransactions"), where("userId", "==", selectedUser.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data(), 
        createdAt: doc.data().createdAt?.toDate() || new Date() 
      } as PointsTransaction));
      
      // Sort the history by date on the client side
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setPointsHistory(history);
      setIsLoadingHistory(false);
    }, (error) => {
      console.error("Error fetching points history:", error);
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [selectedUser]);


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
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };
  
  const handlePointAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedUser) return;
      
      const formData = new FormData(event.currentTarget);
      const amount = parseInt(formData.get('amount') as string, 10);
      const reason = formData.get('reason') as string;

      if (isNaN(amount) || amount === 0) {
          toast({ title: "Cantidad inválida", description: "Por favor, introduce un número de puntos válido.", variant: "destructive" });
          return;
      }
      if (!reason.trim()) {
          toast({ title: "Falta un motivo", description: "Por favor, escribe un motivo para el ajuste de puntos.", variant: "destructive" });
          return;
      }

      try {
          await runTransaction(db, async (transaction) => {
              const userRef = doc(db, "users", selectedUser.id);
              const userDoc = await transaction.get(userRef);
              if (!userDoc.exists()) throw new Error("El usuario no existe.");
              
              const currentPoints = userDoc.data().loyaltyPoints || 0;
              const newPoints = currentPoints + amount;
              
              transaction.update(userRef, { loyaltyPoints: newPoints });

              transaction.set(doc(collection(db, "pointsTransactions")), {
                  userId: selectedUser.id,
                  description: `Ajuste manual: ${reason}`,
                  points: amount,
                  createdAt: serverTimestamp()
              });
          });
          toast({ title: "Puntos Ajustados", description: `Se han ${amount > 0 ? 'añadido' : 'restado'} ${Math.abs(amount)} puntos a ${selectedUser.name}.` });
          event.currentTarget.reset();
          // Close dialog on success
          setIsPointsDialogOpen(false); 

      } catch (error: any) {
          toast({ title: "Error en el ajuste", description: error.message || "No se pudo completar la transacción.", variant: "destructive" });
      }
  };

  const getRoleBadgeVariant = (role: User['role']) => {
    if (role === 'superadmin') return 'destructive';
    if (role === 'library') return 'secondary';
    return 'outline';
  }

  return (
    <>
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
                  <TableHead className="text-right">Acciones</TableHead>
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
                        {user.loyaltyPoints || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isUpdating === user.id ? ( <Loader2 className="h-4 w-4 animate-spin" /> ) : (
                            <TooltipProvider><Tooltip>
                                <TooltipTrigger asChild><span>
                                    <Switch
                                        checked={user.isActive !== false}
                                        onCheckedChange={(newStatus) => handleStatusChange(user, newStatus)}
                                        disabled={user.id === currentAdminId || isUpdating === user.id}
                                        aria-label={`Activar o desactivar a ${user.name}`}
                                    />
                                </span></TooltipTrigger>
                                {user.id === currentAdminId && <TooltipContent><p>No puedes desactivarte a ti mismo.</p></TooltipContent>}
                            </Tooltip></TooltipProvider>
                        )}
                        <span className="text-sm text-muted-foreground">{user.isActive !== false ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setSelectedUser(user); setIsPointsDialogOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" /> Gestionar Puntos
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

    <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gestionar Puntos de {selectedUser?.name}</DialogTitle>
          <DialogDescription>Añade o resta puntos manualmente y revisa el historial de transacciones.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
              <Card>
                <CardHeader><CardTitle>Ajuste Manual de Puntos</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handlePointAdjustment} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <p>Saldo actual: <strong className="text-primary">{selectedUser?.loyaltyPoints || 0}</strong></p>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="amount">Cantidad de Puntos</Label>
                           <Input id="amount" name="amount" type="number" placeholder="Ej: 50 (positivo) o -50 (negativo)" required />
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="reason">Motivo del Ajuste</Label>
                           <Textarea id="reason" name="reason" placeholder="Ej: Bono por fidelidad, corrección de error, etc." required />
                        </div>
                        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4"/>Ajustar Puntos</Button>
                    </form>
                </CardContent>
              </Card>
            </div>
            <div>
                <Card>
                    <CardHeader><CardTitle>Historial de Puntos</CardTitle></CardHeader>
                    <CardContent className="h-[300px] overflow-y-auto">
                        {isLoadingHistory ? <div className="flex justify-center items-center h-full"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></div> : (
                           <Table>
                                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Puntos</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {pointsHistory.length > 0 ? pointsHistory.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-xs">{format(t.createdAt, 'dd/MM/yy', { locale: es })}</TableCell>
                                            <TableCell className="text-xs">{t.description}</TableCell>
                                            <TableCell className={`text-right font-semibold text-xs ${t.points > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                                {t.points > 0 ? `+${t.points}` : t.points}
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="text-center py-4">No hay historial.</TableCell></TableRow>}
                                </TableBody>
                           </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPointsDialogOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
