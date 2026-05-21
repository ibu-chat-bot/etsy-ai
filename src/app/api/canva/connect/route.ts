import { NextResponse } from 'next/server';
import { canvaClient } from '@/lib/canva/client';

export async function GET() {
  try {
    const authUrl = await canvaClient.getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
