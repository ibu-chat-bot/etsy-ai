import { NextRequest, NextResponse } from 'next/server';
import { canvaClient } from '@/lib/canva/client';

export async function GET(request: NextRequest) {
  try {
    const { authUrl, codeVerifier } = await canvaClient.getAuthUrl('admin', request.url);
    const response = NextResponse.json({ authUrl });
    
    // Save code verifier in httpOnly cookie for serverless compatibility
    response.cookies.set('canva_code_verifier', codeVerifier, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 300 // 5 minutes
    });
    
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
