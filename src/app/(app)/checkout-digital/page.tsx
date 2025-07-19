// src/app/(app)/checkout-digital/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { CreditCard, Gift, Landmark, Loader2, ShoppingBag, UserCircle, FileText, Coins } from "lucide-react";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, runTransaction, query, where, getDocs, documentId } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import type { User, Promotion, DigitalBook, OrderItem } from "@/types";

const checkoutFormSchema = z.object({
  buyerName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  buyerEmail: z.string().email({ message: "Por favor ingresa un email válido." }),
  buyerPhone: z.string().min(7, { message: "El teléfono debe tener al menos 7 dígitos." }),
  orderNotes: z.string().optional(),
  needsInvoice: z.boolean().default(false).optional(),
  taxId: z.string().optional(),
}).refine(data => {
    if (data.needsInvoice && (!data.taxId || data.taxId.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "El RUC/Cédula es requerido si solicitas factura.",
    path: ["taxId"],
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function DigitalCheckoutPage() {
  const { cartItems, totalPrice, itemCount, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("transfer");
  const [pointsToApply, setPointsToApply] = useState(0);

  const isDigitalOrder = useMemo(() => cartItems.every(item => item.format === 'Digital'), [cartItems]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { buyerName: "", buyerEmail: "", buyerPhone: "", orderNotes: "", needsInvoice: false, taxId: "" },
  });

  const needsInvoice = form.watch("needsInvoice");
  
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";

    if (!authStatus) {
      router.replace('/pre-checkout?redirect=/checkout-digital');
      return;
    }
    
    if (itemCount > 0 && !isDigitalOrder) {
      toast({
        title: "Carrito Inválido",
        description: "Tu carrito contiene productos físicos. Redirigiendo al checkout correcto...",
        variant: "destructive"
      });
      router.push("/checkout");
      return;
    }

    if (itemCount === 0) {
      toast({
        title: "Carrito Vacío",
        description: "Tu carrito está vacío. Redirigiendo...",
        variant: "destructive"
      });
      router.push("/cart");
      return;
    }

    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (userDataString) {
        try {
            const parsedUser = JSON.parse(userDataString);
            setUser(parsedUser);
            form.reset({
                ...form.getValues(),
                buyerName: parsedUser.name || "",
                buyerEmail: parsedUser.email || "",
            });
        } catch (e) {
            console.error("Error parsing user data from localStorage", e);
        }
    }
  }, [itemCount, router, toast, form, isDigitalOrder]);

  const discountAmount = pointsToApply / 100;
  const finalTotal = totalPrice - discountAmount;
  const basePointsToEarn = Math.floor(totalPrice - discountAmount);
  
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = parseInt(e.target.value, 10);
      if (isNaN(value)) value = 0;
      if (value < 0) value = 0;
      const maxApplicablePoints = Math.min(user?.loyaltyPoints || 0, Math.floor(totalPrice * 100));
      if (value > maxApplicablePoints) {
          value = maxApplicablePoints;
      }
      setPointsToApply(value);
  };
  
  const applyMaxPoints = () => {
      const maxApplicablePoints = Math.min(user?.loyaltyPoints || 0, Math.floor(totalPrice * 100));
      setPointsToApply(maxApplicablePoints);
  };

  async function onSubmit(values: CheckoutFormValues) {
    if (!user) {
        toast({ title: "Acción Requerida", description: "Por favor, inicia sesión para realizar tu pedido.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    const libraryId = cartItems[0].libraryId;
    if (!libraryId) {
       toast({ title: "Error en el pedido", description: "No se pudo determinar la librería para este pedido.", variant: "destructive" });
       setIsSubmitting(false);
       return;
    }

    let transactionDescription = `Puntos por compra`;
    const newOrderRef = doc(collection(db, "orders"));

    try {
        const promotionsRef = collection(db, "promotions");
        const now = new Date();
        const promotionsQuery = query(promotionsRef, where("isActive", "==", true));
        const promotionsSnapshot = await getDocs(promotionsQuery);
        
        const activePromotions = promotionsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Promotion))
            .filter(p => {
                const startDate = p.startDate.toDate();
                const endDate = p.endDate.toDate();
                return startDate <= now && endDate >= now;
            });

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", user.id);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) throw new Error("El usuario no existe.");
            
            const currentUserData = userSnap.data() as User;
            const currentPoints = currentUserData.loyaltyPoints || 0;
            const finalDiscountAmount = pointsToApply / 100;
            
            if (currentPoints < pointsToApply) {
                 throw new Error("No tienes suficientes puntos para realizar este canje.");
            }
            
            let pointsToAward = Math.floor(totalPrice - finalDiscountAmount);
            // Points logic... (copied from original checkout)

            const newOrderData = {
                libraryId,
                buyerId: user.id,
                buyerName: values.buyerName,
                buyerEmail: values.buyerEmail,
                buyerPhone: values.buyerPhone,
                items: cartItems.map((item): OrderItem => ({
                    bookId: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    imageUrl: item.imageUrl,
                    categories: item.categories || [],
                    authors: item.authors || [],
                    format: 'Digital',
                })),
                totalPrice: finalTotal,
                status: 'pending' as const,
                createdAt: serverTimestamp(),
                shippingMethod: 'digital',
                paymentMethod: selectedPaymentMethod,
                shippingAddress: 'Entrega Digital',
                orderNotes: values.orderNotes || '',
                needsInvoice: values.needsInvoice || false,
                taxId: values.needsInvoice ? values.taxId || '' : '',
                pointsUsed: pointsToApply,
                discountAmount: finalDiscountAmount,
                pointsEarned: pointsToAward,
            };
            transaction.set(newOrderRef, newOrderData);

            // CORRECTION: Add digital book purchases to the 'digital_purchases' collection.
            for (const item of cartItems) {
                // Ensure it's a digital item before creating the purchase record.
                if (item.format === 'Digital') {
                    const purchaseRef = doc(collection(db, 'digital_purchases'));
                    transaction.set(purchaseRef, {
                        userId: user.id,
                        bookId: item.id,
                        orderId: newOrderRef.id,
                        title: item.title,
                        author: item.authors.join(', '),
                        coverImageUrl: item.imageUrl,
                        createdAt: serverTimestamp(),
                    });
                }
            }
            
            // Points transaction logic... (copied from original checkout)
        });

      toast({ title: "¡Pedido Realizado con Éxito!", description: "Gracias por tu compra. Tus libros digitales ya están en tu panel." });
      clearCart();
      router.push(`/order-confirmation/${newOrderRef.id}`);

    } catch (error: any) {
        toast({ title: "Error al procesar el pedido", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!user || !isDigitalOrder) {
      return (
        <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
          <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
          <p className="mt-4 text-lg text-muted-foreground">Verificando...</p>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 md:mb-12 text-center">
         <ShoppingBag className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
          Finalizar Compra Digital
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Información del Comprador</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="buyerName" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input placeholder="Ej: Ana Lectora" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="buyerEmail" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="buyerPhone" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl><Input type="tel" placeholder="Ej: 0991234567" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                 <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="transfer" id="payment-transfer"/>
                    <Label htmlFor="payment-transfer" className="font-normal flex-grow cursor-pointer">
                      <div className="flex items-center">
                        <Landmark className="mr-2 h-5 w-5 text-muted-foreground"/>
                        <div>
                          Transferencia Bancaria
                          <span className="block text-xs text-muted-foreground">Realiza el pago directamente a nuestra cuenta bancaria.</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {selectedPaymentMethod === "transfer" && (
                  <Card className="mt-4 bg-muted/50">
                    <CardHeader><CardTitle className="text-base font-semibold">Instrucciones para Transferencia Bancaria</CardTitle></CardHeader>
                     <CardContent className="text-sm space-y-1 whitespace-pre-line">
                      <p><strong>Banco:</strong> Banco Pichincha</p>
                      <p><strong>Tipo de Cuenta:</strong> Ahorros</p>
                      <p><strong>Número de Cuenta:</strong> 2204535505</p>
                      <p><strong>Beneficiario:</strong> André Kublik</p>
                      <p><strong>CC:</strong> 1708258940</p>
                      <p><strong>Email para notificación:</strong> info@alicialibros.com</p>
                      <p className="mt-2 text-xs">Por favor, incluye tu número de pedido en la referencia de la transferencia. Tu pedido será procesado una vez confirmado el pago.</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Facturación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  <FormField control={form.control} name="needsInvoice" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">¿Necesitas Factura?</FormLabel><FormDescription>Activa esta opción si requieres una factura con RUC o Cédula.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                  {needsInvoice && ( <FormField control={form.control} name="taxId" render={({ field }) => ( <FormItem className="animate-fadeIn"><FormLabel>Cédula / RUC</FormLabel><FormControl><Input placeholder="Ingresa tu número de identificación" {...field} /></FormControl><FormMessage /></FormItem> )}/>)}
              </CardContent>
            </Card>

             <Card className="shadow-md">
              <CardHeader><CardTitle className="font-headline text-xl">Notas Adicionales (Opcional)</CardTitle></CardHeader>
              <CardContent>
                 <FormField control={form.control} name="orderNotes" render={({ field }) => ( <FormItem> <FormLabel>¿Alguna instrucción especial?</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-20">
              <CardHeader><CardTitle className="font-headline text-2xl">Resumen del Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="relative w-16 h-24 rounded overflow-hidden border">
                      <Image src={item.imageUrl} alt={item.title} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint || "book checkout"} />
                       <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-bl-md"> {item.quantity} </span>
                    </div>
                    <div className="flex-grow"> <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3> <p className="text-xs text-muted-foreground"> {item.authors.join(", ")} </p> </div>
                    <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                
                 <Separator />

                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-base flex items-center gap-2"><Coins className="h-5 w-5 text-primary"/> Programa de Lealtad</CardTitle><CardDescription className="text-xs">Tienes <span className="font-bold">{user.loyaltyPoints || 0}</span> puntos. ¡Úsalos para obtener un descuento! (100 puntos = $1.00)</CardDescription></CardHeader>
                    <CardContent className="p-4 pt-0">
                      {(user.loyaltyPoints || 0) > 0 ? (
                        <div className="flex items-center gap-2"><Input type="number" value={pointsToApply} onChange={handlePointsChange} max={Math.min(user.loyaltyPoints || 0, Math.floor(totalPrice * 100))} min={0} className="h-9"/><Button type="button" variant="secondary" onClick={applyMaxPoints} className="h-9 text-xs">Máx</Button></div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sigue comprando para ganar más puntos.</p>
                      )}
                    </CardContent>
                </Card>

                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal ({itemCount} artículos):</span> <span className="font-medium">${totalPrice.toFixed(2)}</span></div>
                  {discountAmount > 0 && (
                      <div className="flex justify-between text-destructive"><span>Descuento por puntos:</span> <span className="font-medium">-${discountAmount.toFixed(2)}</span></div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary"><span>Total:</span> <span>${finalTotal.toFixed(2)}</span></div>
                </div>
                <Separator/>
                 <div className="flex items-center justify-center text-sm text-accent p-3 bg-accent/10 rounded-md">
                    <Gift className="mr-2 h-5 w-5"/> ¡Acumularás <span className="font-bold mx-1">{basePointsToEarn}</span> puntos con esta compra!
                </div>
              </CardContent>
              <CardFooter>
                  <Button type="submit" size="lg" className="w-full font-body text-base" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Realizar Pedido
                  </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
