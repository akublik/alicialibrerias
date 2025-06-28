// src/app/api/proxy-epub/route.ts
import { NextResponse, type NextRequest } from 'next/server';

/**
 * This route acts as a server-side proxy to fetch EPUB files from Firebase Storage.
 * It bypasses browser CORS (Cross-Origin Resource Sharing) restrictions that
 * prevent the client-side reader from directly accessing storage URLs.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const epubUrl = searchParams.get('url');

  if (!epubUrl) {
    return new NextResponse('Missing EPUB URL', { status: 400 });
  }

  try {
    // Basic validation to prevent misuse of the proxy
    const isFirebaseStorageUrl = epubUrl.startsWith('https://firebasestorage.googleapis.com/');
    if (!isFirebaseStorageUrl) {
        return new NextResponse('Invalid URL provided. Only Firebase Storage URLs are allowed.', { status: 400 });
    }

    const response = await fetch(epubUrl);

    if (!response.ok) {
      return new NextResponse(response.statusText, { status: response.status });
    }

    const bookData = await response.arrayBuffer();
    
    // Create a new response with the correct headers for the reader component
    const headers = new Headers();
    headers.set('Content-Type', 'application/epub+zip');
    headers.set('Content-Length', String(bookData.byteLength));

    return new NextResponse(bookData, { status: 200, headers });

  } catch (error) {
    console.error('EPUB Proxy Error:', error);
    return new NextResponse('Failed to fetch EPUB file via proxy', { status: 500 });
  }
}
