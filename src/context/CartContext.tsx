// src/context/CartContext.tsx
"use client";

import type { CartItem, Book } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book, quantity?: number) => void;
  removeFromCart: (bookId: string) => void;
  updateItemQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "aliciaLibrosCart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs only once on the client to load and validate the cart from localStorage.
    const loadAndValidateCart = async () => {
      try {
        const storedCartJSON = localStorage.getItem(CART_STORAGE_KEY);
        if (!storedCartJSON) return;
        
        const storedCart: CartItem[] = JSON.parse(storedCartJSON);
        if (!Array.isArray(storedCart) || storedCart.length === 0) return;

        // Get all book IDs from the stored cart.
        const bookIds = storedCart.map(item => item.id);
        if (!db || bookIds.length === 0) return;

        // Fetch full, up-to-date data for all books in the cart from Firestore.
        // This ensures price, stock, and crucially, the 'format' are correct.
        const booksRef = collection(db, "books");
        const booksQuery = query(booksRef, where(documentId(), "in", bookIds));
        const querySnapshot = await getDocs(booksQuery);

        const freshBooksMap = new Map<string, Book>();
        querySnapshot.forEach(doc => {
          freshBooksMap.set(doc.id, { id: doc.id, ...doc.data() } as Book);
        });

        // Reconstruct the cart with fresh data, preserving quantities.
        const validatedCart = storedCart.map(item => {
          const freshBook = freshBooksMap.get(item.id);
          if (freshBook) {
            // Ensure format is explicitly handled.
            const bookWithFormat: CartItem = { 
                ...freshBook,
                format: freshBook.format || 'Físico', // <-- Critical Correction
                quantity: item.quantity 
            };
            return bookWithFormat;
          }
          return null; // Book no longer exists, will be filtered out.
        }).filter((item): item is CartItem => item !== null);

        setCartItems(validatedCart);

      } catch (error) {
        console.error("Could not load or validate cart from localStorage", error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    };
    
    loadAndValidateCart();
  }, []);

  useEffect(() => {
    // This effect synchronizes the cart state with localStorage whenever it changes.
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((book: Book, quantity: number = 1) => {
    if (cartItems.length > 0 && book.libraryId && cartItems[0].libraryId !== book.libraryId) {
      toast({
        title: "Acción no permitida",
        description: "Solo puedes comprar libros de una librería a la vez. Por favor, finaliza tu compra actual para añadir artículos de otra librería.",
        variant: "destructive",
      });
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === book.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Ensure the book object passed to the cart has a format property.
      const bookWithFormat = {
        ...book,
        format: book.format || 'Físico', // Default to 'Físico' if undefined
      };
      return [...prevItems, { ...bookWithFormat, quantity }];
    });
    toast({
      title: "¡Añadido al carrito!",
      description: `${book.title} ha sido añadido a tu carrito.`,
    });
  }, [cartItems, toast]);

  const removeFromCart = useCallback((bookId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== bookId));
    toast({
      title: "Artículo Eliminado",
      description: "El libro ha sido eliminado de tu carrito.",
      variant: "destructive"
    });
  }, [toast]);

  const updateItemQuantity = useCallback((bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === bookId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        clearCart,
        itemCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
