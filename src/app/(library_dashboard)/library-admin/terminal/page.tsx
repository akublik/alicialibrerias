// src/app/(library_dashboard)/library-admin/terminal/page.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Coins, QrCode } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Library } from "@/types";

const terminalFormSchema = z.object({
  userId: z.string().min(5, { message: "El ID de usuario es requerido." }),
  purchaseAmount: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
});

type TerminalFormValues = z.infer<typeof terminalFormSchema>;

export default function PointOfSaleTerminalPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TerminalFormValues>({
    resolver: zodResolver(terminalFormSchema),
    defaultValues: { userId: "", purchaseAmount: undefined },
  });

  async function onSubmit(values: TerminalFormValues) {
    setIsLoading(true);

    const libraryDataString = localStorage.getItem("aliciaLibros_registeredLibrary");
    if (!libraryDataString) {
      toast({ title: "Error de Configuración", description: "No se encontró la información de la librería. Por favor, vuelve a iniciar sesión.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const libraryData: Library = JSON.parse(libraryDataString);
      if (!libraryData.apiKey) {
        throw new Error("La clave de API para esta librería no está configurada.");
      }
      
      const response = await fetch('/api/transactions/grant-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userId: values.userId,
              purchaseAmount: values.purchaseAmount,
              apiKey: libraryData.apiKey,
          }),
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.error || 'Error desconocido al procesar la transacción.');
      }

      toast({
          title: "¡Puntos Otorgados!",
          description: result.message || `Se otorgaron ${result.pointsGranted} puntos.`,
      });
      form.reset();

    } catch (error: any) {
      toast({ title: "Error en la Transacción", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-8">
        <Coins className="mr-3 h-8 w-8 text-primary"/>
        <div>
           <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Terminal de Puntos</h1>
           <p className="text-lg text-foreground/80">Otorga puntos a tus clientes por sus compras en tienda física.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Nueva Transacción</CardTitle>
            <CardDescription>Ingresa el ID del cliente y el monto de su compra.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Pide al cliente su ID de usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchaseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto de la Compra ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ej: 25.50" {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                  Otorgar Puntos
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2"><QrCode className="h-5 w-5"/>¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>1. El cliente debe ir a su panel de usuario en la app de Alicia Libros (<span className="font-semibold">Mi Espacio Lector</span>).</p>
                <p>2. Allí encontrará su <span className="font-semibold">ID de Cliente</span> y un código QR que contiene ese mismo ID.</p>
                <p>3. Puedes escribir manualmente el ID en el campo de la izquierda o usar un lector de códigos QR (no incluido) para escanearlo y pegar el resultado aquí.</p>
                <p>4. Ingresa el monto total de la compra y haz clic en "Otorgar Puntos". ¡Los puntos se acreditarán al instante en la cuenta del cliente!</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
