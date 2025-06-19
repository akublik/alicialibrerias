"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { LogIn, ChromeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    className={className || "animate-spin"}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);


export function LoginForm() {
  // console.log("Rendering simplified LoginForm"); // Para depuración en el navegador
  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary">Ingresar (Prueba)</CardTitle>
        <CardDescription>Este es un LoginForm simplificado para pruebas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label htmlFor="email-test" className="block text-sm font-medium text-foreground mb-1">Email (Prueba)</label>
          <input id="email-test" type="email" placeholder="tu@email.com" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
        </div>
        <div>
          <label htmlFor="password-test" className="block text-sm font-medium text-foreground mb-1">Contraseña (Prueba)</label>
          <input id="password-test" type="password" placeholder="********" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
        </div>
        <Button type="button" className="w-full font-body text-base">
          <LogIn className="mr-2 h-4 w-4" />
          Ingresar (Botón de Prueba)
        </Button>
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
        <Button variant="outline" className="w-full mt-6 font-body text-base">
          <ChromeIcon className="mr-2 h-4 w-4" /> 
          Ingresar con Google (Prueba)
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        <Link href="/register" className="font-medium text-primary hover:underline">
          ¿No tienes una cuenta? Regístrate
        </Link>
      </CardFooter>
    </Card>
  );
}
