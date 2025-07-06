// src/app/(superadmin_dashboard)/superadmin/promotions/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, BadgePercent, Loader2, Edit, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Promotion } from "@/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ManagePromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotionToAction, setPromotionToAction] = useState<Promotion | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const promotionsRef = collection(db, "promotions");
    const q = query(promotionsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promotionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate(),
      } as Promotion));
      setPromotions(promotionsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching promotions:", error);
      toast({ title: "Error al cargar promociones", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDeletePromotion = async () => {
    if (!promotionToAction || !db) return;
    try {
      await deleteDoc(doc(db, "promotions", promotionToAction.id));
      toast({ title: "Promoción Eliminada", description: `La promoción "${promotionToAction.name}" ha sido eliminada.`, variant: 'destructive' });
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setPromotionToAction(null);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <BadgePercent className="mr-3 h-8 w-8"/>
              Gestionar Promociones
            </h1>
            <p className="text-lg text-foreground/80">
              Crea, edita o elimina promociones para el programa de puntos.
            </p>
          </div>
          <Link href="/superadmin/promotions/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Promoción
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Promociones Activas e Inactivas</CardTitle>
            <CardDescription>Mostrando {promotions.length} promociones.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.length > 0 ? promotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.name}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="secondary">
                          {promo.type === 'multiplier' ? `Multiplicador (x${promo.value})` : `Bono (+${promo.value} pts)`}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{promo.targetType === 'global' ? 'Global' : `${promo.targetType}: ${promo.targetValue}`}</TableCell>
                      <TableCell>
                        {format(new Date(promo.startDate), "dd/MM/yy", { locale: es })} - {format(new Date(promo.endDate), "dd/MM/yy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.isActive ? "default" : "outline"}>{promo.isActive ? 'Activa' : 'Inactiva'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild><Link href={`/superadmin/promotions/edit/${promo.id}`}><Edit className="mr-2 h-4 w-4" /> Editar</Link></DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { setPromotionToAction(promo); setIsDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Aún no has creado ninguna promoción.</TableCell>
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
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la promoción "{promotionToAction?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPromotionToAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePromotion} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
