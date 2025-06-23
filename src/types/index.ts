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
  pageCount?: number | null;
  coverType?: string | null;
  publisher?: string | null;
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
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  isActive?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'library' | 'reader';
  libraryId?: string; // Only for 'library' role
  password?: string; // For prototype purposes, would be handled by Auth in production
  createdAt?: any; // Should be Firestore Timestamp
  isActive?: boolean;
  birthdate?: string; // Storing as ISO string
  favoriteCategories?: string[];
  favoriteTags?: string[];
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
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string; // ISO string from Firestore Timestamp
  shippingMethod: string;
  paymentMethod: string;
  shippingAddress?: string;
  orderNotes?: string;
  needsInvoice?: boolean;
  taxId?: string;
}

export interface LibraryEvent {
  id: string;
  libraryId: string;
  title: string;
  description: string;
  date: string; // ISO string for the event date/time
  imageUrl: string;
  dataAiHint?: string;
  createdAt: any; // Firestore Timestamp
}

export interface EventRegistration {
  id: string;
  eventId: string;
  libraryId: string;
  name: string;
  whatsapp: string;
  createdAt: string; // ISO string from Firestore Timestamp
}

export interface UserFavorite {
  id?: string; // Firestore doc ID
  userId: string;
  libraryId: string;
  createdAt: any; // Firestore Timestamp
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  dataAiHint?: string;
}

export interface SecondaryBannerSlide {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
}

export interface HomepageContent {
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string;
  bannerDataAiHint?: string;
  featuredBookIds: string[];
  secondaryBannerSlides?: SecondaryBannerSlide[];
}

export interface AboutUsTeamMember {
  name: string;
  role: string;
  imageUrl: string;
  dataAiHint: string;
}

export interface AboutUsBenefit {
  title: string;
  description: string;
  icon: string;
}

export interface AboutUsContent {
  headerTitle: string;
  headerSubtitle: string;
  headerImageUrl: string;
  headerDataAiHint: string;
  missionTitle: string;
  missionParagraph1: string;
  missionParagraph2: string;
  missionImageUrl: string;
  missionDataAiHint: string;
  team: AboutUsTeamMember[];
  whyUsTitle: string;
  benefits: AboutUsBenefit[];
}

    