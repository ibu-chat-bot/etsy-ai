import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

export async function GET() {
  try {
    const conn = await db.getCanvaConnection('admin-id');
    const settings = await db.getSettings();

    if (!conn) {
      return NextResponse.json({
        connected: false,
        tokenPresent: false,
        tokenType: null,
        workspaceId: null,
        credentialsConfigured: {
          clientId: !!settings.canvaClientId,
          clientSecret: !!settings.canvaClientSecret,
          redirectUri: settings.canvaRedirectUri || null
        },
        debug: 'No Canva connection found in database.'
      });
    }

    // Determine token type – we only support real OAuth tokens now.
  const tokenType = 'real_oauth';

    return NextResponse.json({
      connected: true,
      tokenPresent: !!conn.accessToken,
      tokenType,
      tokenPreview: conn.accessToken ? conn.accessToken.substring(0, 20) + '...' : null,
      workspaceId: conn.workspaceId,
      connectionId: conn.id,
      createdAt: conn.createdAt,
      credentialsConfigured: {
        clientId: !!settings.canvaClientId,
        clientSecret: !!settings.canvaClientSecret,
        redirectUri: settings.canvaRedirectUri || null
      },
      debug: tokenType === 'real_oauth'
    ? 'Real OAuth token is active.'
    : 'WARNING: Token is a mock/sandbox token. Re-connect your real Canva account.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.deleteCanvaConnection('admin-id');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
