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
import { Eye, EyeOff, LogIn, ChromeIcon } from "lucide-react"; // Assuming ChromeIcon for Google
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Login values:", values);
    
    // Mock success/failure
    if (values.email === "test@example.com" && values.password === "password") {
      localStorage.setItem("isAuthenticated", "true");
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido de nuevo!",
      });
      if (typeof window !== 'undefined') window.location.href = "/dashboard"; // Redirect to dashboard
    } else {
      toast({
        title: "Error de Inicio de Sesión",
        description: "Email o contraseña incorrectos.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }
  
  async function handleGoogleLogin() {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Attempting Google login...");
    // Mock Google login success
    localStorage.setItem("isAuthenticated", "true");
    toast({
      title: "Inicio de Sesión con Google Exitoso",
      description: "Bienvenido!",
    });
    if (typeof window !== 'undefined') window.location.href = "/dashboard";
    setIsLoading(false);
  }


  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary">Ingresar</CardTitle>
        <CardDescription>Accede a tu cuenta para continuar tu aventura literaria.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} className="text-base md:text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="********" 
                        {...field} 
                        className="text-base md:text-sm pr-10"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Ingresar
            </Button>
          </form>
        </Form>
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O continúa con
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full mt-6 font-body text-base" onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChromeIcon className="mr-2 h-4 w-4" /> } 
          Ingresar con Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        <Link href="/register" className="font-medium text-primary hover:underline">
          ¿No tienes una cuenta? Regístrate
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </CardFooter>
    </Card>
  );
}

// Placeholder for Loader2 if not imported from lucide-react, or use a different spinner
const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
