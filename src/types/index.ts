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
  libraryId?: string; // ID of the library that owns this book
  status?: 'published' | 'unpublished';
  isFeatured?: boolean;
}

export interface Library {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
  dataAiHint?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'library' | 'reader';
  libraryId?: string; // Only for 'library' role
  password?: string; // For prototype purposes, would be handled by Auth in production
  createdAt?: any; // Should be Firestore Timestamp
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

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  libraryId: string;
  buyerName: string;
  buyerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  shippingAddress?: string;
  orderNotes?: string;
}
