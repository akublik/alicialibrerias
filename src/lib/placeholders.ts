import type { Book, Library, Review } from '@/types';

export const placeholderBooks: Book[] = [
  {
    id: '1',
    title: 'Cien Años de Soledad',
    authors: ['Gabriel García Márquez'],
    price: 15.99,
    imageUrl: 'https://placehold.co/300x450.png',
    dataAiHint: 'magic realism',
    description: 'La novela narra la historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
    categories: ['Realismo Mágico', 'Novela Latinoamericana'],
    tags: ['Clásico', 'Colombia', 'Saga Familiar']
  },
  {
    id: '2',
    title: 'La Casa de los Espíritus',
    authors: ['Isabel Allende'],
    price: 12.50,
    imageUrl: 'https://placehold.co/300x450.png',
    dataAiHint: 'family saga',
    description: 'Una saga familiar que narra la vida de la familia Trueba a lo largo de varias generaciones en un país latinoamericano sin nombre.',
    categories: ['Realismo Mágico', 'Ficción Histórica'],
    tags: ['Chile', 'Feminismo', 'Política']
  },
  {
    id: '3',
    title: 'Don Quijote de la Mancha',
    authors: ['Miguel de Cervantes'],
    price: 10.00,
    imageUrl: 'https://placehold.co/300x450.png',
    dataAiHint: 'classic literature',
    description: 'Las aventuras de un hidalgo que enloquece leyendo libros de caballerías y decide hacerse caballero andante.',
    categories: ['Clásico Universal', 'Novela Picaresca'],
    tags: ['España', 'Aventura', 'Humor']
  },
  {
    id: '4',
    title: 'Huasipungo',
    authors: ['Jorge Icaza Coronel'],
    price: 9.75,
    imageUrl: 'https://placehold.co/300x450.png',
    dataAiHint: 'social novel',
    description: 'Una obra fundamental del indigenismo en la literatura ecuatoriana, que denuncia la explotación de los indígenas.',
    categories: ['Literatura Ecuatoriana', 'Indigenismo'],
    tags: ['Ecuador', 'Realismo Social', 'Denuncia']
  },
];

export const placeholderLibraries: Library[] = [
  {
    id: '1',
    name: 'Librería El Gato Lector',
    location: 'Quito, Ecuador',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'bookstore interior',
    description: 'Un rincón acogedor para los amantes de la lectura en el corazón de Quito.'
  },
  {
    id: '2',
    name: 'Libros y Sueños',
    location: 'Guayaquil, Ecuador',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'library books',
    description: 'La mayor variedad de libros y eventos culturales en Guayaquil.'
  },
  {
    id: '3',
    name: 'Tinta Viva',
    location: 'Cuenca, Ecuador',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'cafe bookstore',
    description: 'Café y librería, el lugar perfecto para disfrutar de un buen libro.'
  },
    {
    id: '4',
    name: 'El Rincón del Saber',
    location: 'Bogotá, Colombia',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'modern bookstore',
    description: 'Descubre tesoros literarios en nuestra librería en Bogotá.'
  },
  {
    id: '5',
    name: 'Letras Andinas',
    location: 'Lima, Perú',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'cozy library',
    description: 'Fomentando la lectura y la cultura en Lima.'
  },
];

export const placeholderReviews: Review[] = [
  {
    id: '1',
    userId: 'user123',
    userName: 'Ana Pérez',
    bookId: '1',
    bookTitle: 'Cien Años de Soledad',
    rating: 5,
    comment: '¡Una obra maestra! Me transportó a Macondo desde la primera página. Totalmente recomendado.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman reading'
  },
  {
    id: '2',
    userId: 'user456',
    userName: 'Carlos López',
    bookId: '1',
    bookTitle: 'Cien Años de Soledad',
    rating: 4,
    comment: 'Un clásico que hay que leer. La complejidad de los personajes es asombrosa.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'man glasses'
  },
  {
    id: '3',
    userId: 'user789',
    userName: 'Sofía Gómez',
    bookId: '2',
    bookTitle: 'La Casa de los Espíritus',
    rating: 5,
    comment: 'Isabel Allende nunca decepciona. Una historia conmovedora y poderosa.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'person smiling'
  },
];

export const bookClubs = [
  { id: '1', name: 'Club de Realismo Mágico', description: 'Exploramos las obras maestras del realismo mágico latinoamericano.', members: 120, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'fantasy landscape' },
  { id: '2', name: 'Poesía Viva', description: 'Un espacio para leer, compartir y crear poesía.', members: 75, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'quill paper' },
  { id: '3', name: 'Debates Literarios Ecuador', description: 'Discutimos sobre literatura ecuatoriana contemporánea e histórica.', members: 90, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'discussion group' },
];
