// src/app/(app)/cart/page.tsx
"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { cartItems, removeFromCart, updateItemQuantity, itemCount, totalPrice, clearCart } = useCart();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 md:mb-12 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
          Tu Carrito de Compras
        </h1>
      </header>

      {itemCount === 0 ? (
        <Card className="text-center py-12 shadow-md">
          <CardContent>
            <p className="text-xl text-muted-foreground mb-6">Tu carrito está vacío.</p>
            <Link href="/">
              <Button size="lg" className="font-body">
                Seguir Comprando
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <Card key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-24 h-36 sm:w-28 sm:h-40 flex-shrink-0 rounded overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={item.dataAiHint || "book cover cart"}
                  />
                </div>
                <div className="flex-grow">
                  <Link href={`/books/${item.id}`}>
                    <h2 className="font-headline text-lg font-semibold text-primary hover:underline">{item.title}</h2>
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.authors.join(", ")}</p>
                  <p className="text-lg font-semibold text-foreground mt-1">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-4 sm:mt-0">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 rounded-r-none"
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value, 10);
                        if (!isNaN(newQuantity)) {
                           updateItemQuantity(item.id, newQuantity > 0 ? newQuantity : 1 )
                        }
                      }}
                      className="h-8 w-12 text-center border-t-0 border-b-0 rounded-none focus-visible:ring-0"
                      aria-label="Cantidad"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-l-none"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                    aria-label="Eliminar del carrito"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ))}
             <div className="text-right mt-6">
              <Button variant="outline" onClick={clearCart} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 border-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Vaciar Carrito
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span>Subtotal ({itemCount} artículos):</span>
                  <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Envío:</span>
                  <span className="font-semibold">Por Calcular</span> {/* Placeholder */}
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total Estimado:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/pre-checkout" className="w-full">
                  <Button size="lg" className="w-full font-body text-base">
                    Proceder al Pago <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
