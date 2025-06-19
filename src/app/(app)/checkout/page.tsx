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
import { CreditCard, Gift, Truck, Building, Home, Phone, Mail, User, Landmark, Loader2, ShoppingBag } from "lucide-react";

const checkoutFormSchema = z.object({
  // Buyer Info
  buyerName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  buyerEmail: z.string().email({ message: "Por favor ingresa un email válido." }),
  buyerPhone: z.string().min(7, { message: "El teléfono debe tener al menos 7 dígitos." }),
  // Shipping Info
  shippingAddress: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  shippingCity: z.string().min(3, { message: "La ciudad debe tener al menos 3 caracteres." }),
  shippingProvince: z.string().min(3, { message: "La provincia debe tener al menos 3 caracteres." }),
  shippingPostalCode: z.string().min(3, { message: "El código postal debe tener al menos 3 caracteres." }),
  shippingCountry: z.string().min(3, { message: "El país debe tener al menos 3 caracteres." }),
  // Payment
  paymentMethod: z.enum(["cod", "transfer"], {
    required_error: "Debes seleccionar un método de pago.",
  }),
  // Optional notes
  orderNotes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const { cartItems, totalPrice, itemCount, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(undefined);

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
      paymentMethod: undefined,
      orderNotes: "",
    },
  });
  
  useEffect(() => {
    if (itemCount === 0 && !isLoading) { // Prevent redirect during submission
      toast({
        title: "Carrito Vacío",
        description: "No puedes proceder al pago con un carrito vacío.",
        variant: "destructive"
      });
      router.push("/cart");
    }
  }, [itemCount, router, toast, isLoading]);


  const loyaltyPoints = Math.floor(totalPrice); // 1 point per dollar

  async function onSubmit(values: CheckoutFormValues) {
    setIsLoading(true);
    console.log("Checkout form submitted:", values);
    // Simulate API call for order placement
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "¡Pedido Realizado con Éxito!",
      description: "Gracias por tu compra. Hemos recibido tu pedido y lo estamos procesando.",
    });
    
    clearCart();
    router.push("/dashboard"); // Or a dedicated order confirmation page
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
          {/* Left Column: Forms */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Información del Comprador</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="buyerName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ana Lectora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buyerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buyerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Ej: 0991234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><Truck className="mr-2 h-5 w-5 text-primary"/>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Dirección (Calle Principal, Número, Calle Secundaria)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Av. Amazonas N34-451 y Juan Pablo Sanz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Quito" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingProvince"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pichincha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingPostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 170101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedPaymentMethod(value);
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors">
                            <FormControl>
                              <RadioGroupItem value="cod" />
                            </FormControl>
                            <div className="w-full">
                              <FormLabel className="font-normal flex items-center cursor-pointer">
                                <Truck className="mr-2 h-5 w-5 text-muted-foreground"/> Contra Entrega
                              </FormLabel>
                              <p className="text-xs text-muted-foreground ml-7">Paga en efectivo al momento de recibir tu pedido.</p>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors">
                            <FormControl>
                              <RadioGroupItem value="transfer" />
                            </FormControl>
                            <div className="w-full">
                            <FormLabel className="font-normal flex items-center cursor-pointer">
                              <Landmark className="mr-2 h-5 w-5 text-muted-foreground"/> Transferencia Bancaria
                            </FormLabel>
                            <p className="text-xs text-muted-foreground ml-7">Realiza el pago directamente a nuestra cuenta bancaria.</p>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedPaymentMethod === "transfer" && (
                  <Card className="mt-4 bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Instrucciones para Transferencia Bancaria</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Banco:</strong> Banco del Austro</p>
                      <p><strong>Tipo de Cuenta:</strong> Ahorros</p>
                      <p><strong>Número de Cuenta:</strong> 1234567890</p>
                      <p><strong>Beneficiario:</strong> Alicia Libros S.A.</p>
                      <p><strong>RUC/CI:</strong> 1790000000001</p>
                      <p><strong>Email para notificación:</strong> pagos@alicialibros.com</p>
                      <p className="mt-2 text-xs">Por favor, incluye tu número de pedido en la referencia de la transferencia. Tu pedido será procesado una vez confirmado el pago.</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Notas Adicionales (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                 <FormField
                  control={form.control}
                  name="orderNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Alguna instrucción especial para tu pedido o la entrega?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Dejar en portería, entregar en horario de oficina, etc."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-20">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="relative w-16 h-24 rounded overflow-hidden border">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={item.dataAiHint || "book checkout"}
                      />
                       <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-bl-md">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.authors.join(", ")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} artículos):</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-medium">Gratis (Promoción)</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <Separator/>
                 <div className="flex items-center justify-center text-sm text-accent p-3 bg-accent/10 rounded-md">
                    <Gift className="mr-2 h-5 w-5"/>
                    ¡Acumularás <span className="font-bold mx-1">{loyaltyPoints}</span> puntos con esta compra!
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full font-body text-base" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-5 w-5" />
                  )}
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

// Placeholder for Loader2 if not already defined
// const Loader2 = ({ className }: { className?: string }) => (...);
// Ensure other icons are imported if not available.
