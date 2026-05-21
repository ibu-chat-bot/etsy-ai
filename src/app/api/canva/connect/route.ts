import { NextRequest, NextResponse } from 'next/server';
import { canvaClient } from '@/lib/canva/client';

export async function GET(request: NextRequest) {
  try {
    const authUrl = await canvaClient.getAuthUrl('admin', request.url);
    return NextResponse.json({ authUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
