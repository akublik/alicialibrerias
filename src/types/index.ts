export interface Book {
  id: string;
  isbn?: string;
  title: string;
  authors: string[];
  categories?: string[];
  price: number;
  stock?: number;
  description?: string;
  tags?: string[];
  imageUrl: string;
  dataAiHint?: string;
}

export interface Library {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
  dataAiHint?: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'librero' | 'lector' | 'admin';
  libraryId?: string; // Only for 'librero'
  preferences?: Record<string, any>;
  // Add other fields as necessary
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  rating: number;
  comment: string;
  date: string; // ISO string
  avatarUrl?: string;
  dataAiHint?: string;
}

export type CartItem = Book & {
  quantity: number;
};
