// app/api/graphql/proxy/route.ts
import { NextRequest } from 'next/server';

const WORDPRESS_GRAPHQL = 'https://btc.858webdesign.com/graphql';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) return new Response('No query', { status: 400 });

  const res = await fetch(WORDPRESS_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(WORDPRESS_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data);
}

// THIS LINE FIXES THE 404 IN DEV
export const dynamic = 'force-dynamic';