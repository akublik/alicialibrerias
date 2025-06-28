// src/context/WishlistContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UserWishlistItem } from "@/types";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, doc } from "firebase/firestore";

interface WishlistContextType {
  wishlistItems: UserWishlistItem[];
  isInWishlist: (bookId: string) => boolean;
  toggleWishlist: (bookId: string) => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<UserWishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs on the client, where localStorage is available.
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (userDataString) {
      try {
        setUser(JSON.parse(userDataString));
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (user && db) {
      setIsLoading(true);
      const q = query(collection(db, "wishlist"), where("userId", "==", user.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserWishlistItem));
        setWishlistItems(items);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching wishlist:", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If no user or db, clear wishlist and stop loading.
      setWishlistItems([]);
      setIsLoading(false);
    }
  }, [user]);

  const isInWishlist = useCallback((bookId: string) => {
    return wishlistItems.some(item => item.bookId === bookId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (bookId: string) => {
    if (!user || !db) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar libros en tu lista de deseos.",
        variant: "destructive",
      });
      return;
    }

    const existingItem = wishlistItems.find(item => item.bookId === bookId);

    if (existingItem) {
      // Remove from wishlist
      try {
        await deleteDoc(doc(db, "wishlist", existingItem.id));
        toast({ title: "Eliminado de tu lista", description: "El libro se ha quitado de tu lista de deseos." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar de la lista.", variant: "destructive" });
      }
    } else {
      // Add to wishlist
      try {
        await addDoc(collection(db, "wishlist"), {
          userId: user.id,
          bookId,
          createdAt: serverTimestamp(),
        });
        toast({ title: "¡Guardado en tu lista!", description: "Puedes ver todos tus libros guardados en tu panel." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo añadir a la lista.", variant: "destructive" });
      }
    }
  }, [user, wishlistItems, toast]);

  return (
    <WishlistContext.Provider value={{ wishlistItems, isInWishlist, toggleWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
