
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const epubUrl = searchParams.get('url');

  if (!epubUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const urlObject = new URL(epubUrl);
    
    // Security check: Only allow proxying from trusted domains, like Firebase Storage.
    const allowedDomains = ['storage.googleapis.com'];
    if (!allowedDomains.some(domain => urlObject.hostname === domain || urlObject.hostname.endsWith(`.${domain}`))) {
      return new NextResponse('Proxying from this domain is not allowed.', { status: 403 });
    }

    const response = await fetch(epubUrl, {
      headers: {
        // Forward some headers if necessary, e.g., for private buckets
        // For public files, this is often not needed.
      }
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch EPUB: ${response.statusText}`, { status: response.status });
    }

    // Get the raw body as an ArrayBuffer
    const body = await response.arrayBuffer();

    // Create a new response to send to the client
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/epub+zip');
    headers.set('Content-Length', String(body.byteLength));
    
    return new NextResponse(body, { status: 200, headers });

  } catch (error: any) {
    console.error('EPUB Proxy Error:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
