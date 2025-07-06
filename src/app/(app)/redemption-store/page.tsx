// src/app/(app)/redemption-store/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Gift, AlertTriangle, Coins, CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { RedemptionItem, User } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

export default function RedemptionStorePage() {
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [itemToRedeem, setItemToRedeem] = useState<RedemptionItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (userDataString) {
      setUser(JSON.parse(userDataString));
    } else {
      router.push('/login?redirect=/redemption-store');
    }
  }, [router]);
  
  useEffect(() => {
    if (!db) {
        setIsLoading(false);
        return;
    }
    const itemsQuery = query(collection(db, "redemptionItems"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
        const activeItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedemptionItem));
        setItems(activeItems);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching redemption items:", error);
        toast({ title: "Error al cargar la tienda", variant: "destructive" });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleRedeem = async () => {
    if (!itemToRedeem || !user || !db) return;

    setIsRedeeming(true);
    try {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", user.id);
            const itemRef = doc(db, "redemptionItems", itemToRedeem.id);
            const pointsRef = collection(db, "pointsTransactions");

            const userDoc = await transaction.get(userRef);
            const itemDoc = await transaction.get(itemRef);

            if (!userDoc.exists() || !itemDoc.exists()) {
                throw new Error("El usuario o el artículo ya no existen.");
            }

            const currentUserData = userDoc.data() as User;
            const currentItemData = itemDoc.data() as RedemptionItem;
            
            if ((currentUserData.loyaltyPoints || 0) < currentItemData.pointsRequired) {
                throw new Error("No tienes suficientes puntos.");
            }
            if (currentItemData.stock <= 0) {
                throw new Error("Este artículo está agotado.");
            }

            const newPoints = (currentUserData.loyaltyPoints || 0) - currentItemData.pointsRequired;
            const newStock = currentItemData.stock - 1;

            transaction.update(userRef, { loyaltyPoints: newPoints });
            transaction.update(itemRef, { stock: newStock });
            
            const pointsTransactionData = {
                userId: user.id,
                description: `Canje por: ${itemToRedeem.name}`,
                points: -itemToRedeem.pointsRequired,
                createdAt: serverTimestamp(),
            };
            transaction.set(doc(pointsRef), pointsTransactionData);
        });
        
        // Update local user state
        setUser(prevUser => prevUser ? { ...prevUser, loyaltyPoints: (prevUser.loyaltyPoints || 0) - itemToRedeem.pointsRequired } : null);

        toast({
            title: "¡Canje Exitoso!",
            description: `Has canjeado "${itemToRedeem.name}". Revisa tu panel de compras o email para más detalles.`,
        });

    } catch (error: any) {
        toast({ title: "Error en el canje", description: error.message, variant: "destructive" });
    } finally {
        setIsRedeeming(false);
        setItemToRedeem(null);
    }
  };


  return (
    <>
      <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
        <header className="mb-12 text-center">
          <Gift className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
            Tienda de Canje
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Usa tus puntos de lealtad para obtener recompensas exclusivas. ¡Gracias por ser parte de nuestra comunidad!
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold px-4 py-2 rounded-full">
                <Coins className="h-5 w-5"/>
                <span>Tus Puntos: {user.loyaltyPoints || 0}</span>
            </div>
          )}
        </header>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const canAfford = (user?.loyaltyPoints || 0) >= item.pointsRequired;
              const isOutOfStock = item.stock <= 0;
              return (
                <Card key={item.id} className="overflow-hidden flex flex-col group">
                  <CardHeader className="p-0 relative">
                    <div className="aspect-video relative">
                      <Image
                        src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={item.dataAiHint || 'product image'}
                      />
                       {isOutOfStock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Badge variant="destructive" className="text-lg">Agotado</Badge></div>}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="font-headline text-xl text-primary mb-2">{item.name}</CardTitle>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 mt-auto bg-muted/50 flex-col items-start space-y-2">
                    <div className="font-bold text-lg text-primary flex items-center gap-2">
                        <Coins className="h-5 w-5"/> {item.pointsRequired} Puntos
                    </div>
                    <Button 
                      className="w-full font-body"
                      disabled={!canAfford || isOutOfStock}
                      onClick={() => setItemToRedeem(item)}
                    >
                      {isOutOfStock ? 'Agotado' : (canAfford ? 'Canjear Ahora' : 'Puntos Insuficientes')}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Gift className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-headline text-2xl font-semibold text-foreground">Tienda Vacía por Ahora</h3>
            <p className="text-muted-foreground mt-2">
              Estamos preparando nuevas y emocionantes recompensas. ¡Vuelve pronto!
            </p>
          </div>
        )}
      </div>
      
      <AlertDialog open={!!itemToRedeem} onOpenChange={(open) => !open && setItemToRedeem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Canje</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de canjear <strong>{itemToRedeem?.pointsRequired} puntos</strong> por <strong>"{itemToRedeem?.name}"</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
           <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedeeming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedeem} disabled={isRedeeming}>
              {isRedeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
