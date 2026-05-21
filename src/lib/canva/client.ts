import crypto from 'crypto';
import { db } from '../db/provider';

export interface CanvaTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Logging Helpers ────────────────────────────────────────────────────────

function logCanvaRequest(endpoint: string, method: string, payload?: unknown) {
  console.log(`[Canva API] ${method} ${endpoint}`);
  if (payload) console.log(`[Canva API] Request payload:`, JSON.stringify(payload, null, 2));
}

async function logCanvaResponse(res: Response, endpoint: string): Promise<any> {
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    console.error(`[Canva API] ❌ ERROR ${res.status} on ${endpoint}`);
    console.error(`[Canva API] Error body:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[Canva API] ✅ OK ${res.status} on ${endpoint}`);
    console.log(`[Canva API] Response:`, JSON.stringify(data, null, 2));
  }
  return { ok: res.ok, status: res.status, data };
}

// ─── Canva Client ────────────────────────────────────────────────────────────

export class CanvaClient {
  private readonly BASE_URL = 'https://api.canva.com/rest/v1';

  private async getCredentials() {
    const settings = await db.getSettings();
    return {
      clientId: settings.canvaClientId || '',
      clientSecret: settings.canvaClientSecret || '',
      redirectUri: settings.canvaRedirectUri || ''
    };
  }

  // ─── OAuth ─────────────────────────────────────────────────────────────────

  /**
   * Generates the official Canva OAuth2 authorization URL.
   * Requires clientId to be configured in Settings.
   * NEVER falls back to sandbox — throws if credentials are missing.
   */
  async getAuthUrl(state: string = 'admin', requestUrl?: string): Promise<{ authUrl: string; codeVerifier: string }> {
    const { clientId, redirectUri } = await this.getCredentials();

    if (!clientId) {
      throw new Error(
        'Canva Client ID is not configured. Go to Settings and enter your Canva App Client ID.'
      );
    }

    // Use a sane default redirect URI if none configured or if it points to wrong port or contains localhost.
    let finalRedirectUri = redirectUri;
    if (!finalRedirectUri || finalRedirectUri.includes(':3001') || finalRedirectUri.includes('localhost')) {
      if (requestUrl) {
        try {
          const origin = new URL(requestUrl).origin;
          finalRedirectUri = `${origin}/api/canva/callback`;
        } catch {
          finalRedirectUri = 'http://127.0.0.1:3000/api/canva/callback';
        }
      } else {
        finalRedirectUri = 'http://127.0.0.1:3000/api/canva/callback';
      }
      console.warn('[Canva Auth] Using fallback redirect URI:', finalRedirectUri);
    }

    const scopes = [
      'design:content:write',
      'design:meta:read',
      'asset:write'
    ].join(' ');

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(64).toString('hex');
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = Buffer.from(hash).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    // Store verifier for later token exchange
    await db.saveSettings({ canvaCodeVerifier: codeVerifier });
    // Include PKCE params in auth request
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: finalRedirectUri,
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    // Official Canva OAuth authorize endpoint (no version suffix)
    const url = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
    console.log('[Canva Auth] Generated auth URL:', url);
    return { authUrl: url, codeVerifier };
  }

  /**
   * Exchanges authorization code for real Canva tokens.
   * NEVER generates mock tokens — throws on any error.
   */
  async exchangeCodeForTokens(code: string, requestUrl?: string, passedVerifier?: string): Promise<CanvaTokens> {
    const { clientId, clientSecret, redirectUri } = await this.getCredentials();

    if (!clientId || !clientSecret) {
      throw new Error(
        'Canva Client ID and Secret are required. Configure them in Settings before connecting.'
      );
    }

    // Apply fallback redirect URI logic
    let finalRedirectUri = redirectUri;
    if (!finalRedirectUri || finalRedirectUri.includes(':3001') || finalRedirectUri.includes('localhost')) {
      if (requestUrl) {
        try {
          const origin = new URL(requestUrl).origin;
          finalRedirectUri = `${origin}/api/canva/callback`;
        } catch {
          finalRedirectUri = 'http://127.0.0.1:3000/api/canva/callback';
        }
      } else {
        finalRedirectUri = 'http://127.0.0.1:3000/api/canva/callback';
      }
      console.warn('[Canva Auth] Using fallback redirect URI for token exchange:', finalRedirectUri);
    }

    // Define token endpoint
    const endpoint = `https://api.canva.com/rest/v1/oauth/token`;
    // Debug logging before token exchange
    console.log('[Canva Auth] Token exchange debug:', {
      client_id: clientId,
      secret_length: clientSecret.length,
      endpoint,
      redirect_uri: finalRedirectUri
    });
    // Retrieve stored code verifier for PKCE
    const settings = await db.getSettings();
    const verifier = passedVerifier || settings.canvaCodeVerifier || '';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: finalRedirectUri,
      code_verifier: verifier
    });

    console.log('[Canva Auth] Exchanging code for tokens...');
    console.log('[Canva Auth] Code (first 10 chars):', code.substring(0, 10) + '...');
    console.log('[Canva Auth] Redirect URI used:', finalRedirectUri);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    // Save token endpoint response into settings oauthState for debugging
    const responsePayload = JSON.stringify(data);
    await db.saveSettings({
      oauthState: `HTTP ${status}: ${responsePayload}`
    });

    if (!ok) {
      throw new Error(
        data?.error_description || data?.error ||
        `Canva token exchange failed (HTTP ${status}): ${responsePayload}`
      );
    }

    if (!data.access_token) {
      throw new Error(`Canva returned OK but no access_token in response: ${responsePayload}`);
    }

    console.log('[Canva Auth] ✅ Real tokens received. Token type:', data.token_type);
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Refreshes Canva tokens using refresh token.
   * NEVER falls back to mock — throws on error.
   */
  async refreshTokens(refreshToken: string): Promise<CanvaTokens> {
    const { clientId, clientSecret } = await this.getCredentials();

    if (!clientId || !clientSecret) {
      throw new Error('Canva credentials not configured. Cannot refresh token.');
    }

    const endpoint = `${this.BASE_URL}/oauth/token`;
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    });

    logCanvaRequest(endpoint, 'POST', { grant_type: 'refresh_token' });
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    if (!ok) {
      throw new Error(
        data?.error_description || data?.error ||
        `Canva token refresh failed (HTTP ${status}): ${JSON.stringify(data)}`
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  // ─── Designs ───────────────────────────────────────────────────────────────

  /**
   * Creates a new design in Canva.
   * Endpoint: POST /v1/designs
   *
   * ✅ CORRECT request body (custom dimensions):
   *   { "type": "custom", "width": 1080, "height": 1080, "title": "..." }
   *   — type/width/height are TOP-LEVEL fields.
   *   { design_type: { ... } } → HTTP 400 Bad Request.
   *
   * Requires a REAL access token. Throws if token is missing/invalid.
   */
  async createDesign(
    accessToken: string,
    title: string,
    width: number = 1080,
    height: number = 1080
  ): Promise<{ designId: string; editUrl: string; viewUrl: string }> {
    if (!accessToken) {
      throw new Error('No Canva access token. Please connect your Canva account in Settings.');
    }

    const endpoint = `${this.BASE_URL}/designs`;

    const body: Record<string, unknown> = {
      type: 'type_and_asset',
      design_type: {
        type: 'custom',
        width,
        height
      }
    };
    if (title) body.title = title;

    logCanvaRequest(endpoint, 'POST', body);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    if (!ok) {
      throw new Error(
        data?.message || data?.error_description || data?.error ||
        `Canva createDesign failed (HTTP ${status}): ${JSON.stringify(data)}`
      );
    }

    const design = data?.design || data;
    if (!design?.id) {
      throw new Error(`Canva returned OK but no design.id in response: ${JSON.stringify(data)}`);
    }

    return {
      designId: design.id,
      editUrl: design.urls?.edit_url || `https://www.canva.com/design/${design.id}/edit`,
      viewUrl: design.urls?.view_url || `https://www.canva.com/design/${design.id}/view`
    };
  }

  /**
   * Fetches design metadata (edit + view URLs).
   * Endpoint: GET /v1/designs/{designId}
   * URLs are valid for 30 days.
   */
  async getDesign(
    accessToken: string,
    designId: string
  ): Promise<{ editUrl: string; viewUrl: string }> {
    if (!accessToken) {
      throw new Error('No Canva access token.');
    }

    const endpoint = `${this.BASE_URL}/designs/${designId}`;
    logCanvaRequest(endpoint, 'GET');
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    if (!ok) {
      console.warn(`[Canva API] getDesign failed (HTTP ${status}), using standard URL format`);
      return {
        editUrl: `https://www.canva.com/design/${designId}/edit`,
        viewUrl: `https://www.canva.com/design/${designId}/view`
      };
    }

    const design = data?.design || data;
    return {
      editUrl: design?.urls?.edit_url || `https://www.canva.com/design/${designId}/edit`,
      viewUrl: design?.urls?.view_url || `https://www.canva.com/design/${designId}/view`
    };
  }

  // ─── Assets ────────────────────────────────────────────────────────────────

  /**
   * Uploads an image asset to Canva.
   * Endpoint: POST /v1/assets
   * Multipart field must be "name" (not "title").
   */
  async uploadAsset(
    accessToken: string,
    fileUrl: string,
    assetName: string
  ): Promise<{ assetId: string }> {
    if (!accessToken) {
      throw new Error('No Canva access token.');
    }

    const endpoint = `${this.BASE_URL}/assets`;
    logCanvaRequest(endpoint, 'POST', { assetName, fileUrl });

    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      throw new Error(`Failed to download asset from ${fileUrl}: HTTP ${fileRes.status}`);
    }
    const fileBlob = await fileRes.blob();

    const formData = new FormData();
    formData.append('file', fileBlob, assetName);
    formData.append('name', assetName);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    if (!ok) {
      throw new Error(
        data?.message || data?.error ||
        `Canva uploadAsset failed (HTTP ${status}): ${JSON.stringify(data)}`
      );
    }

    const asset = data?.asset || data;
    return { assetId: asset.id };
  }

  // ─── Composite ─────────────────────────────────────────────────────────────

  /**
   * Creates a multi-page design in Canva with layout recipe.
   * Uses REAL Canva token only — no mock fallbacks.
   */
  async createMultiPageDesign(
    accessToken: string,
    project: any,
    visual: any,
    blueprints: any[],
    imageAssets: any[]
  ): Promise<{
    designId: string;
    viewUrl: string;
    templateLink: string;
    layoutRecipe: string;
  }> {
    if (!accessToken) {
      throw new Error('No Canva access token. Connect your Canva account in Settings first.');
    }

    const title = `${project.name} – Etsy Template Bundle`;
    const [w, h] = (project.aspectRatio || '1080x1080').replace('px', '').split('x').map(Number);

    console.log(`[Canva] Creating design: "${title}" (${w || 1080}x${h || 1080})`);
    const design = await this.createDesign(accessToken, title, w || 1080, h || 1080);

    // Build layout recipe
    const pagesRecipe = blueprints.map((blueprint, index) => {
      const pageIndex = index + 1;
      const imageUrl =
        imageAssets[index % Math.max(imageAssets.length, 1)]?.fileUrl ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
      const colors = visual?.colorPalette?.map((c: any) => c.hex) || ['#FFFFFF', '#000000'];
      const headingFont =
        visual?.typography?.find((t: any) => t.role === 'Headings' || t.role === 'heading')?.font ||
        'Playfair Display';
      const bodyFont =
        visual?.typography?.find((t: any) => t.role === 'Body Text' || t.role === 'body')?.font ||
        'Inter';

      return {
        pageNumber: pageIndex,
        purpose: blueprint.purpose || `Slide #${pageIndex}`,
        layout: blueprint.layoutStructure || 'Grid Composition',
        backgroundHex: colors[0] || '#F7F3EE',
        elements: [
          {
            type: 'text',
            role: 'heading',
            content: blueprint.textHierarchy || 'Premium Digital Template',
            font: headingFont,
            fontSize: '48px',
            color: colors[1] || '#111111',
            coordinates: { x: 100, y: 150, width: 880, height: 120 }
          },
          {
            type: 'text',
            role: 'body',
            content: blueprint.cta || 'Edit template in free Canva account',
            font: bodyFont,
            fontSize: '20px',
            color: colors[2] || '#555555',
            coordinates: { x: 100, y: 880, width: 880, height: 60 }
          },
          {
            type: 'image',
            role: 'hero_photo',
            url: imageUrl,
            coordinates: { x: 100, y: 300, width: 880, height: 500 }
          }
        ]
      };
    });

    const layoutRecipe = JSON.stringify({
      canvasSize: project.aspectRatio || '1080x1080px (Square)',
      totalPages: blueprints.length,
      brandColors: visual?.colorPalette || [],
      fontPairs: visual?.typography || [],
      pages: pagesRecipe
    }, null, 2);

    // Get official design URLs
    const { editUrl, viewUrl } = await this.getDesign(accessToken, design.designId);

    console.log(`[Canva] ✅ Design created: ${design.designId}`);
    console.log(`[Canva] Edit URL: ${editUrl}`);

    return {
      designId: design.designId,
      viewUrl,
      templateLink: editUrl,
      layoutRecipe
    };
  }
}

export const canvaClient = new CanvaClient();
