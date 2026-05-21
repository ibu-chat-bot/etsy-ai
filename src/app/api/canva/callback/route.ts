import { NextRequest, NextResponse } from 'next/server';
import { canvaClient } from '@/lib/canva/client';
import { db } from '@/lib/db/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code_provided', request.url));
  }

  try {
    const tokens = await canvaClient.exchangeCodeForTokens(code);
    
    // Save to the single admin-id connection
    await db.saveCanvaConnection({
      userId: 'admin-id',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      workspaceId: 'workspace_' + Math.random().toString(36).substring(2, 9)
    });

    return NextResponse.redirect(new URL('/settings?connected=true', request.url));
  } catch (err: any) {
    console.error('Canva OAuth callback failed:', err);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(err.message)}`, request.url));
  }
}
