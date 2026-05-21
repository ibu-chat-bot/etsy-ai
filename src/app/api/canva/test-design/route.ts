import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

/**
 * GET /api/canva/test-design
 *
 * Sends a minimal real Canva API request and returns full
 * request + response details for debugging.
 *
 * Correct payload (official Canva Connect API docs):
 *   POST /v1/designs
 *   { "type": "custom", "width": 1080, "height": 1080, "title": "..." }
 */
export async function GET(_request: NextRequest) {
  const conn = await db.getCanvaConnection('admin-id');
  const settings = await db.getSettings();

  const credentialsConfigured = {
    clientId: !!settings.canvaClientId,
    clientSecret: !!settings.canvaClientSecret,
    redirectUri: settings.canvaRedirectUri || null
  };

  if (!conn) {
    return NextResponse.json({
      success: false,
      error: 'No Canva connection found. Please connect your Canva account in Settings.',
      credentialsConfigured
    }, { status: 400 });
  }

  const token = conn.accessToken;
  const isMock = token?.startsWith('mock_');

  if (isMock || !token) {
    return NextResponse.json({
      success: false,
      tokenType: 'mock_sandbox',
      tokenPreview: token ? token.substring(0, 20) + '...' : null,
      error: 'Token is a mock/sandbox token — not a real Canva OAuth token.',
      fix: [
        '1. Go to Settings page',
        '2. Ensure Client ID, Client Secret, and Redirect URI are correctly set',
        '3. Click "Disconnect Canva Workspace"',
        '4. Click "Connect Canva Account"',
        '5. Complete the OAuth flow on Canva',
        '6. Return here and test again'
      ],
      credentialsConfigured
    }, { status: 400 });
  }

  // Real token — make the actual API call
  const endpoint = 'https://api.canva.com/rest/v1/designs';
  const requestBody = {
    type: 'type_and_asset',
    design_type: {
      type: 'custom',
      width: 1080,
      height: 1080
    },
    title: 'Etsy AI Diagnostic Test Design'
  };

  console.log('[Canva Test] ▶ Sending real API request to:', endpoint);
  console.log('[Canva Test] Token preview:', token.substring(0, 20) + '...');
  console.log('[Canva Test] Payload:', JSON.stringify(requestBody, null, 2));

  let responseStatus: number;
  let responseBody: unknown;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    responseStatus = res.status;
    const text = await res.text();
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = { raw: text };
    }

    console.log(`[Canva Test] Response status: ${responseStatus}`);
    console.log('[Canva Test] Response body:', JSON.stringify(responseBody, null, 2));

    const success = res.ok;
    const designId = (responseBody as any)?.design?.id;
    const editUrl = (responseBody as any)?.design?.urls?.edit_url;
    const viewUrl = (responseBody as any)?.design?.urls?.view_url;

    return NextResponse.json({
      success,
      tokenType: 'real_oauth',
      tokenPreview: token.substring(0, 20) + '...',
      request: {
        url: endpoint,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.substring(0, 20)}...`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      },
      response: {
        status: responseStatus,
        body: responseBody
      },
      credentialsConfigured,
      ...(success && designId ? {
        design_id: designId,
        edit_url: editUrl,
        view_url: viewUrl
      } : {})
    });
  } catch (err: any) {
    console.error('[Canva Test] Network error:', err.message);
    return NextResponse.json({
      success: false,
      error: err.message,
      tokenType: 'real_oauth',
      request: { url: endpoint, method: 'POST', body: requestBody },
      credentialsConfigured
    }, { status: 500 });
  }
}
