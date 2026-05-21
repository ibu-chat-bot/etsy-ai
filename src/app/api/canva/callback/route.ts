import { NextRequest, NextResponse } from 'next/server';
import { canvaClient } from '@/lib/canva/client';
import { db } from '@/lib/db/provider';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code_provided', request.url));
  }

  // Retrieve code verifier from request cookies
  const cookieVerifier = request.cookies.get('canva_code_verifier')?.value || '';

  try {
    const tokens = await canvaClient.exchangeCodeForTokens(code, request.url, cookieVerifier);
    const workspaceId = 'workspace_' + Math.random().toString(36).substring(2, 9);
    
    // Save to the DB provider (which handles memory fallback + cookie setting)
    await db.saveCanvaConnection({
      userId: 'admin-id',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      workspaceId
    });

    const response = NextResponse.redirect(new URL('/settings?connected=true', request.url));
    
    // Clean up temporary code verifier cookie
    response.cookies.delete('canva_code_verifier');
    
    // Explicitly write connection credentials into response cookies for reliable state persistence
    response.cookies.set('canva_access_token', tokens.accessToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    response.cookies.set('canva_refresh_token', tokens.refreshToken || '', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    response.cookies.set('canva_workspace_id', workspaceId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Canva OAuth callback failed:', err);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(err.message)}`, request.url));
  }
}
