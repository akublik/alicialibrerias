
// src/app/(app)/checkout/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CreditCard, Gift, Truck, Building, Home, Phone, Mail, User, Landmark, Loader2, ShoppingBag, Store, PackageSearch } from "lucide-react";
import { Label } from "@/components/ui/label";

const SHIPPING_COST_DELIVERY = 3.50;

const checkoutFormSchema = z.object({
  // Buyer Info
  buyerName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  buyerEmail: z.string().email({ message: "Por favor ingresa un email válido." }),
  buyerPhone: z.string().min(7, { message: "El teléfono debe tener al menos 7 dígitos." }),
  // Shipping Info
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  // Optional notes
  orderNotes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation for shipping address will be handled outside Zod if shippingMethod is managed by local state
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const { cartItems, totalPrice, itemCount, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("delivery");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cod");
  
  const [currentShippingCost, setCurrentShippingCost] = useState(SHIPPING_COST_DELIVERY);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      shippingAddress: "",
      shippingCity: "",
      shippingProvince: "",
      shippingPostalCode: "",
      shippingCountry: "Ecuador",
      orderNotes: "",
    },
  });
  
  useEffect(() => {
    if (itemCount === 0 && !isLoading) {
      toast({
        title: "Carrito Vacío",
        description: "No puedes proceder al pago con un carrito vacío.",
        variant: "destructive"
      });
      router.push("/cart");
    }
  }, [itemCount, router, toast, isLoading]);

  useEffect(() => {
    if (selectedShippingMethod === "delivery") {
      setCurrentShippingCost(SHIPPING_COST_DELIVERY);
      // Trigger validation if needed, or ensure required fields for delivery are checked
      if (form.formState.isSubmitted || form.getFieldState("shippingAddress").isDirty) {
        form.trigger(["shippingAddress", "shippingCity", "shippingProvince", "shippingPostalCode", "shippingCountry"]);
      }
    } else {
      setCurrentShippingCost(0);
      // Clear errors for shipping fields if pickup is selected
      form.clearErrors(["shippingAddress", "shippingCity", "shippingProvince", "shippingPostalCode", "shippingCountry"]);
    }
  }, [selectedShippingMethod, form]);

  const loyaltyPoints = Math.floor(totalPrice);
  const finalTotal = totalPrice + currentShippingCost;

  async function onSubmit(values: CheckoutFormValues) {
    if (selectedShippingMethod === "delivery") {
      if (!values.shippingAddress?.trim()) {
        form.setError("shippingAddress", { type: "manual", message: "La dirección es requerida para envío a domicilio." });
      }
      if (!values.shippingCity?.trim()) {
        form.setError("shippingCity", { type: "manual", message: "La ciudad es requerida para envío a domicilio." });
      }
      if (!values.shippingProvince?.trim()) {
        form.setError("shippingProvince", { type: "manual", message: "La provincia es requerida para envío a domicilio." });
      }
       // Add more checks if needed
      if (!values.shippingAddress?.trim() || !values.shippingCity?.trim() || !values.shippingProvince?.trim()) {
        toast({ title: "Error de Validación", description: "Por favor completa la dirección de envío.", variant: "destructive" });
        return;
      }
    }


    setIsLoading(true);
    console.log("Checkout form submitted:", values, "Selected Shipping:", selectedShippingMethod, "Selected Payment:", selectedPaymentMethod, "Shipping Cost:", currentShippingCost, "Final Total:", finalTotal);
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "¡Pedido Realizado con Éxito!",
      description: "Gracias por tu compra. Hemos recibido tu pedido y lo estamos procesando.",
    });
    
    clearCart();
    router.push("/dashboard"); 
    setIsLoading(false);
  }

  if (itemCount === 0 && typeof window !== 'undefined') {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Tu carrito está vacío. Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 md:mb-12 text-center">
         <ShoppingBag className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
          Finalizar Compra
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Información del Comprador</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="buyerName" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input placeholder="Ej: Ana Lectora" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="buyerEmail" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="buyerPhone" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl><Input type="tel" placeholder="Ej: 0991234567" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><PackageSearch className="mr-2 h-5 w-5 text-primary"/>Método de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedShippingMethod}
                  onValueChange={(value) => setSelectedShippingMethod(value)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="delivery" id="shipping-delivery"/>
                    <Label htmlFor="shipping-delivery" className="font-normal flex-grow cursor-pointer">
                      <div className="flex items-center">
                        <Truck className="mr-2 h-5 w-5 text-muted-foreground"/> 
                        <div>
                          A Domicilio (Recargo: ${SHIPPING_COST_DELIVERY.toFixed(2)})
                          <span className="block text-xs text-muted-foreground">Recibe tu pedido en la comodidad de tu hogar.</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="pickup" id="shipping-pickup"/>
                    <Label htmlFor="shipping-pickup" className="font-normal flex-grow cursor-pointer">
                       <div className="flex items-center">
                         <Store className="mr-2 h-5 w-5 text-muted-foreground"/>
                         <div>
                            Retiro en Librería (Gratis)
                            <span className="block text-xs text-muted-foreground">Recoge tu pedido en una de nuestras librerías asociadas sin costo adicional.</span>
                          </div>
                       </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            {selectedShippingMethod === "delivery" && (
              <Card className="shadow-md animate-fadeIn">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><Truck className="mr-2 h-5 w-5 text-primary"/>Dirección de Envío</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="shippingAddress" render={({ field }) => ( <FormItem className="sm:col-span-2"> <FormLabel>Dirección (Calle Principal, Número, Calle Secundaria)</FormLabel> <FormControl><Input placeholder="Ej: Av. Amazonas N34-451 y Juan Pablo Sanz" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="shippingCity" render={({ field }) => ( <FormItem> <FormLabel>Ciudad</FormLabel> <FormControl><Input placeholder="Ej: Quito" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="shippingProvince" render={({ field }) => ( <FormItem> <FormLabel>Provincia</FormLabel> <FormControl><Input placeholder="Ej: Pichincha" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="shippingPostalCode" render={({ field }) => ( <FormItem> <FormLabel>Código Postal</FormLabel> <FormControl><Input placeholder="Ej: 170101" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="shippingCountry" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </CardContent>
              </Card>
            )}

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                 <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={(value) => setSelectedPaymentMethod(value)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors">
                    <RadioGroupItem value="cod" id="payment-cod"/>
                    <Label htmlFor="payment-cod" className="font-normal flex-grow cursor-pointer">
                      <div className="flex items-center">
                        <Truck className="mr-2 h-5 w-5 text-muted-foreground"/>
                        <div>
                          Contra Entrega
                          <span className="block text-xs text-muted-foreground">Paga en efectivo al momento de recibir tu pedido.</span>
                        </div>
                      </div>
                    </Label>
                  </div>
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
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Banco:</strong> Banco del Austro</p> <p><strong>Tipo de Cuenta:</strong> Ahorros</p> <p><strong>Número de Cuenta:</strong> 1234567890</p> <p><strong>Beneficiario:</strong> Alicia Libros S.A.</p> <p><strong>RUC/CI:</strong> 1790000000001</p> <p><strong>Email para notificación:</strong> pagos@alicialibros.com</p>
                      <p className="mt-2 text-xs">Por favor, incluye tu número de pedido en la referencia de la transferencia. Tu pedido será procesado una vez confirmado el pago.</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader><CardTitle className="font-headline text-xl">Notas Adicionales (Opcional)</CardTitle></CardHeader>
              <CardContent>
                 <FormField control={form.control} name="orderNotes" render={({ field }) => ( <FormItem> <FormLabel>¿Alguna instrucción especial para tu pedido o la entrega?</FormLabel> <FormControl><Textarea placeholder="Ej: Dejar en portería, entregar en horario de oficina, etc." className="resize-none" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
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
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal ({itemCount} artículos):</span> <span className="font-medium">${totalPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-medium">
                      {currentShippingCost > 0 ? `$${currentShippingCost.toFixed(2)}` : "Gratis"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary"><span>Total:</span> <span>${finalTotal.toFixed(2)}</span></div>
                </div>
                <Separator/>
                 <div className="flex items-center justify-center text-sm text-accent p-3 bg-accent/10 rounded-md">
                    <Gift className="mr-2 h-5 w-5"/> ¡Acumularás <span className="font-bold mx-1">{loyaltyPoints}</span> puntos con esta compra!
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full font-body text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
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
    
