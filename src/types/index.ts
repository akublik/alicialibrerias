

export interface Book {
  id: string;
  slug?: string;
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
  libraryName?: string;
  libraryLocation?: string;
  status?: 'published' | 'unpublished';
  isFeatured?: boolean;
  pageCount?: number | null;
  coverType?: string | null;
  publisher?: string | null;
  condition?: 'Nuevo' | 'Usado';
  format?: 'Físico' | 'Digital';
  epubFileUrl?: string;
  pdfFileUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DigitalBook {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl: string;
  epubFileUrl: string; // URL to the EPUB file in Firebase Storage
  pdfFileUrl?: string; // Optional URL for a PDF file
  createdAt: any;
  format?: 'EPUB' | 'PDF' | 'EPUB & PDF';
  categories?: string[];
  tags?: string[];
}

export interface DigitalPurchase {
  id?: string;
  userId: string;
  bookId: string;
  orderId: string;
  title: string;
  author: string;
  coverImageUrl: string;
  createdAt: any; // Firestore Timestamp
  epubFileUrl?: string;
  isAvailable: boolean; // Controls if the user can access the book
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
  createdAt?: any; // Firestore Timestamp
  importRules?: string; // JSON string with import rules
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'library' | 'reader' | 'author';
  libraryId?: string; // Only for 'library' role
  authorId?: string; // Only for 'author' role
  password?: string; // For prototype purposes, would be handled by Auth in production
  createdAt?: any; // Should be Firestore Timestamp
  isActive?: boolean;
  birthdate?: string | null;
  favoriteCategories?: string[];
  favoriteTags?: string[];
  avatarUrl?: string;
  dataAiHint?: string;
  loyaltyPoints?: number;
  hasWrittenFirstReview?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  bookId?: string;
  bookTitle: string;
  rating: number;
  comment: string;
  createdAt: any; // Should be Firestore Timestamp
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
  categories?: string[];
  authors?: string[];
  format?: 'Físico' | 'Digital';
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
  pointsUsed?: number;
  discountAmount?: number;
  pointsEarned?: number;
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

export interface UserWishlistItem {
  id: string; // Firestore doc ID
  userId: string;
  bookId: string;
  createdAt: any; // Firestore Timestamp
}

export interface Author {
  id: string;
  slug?: string;
  name: string;
  bio: string;
  imageUrl: string;
  dataAiHint?: string;
  countries: string[];
  createdAt: any;
  published?: boolean;
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  email?: string;
  phone?: string;
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
  nationalSectionTitle?: string;
  nationalBookIds?: string[];
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

export interface FeatureListItem {
  feature: string;
}

export interface AboutUsContent {
  headerTitle: string;
  headerSubtitle: string;
  headerImageUrl: string;
  headerDataAiHint: string;
  missionTitle: string;
  missionParagraph1: string;
  missionParagraph2?: string;
  missionImageUrl: string;
  missionDataAiHint: string;
  featuresTitle: string;
  featuresForLibraries: FeatureListItem[];
  featuresForReaders: FeatureListItem[];
  team?: AboutUsTeamMember[];
  whyUsTitle?: string;
  benefits?: AboutUsBenefit[];
}

export interface BookRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookTitle: string;
  bookAuthor: string;
  notes?: string;
  status: 'pending' | 'responded';
  createdAt: any; // Firestore Timestamp
}

export interface LibraryAnalytics {
  id: string; // This will be the libraryId
  visitCount: number;
}

export interface SearchLog {
  id: string;
  query: string;
  resultsCount: number;
  timestamp: any; // Firestore Timestamp
  userId?: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  country: string;
  years: string;
  category: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  dataAiHint?: string;
  createdAt: any;
}

export interface RedemptionItem {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageUrl: string;
  dataAiHint?: string;
  type: 'Libro' | 'Gift Card' | 'Servicio' | 'Otro';
  stock: number;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
}

export interface PointsTransaction {
  id: string;
  userId: string;
  orderId?: string;
  libraryId?: string;
  description: string;
  points: number;
  createdAt: any;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  dataAiHint?: string;
  type: 'multiplier' | 'bonus';
  value: number;
  targetType: 'global' | 'category' | 'author' | 'book';
  targetValue?: string;
  startDate: any; // Firestore Timestamp
  endDate: any; // Firestore Timestamp
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
}

export interface Notification {
  id: string;
  type: 'contact_form' | 'new_order' | 'new_request';
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
}

// Types for Market Analysis Flow
export interface MarketAnalysisInput {
    authorGenre: string;
    authorBookTitle: string;
}

export interface MarketAnalysisOutput {
    marketTrends: {
        growingGenres: string[];
        targetAudienceProfile: string;
        averagePrice: string;
    };
    competitorAnalysis: {
        similarAuthors: string[];
        coverAnalysis: string;
        descriptionAnalysis: string;
        marketingStrategies: string;
    };
    aiSuggestions: {
        toneAndStyle: string;
        targetAudienceDifferentiation: string;
        visualSuggestions: string;
    };
}
