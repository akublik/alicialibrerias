// src/components/auth_library/LibraryForgotPasswordForm.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MailQuestion, ArrowLeft, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
});

export function LibraryForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    // Simulate API call for password reset email
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Library forgot password for email:", values.email);
    toast({
      title: "Instrucciones Enviadas",
      description: "Si existe una cuenta de librería con ese email, recibirás instrucciones para restablecer la contraseña.",
    });
    form.reset();
    setIsLoading(false);
  }

  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <Store className="mx-auto h-10 w-10 text-primary mb-2" />
        <MailQuestion className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">Recuperar Contraseña de Librería</CardTitle>
        <CardDescription>Ingresa el email de administrador de tu librería.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Administrador</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@tulibreria.com" {...field} className="text-base md:text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar Instrucciones
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <Link href="/library-login" className="font-medium text-primary hover:underline flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver al Ingreso de Librerías
        </Link>
      </CardFooter>
    </Card>
  );
}
