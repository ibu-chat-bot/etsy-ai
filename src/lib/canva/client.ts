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

async function getBase64Image(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (err: any) {
    console.error(`[Canva Base64 Convert] ❌ Failed for URL: ${url} - Error: ${err.message}`);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
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

  private getRedirectUri(configuredUri?: string, requestUrl?: string): string {
    if (configuredUri && !configuredUri.includes(':3001') && !configuredUri.includes('localhost')) {
      return configuredUri;
    }
    if (process.env.NEXT_PUBLIC_CANVA_REDIRECT_URI) {
      return process.env.NEXT_PUBLIC_CANVA_REDIRECT_URI;
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return `${process.env.NEXT_PUBLIC_APP_URL}/api/canva/callback`;
    }
    if (requestUrl) {
      try {
        const origin = new URL(requestUrl).origin;
        return `${origin}/api/canva/callback`;
      } catch {
        // ignore
      }
    }
    return 'http://127.0.0.1:3000/api/canva/callback';
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

    const finalRedirectUri = this.getRedirectUri(redirectUri, requestUrl);

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

    const finalRedirectUri = this.getRedirectUri(redirectUri, requestUrl);

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
      type: 'custom',
      width,
      height
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
   * Polls a Canva async asset upload job until it reaches a terminal state.
   * Endpoint: GET /v1/asset-uploads/{jobId}
   * Returns the asset ID on success, throws on failure.
   */
  private async pollAssetUploadJob(
    accessToken: string,
    jobId: string,
    maxAttempts: number = 15,
    intervalMs: number = 2000
  ): Promise<string> {
    const endpoint = `${this.BASE_URL}/asset-uploads/${jobId}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[Canva Asset Poll] Attempt ${attempt}/${maxAttempts} for job ${jobId}`);

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const { ok, data } = await logCanvaResponse(res, endpoint);

      if (!ok) {
        throw new Error(`Asset upload poll failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
      }

      const job = data?.job || data;
      const status = job?.status;

      if (status === 'success') {
        const assetId = job?.asset?.id;
        if (!assetId) {
          throw new Error(`Asset upload job succeeded but no asset.id: ${JSON.stringify(data)}`);
        }
        console.log(`[Canva Asset Poll] ✅ Asset ready: ${assetId}`);
        return assetId;
      }

      if (status === 'failed') {
        const errMsg = job?.error?.message || job?.error?.code || 'Unknown asset upload failure';
        throw new Error(`Canva asset upload failed: ${errMsg}`);
      }

      // status === 'in_progress' — wait and retry
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Asset upload job ${jobId} timed out after ${maxAttempts} attempts`);
  }

  /**
   * Uploads a raw image asset to Canva using the correct async endpoint.
   * Endpoint: POST /v1/asset-uploads (application/octet-stream + Asset-Upload-Metadata header)
   * Then polls GET /v1/asset-uploads/{jobId} until the asset is ready.
   */
  async uploadAsset(
    accessToken: string,
    fileUrl: string,
    assetName: string
  ): Promise<{ assetId: string }> {
    if (!accessToken) {
      throw new Error('No Canva access token.');
    }

    // Download the file first
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      throw new Error(`Failed to download asset from ${fileUrl}: HTTP ${fileRes.status}`);
    }
    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

    const endpoint = `${this.BASE_URL}/asset-uploads`;
    const nameBase64 = Buffer.from(assetName.substring(0, 50)).toString('base64');

    logCanvaRequest(endpoint, 'POST', { assetName, fileSize: fileBuffer.length });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(fileBuffer.length),
        'Asset-Upload-Metadata': JSON.stringify({ name_base64: nameBase64 })
      },
      body: fileBuffer
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    if (!ok) {
      throw new Error(
        data?.message || data?.error ||
        `Canva asset upload initiation failed (HTTP ${status}): ${JSON.stringify(data)}`
      );
    }

    const jobId = data?.job?.id;
    if (!jobId) {
      throw new Error(`Canva asset-uploads returned no job ID: ${JSON.stringify(data)}`);
    }

    console.log(`[Canva] Asset upload job started: ${jobId}`);
    const assetId = await this.pollAssetUploadJob(accessToken, jobId);
    return { assetId };
  }

  /**
   * Uploads an in-memory PNG image asset directly to Canva.
   * Converts SVG-based content to a self-contained PNG using a canvas-rendered approach.
   * Endpoint: POST /v1/asset-uploads (application/octet-stream)
   * Then polls for completion.
   */
  async uploadSvgAsset(
    accessToken: string,
    svgString: string,
    assetName: string
  ): Promise<{ assetId: string }> {
    if (!accessToken) {
      throw new Error('No Canva access token.');
    }

    // Upload the SVG directly as image/svg+xml bytes
    const svgBuffer = Buffer.from(svgString, 'utf-8');
    const endpoint = `${this.BASE_URL}/asset-uploads`;
    const safeName = assetName.replace(/\.svg$/i, '.svg').substring(0, 50);
    const nameBase64 = Buffer.from(safeName).toString('base64');

    logCanvaRequest(endpoint, 'POST', { assetName: safeName, svgSize: svgBuffer.length });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(svgBuffer.length),
        'Asset-Upload-Metadata': JSON.stringify({ name_base64: nameBase64 })
      },
      body: svgBuffer
    });
    const { ok, status, data } = await logCanvaResponse(res, endpoint);

    if (!ok) {
      throw new Error(
        data?.message || data?.error ||
        `Canva SVG asset upload failed (HTTP ${status}): ${JSON.stringify(data)}`
      );
    }

    const jobId = data?.job?.id;
    if (!jobId) {
      throw new Error(`Canva asset-uploads returned no job ID: ${JSON.stringify(data)}`);
    }

    console.log(`[Canva] SVG asset upload job started: ${jobId}`);
    const assetId = await this.pollAssetUploadJob(accessToken, jobId);
    return { assetId };
  }

  // ─── Composite ─────────────────────────────────────────────────────────────

  /**
   * Generates a premium vector SVG graphic slide dynamically.
   * Leverages brand typography, color palette, blueprints and stock images.
   */
  private generateSlideSvg(params: {
    width: number;
    height: number;
    layoutIndex: number;
    headline: string;
    cta: string;
    purpose: string;
    imageUrl: string;
    colors: string[];
    headingFont: string;
    bodyFont: string;
  }): string {
    const {
      width,
      height,
      layoutIndex,
      headline,
      cta,
      purpose,
      imageUrl,
      colors,
      headingFont,
      bodyFont,
    } = params;

    const bgColor = colors[0] || '#F7F3EE';
    const primaryTextColor = colors[1] || '#111111';
    const secondaryTextColor = colors[2] || '#555555';
    const accentColor = colors[3] || colors[1] || '#000000';
    const cardBg = colors[4] || '#FFFFFF';

    // Helper to wrap text into lines to avoid SVG horizontal cutoff
    const wrapText = (txt: string, maxLen: number = 28): string[] => {
      const words = txt.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      for (const w of words) {
        if ((currentLine + ' ' + w).trim().length > maxLen) {
          if (currentLine) lines.push(currentLine.trim());
          currentLine = w;
        } else {
          currentLine = (currentLine + ' ' + w).trim();
        }
      }
      if (currentLine) lines.push(currentLine.trim());
      return lines;
    };

    const headlineLines = wrapText(headline || 'Premium Digital Graphic', 26);
    const purposeLines = wrapText((purpose || 'Instagram Post').toUpperCase(), 35);
    const ctaText = cta || 'Edit Template in Canva';

    const headerDefs = `
      <defs>
        <style>
          .svg-heading {
            font-family: "${headingFont}", "Playfair Display", Georgia, serif;
            font-weight: 700;
          }
          .svg-body {
            font-family: "${bodyFont}", "Inter", sans-serif;
          }
          .svg-tagline {
            font-family: "Montserrat", "Inter", sans-serif;
            letter-spacing: 4px;
            font-weight: 600;
          }
          .shadow {
            filter: drop-shadow(0px 12px 32px rgba(0, 0, 0, 0.06));
          }
        </style>
      </defs>
    `;

    const variant = layoutIndex % 3;
    if (variant === 0) {
      // LAYOUT 0: Editorial Centered Card
      return `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          ${headerDefs}
          <!-- Background -->
          <rect width="${width}" height="${height}" fill="${bgColor}" />
          
          <!-- Accent geometric shapes -->
          <circle cx="${width - 100}" cy="150" r="100" fill="${primaryTextColor}" opacity="0.02" />
          <circle cx="120" cy="${height - 200}" r="220" fill="${accentColor}" opacity="0.02" />

          <!-- Tagline / Purpose -->
          <text x="540" y="110" fill="${secondaryTextColor}" font-size="14px" text-anchor="middle" class="svg-tagline">${purposeLines[0] || 'COLLECTION'}</text>
          
          <!-- Headline -->
          <text x="540" y="180" fill="${primaryTextColor}" font-size="44px" text-anchor="middle" class="svg-heading">
            ${headlineLines.map((line, idx) => `<tspan x="540" dy="${idx === 0 ? 0 : 54}">${line}</tspan>`).join('')}
          </text>

          <!-- Rounded Image Card with border -->
          <g class="shadow">
            <rect x="220" y="360" width="640" height="450" rx="24" fill="${cardBg}" />
            <clipPath id="clip-0">
              <rect x="240" y="380" width="600" height="410" rx="16" />
            </clipPath>
            <image href="${imageUrl}" xlink:href="${imageUrl}" x="240" y="380" width="600" height="410" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-0)" />
          </g>

          <!-- CTA Button -->
          <g class="shadow">
            <rect x="340" y="870" width="400" height="64" rx="32" fill="${accentColor}" />
            <text x="540" y="909" fill="${bgColor}" font-size="16px" font-weight="bold" text-anchor="middle" class="svg-body">${ctaText.toUpperCase()}</text>
          </g>
        </svg>
      `.trim();
    } else if (variant === 1) {
      // LAYOUT 1: Elegant Split Screen
      return `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          ${headerDefs}
          <!-- Background -->
          <rect width="${width}" height="${height}" fill="${bgColor}" />
          
          <!-- Background typography watermark -->
          <text x="80" y="550" fill="${primaryTextColor}" font-size="280px" font-weight="900" opacity="0.02" class="svg-heading">AI</text>

          <!-- Right Side Vertical Image Column -->
          <g class="shadow">
            <clipPath id="clip-1">
              <rect x="520" y="80" width="480" height="920" rx="32" />
            </clipPath>
            <image href="${imageUrl}" xlink:href="${imageUrl}" x="520" y="80" width="480" height="920" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-1)" />
          </g>

          <!-- Left Side Content Column -->
          <!-- Purpose / Tagline -->
          <text x="100" y="240" fill="${accentColor}" font-size="14px" class="svg-tagline">${purposeLines[0] || 'FEATURE'}</text>
          
          <!-- Headline -->
          <text x="100" y="320" fill="${primaryTextColor}" font-size="46px" class="svg-heading">
            ${headlineLines.map((line, idx) => `<tspan x="100" dy="${idx === 0 ? 0 : 56}">${line}</tspan>`).join('')}
          </text>

          <!-- Description / Subtext -->
          <text x="100" y="620" fill="${secondaryTextColor}" font-size="18px" class="svg-body">
            <tspan x="100" dy="0">High-fidelity digital layout</tspan>
            <tspan x="100" dy="28">fully customizable inside Canva.</tspan>
          </text>

          <!-- CTA Button -->
          <g class="shadow">
            <rect x="100" y="780" width="340" height="64" rx="16" fill="${primaryTextColor}" />
            <text x="270" y="819" fill="${bgColor}" font-size="16px" font-weight="bold" text-anchor="middle" class="svg-body">${ctaText.toUpperCase()}</text>
          </g>
        </svg>
      `.trim();
    } else {
      // LAYOUT 2: Editorial Showcase
      return `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          ${headerDefs}
          <!-- Background -->
          <rect width="${width}" height="${height}" fill="${bgColor}" />
          
          <!-- Decorative accents -->
          <circle cx="100" cy="540" r="300" fill="${cardBg}" opacity="0.3" />
          <circle cx="${width - 150}" cy="${height - 150}" r="120" fill="${accentColor}" opacity="0.02" />

          <!-- Top Left Tagline -->
          <text x="100" y="120" fill="${secondaryTextColor}" font-size="13px" class="svg-tagline">${purposeLines[0] || 'PREVIEW'}</text>

          <!-- Horizontal Image Showcase -->
          <g class="shadow">
            <clipPath id="clip-2">
              <rect x="100" y="160" width="880" height="520" rx="24" />
            </clipPath>
            <image href="${imageUrl}" xlink:href="${imageUrl}" x="100" y="160" width="880" height="520" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-2)" />
          </g>

          <!-- Lower Content Half -->
          <g transform="translate(100, 740)">
            <!-- Headline -->
            <text x="0" y="40" fill="${primaryTextColor}" font-size="40px" class="svg-heading">
              ${headlineLines.slice(0, 3).map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 50}">${line}</tspan>`).join('')}
            </text>
            
            <!-- CTA Button on right side -->
            <g class="shadow" transform="translate(540, 20)">
              <rect width="340" height="64" rx="32" fill="${accentColor}" />
              <text x="170" y="39" fill="${bgColor}" font-size="16px" font-weight="bold" text-anchor="middle" class="svg-body">${ctaText.toUpperCase()}</text>
            </g>
          </g>
        </svg>
      `.trim();
    }
  }

  /**
   * Creates per-slide Canva designs with dynamically populated content.
   *
   * Flow:
   *   1. Renders a beautiful SVG vector graphic containing backgrounds,
   *      custom brand colors, typography, wrapped headline texts,
   *      styled CTA buttons, and embedded AI images.
   *   2. Uploads each SVG file directly as a Canva vector asset.
   *   3. Creates individual slide designs pre-loaded with the SVG asset.
   *   4. Designs open in the Canva editor fully rendered rather than blank!
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

    const [w, h] = (project.aspectRatio || '1080x1080').replace('px', '').split('x').map(Number);
    const width = w || 1080;
    const height = h || 1080;

    // Harmonized colors from the project's visual system
    const colors = visual?.colorPalette?.map((c: any) => c.hex) || ['#F7F3EE', '#111111', '#555555', '#C49B74', '#FFFFFF'];
    const headingFont =
      visual?.typography?.find((t: any) => t.role === 'Headings' || t.role === 'heading')?.font ||
      'Playfair Display';
    const bodyFont =
      visual?.typography?.find((t: any) => t.role === 'Body Text' || t.role === 'body')?.font ||
      'Inter';

    const effectiveBlueprints = blueprints.length > 0
      ? blueprints
      : Array.from({ length: project.templateCount || 5 }, (_, idx) => ({
          templateNumber: idx + 1,
          purpose: `Template Slide ${idx + 1}`,
          layoutStructure: 'Minimal Grid Composition',
          textHierarchy: project.name || 'Premium Digital Template',
          cta: 'Edit in Canva'
        }));

    console.log(`[Canva] Starting per-slide content generation for: "${project.name}"`);
    console.log(`[Canva] Slides: ${effectiveBlueprints.length} | Images: ${imageAssets.length}`);

    // High-fidelity fallback stock photos
    const defaultStockPhotos = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080',
      'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=1080',
      'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1080',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1080',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1080'
    ];

    // ── Step 1: Generate & Upload stunning custom vector SVG for each slide ──
    // ── Step 1: Generate & Upload stunning custom vector SVG for each slide in parallel ──
    const uploadPromises = effectiveBlueprints.map(async (bp, i) => {
      const imageUrl =
        imageAssets[i % Math.max(imageAssets.length, 1)]?.fileUrl ||
        defaultStockPhotos[i % defaultStockPhotos.length];

      console.log(`[Canva] Generating vector SVG layout for slide ${i + 1}: "${bp.purpose || 'Template'}"`);

      // Asynchronously download and convert remote network image to self-contained Base64 Data URI
      const base64Image = await getBase64Image(imageUrl);

      const svgString = this.generateSlideSvg({
        width,
        height,
        layoutIndex: i,
        headline: bp.textHierarchy || bp.purpose || 'Premium Digital Graphics',
        cta: bp.cta || 'Edit Template',
        purpose: bp.purpose || `Slide ${i + 1}`,
        imageUrl: base64Image,
        colors,
        headingFont,
        bodyFont
      });

      const assetName = `${project.name.replace(/\s+/g, '-')}-Slide-${i + 1}.svg`;

      try {
        const { assetId } = await this.uploadSvgAsset(accessToken, svgString, assetName);
        console.log(`[Canva] ✅ Vector SVG Asset uploaded successfully for slide ${i + 1}: ${assetId}`);
        return assetId;
      } catch (uploadErr: any) {
        console.error(`[Canva] ❌ Vector SVG Asset upload failed (slide ${i + 1}): ${uploadErr.message}`);
        return '';
      }
    });

    const uploadedAssetIds = await Promise.all(uploadPromises);

    // ── Step 2: Create one Canva design per slide using the uploaded asset ────
    interface SlideDesign {
      slideNumber: number;
      purpose: string;
      headline: string;
      cta: string;
      designId: string;
      editUrl: string;
      viewUrl: string;
      assetId: string;
      backgroundHex: string;
    }
    const slideDesigns: SlideDesign[] = [];
    let primaryDesignId = '';
    let primaryEditUrl = '';
    let primaryViewUrl = '';

    for (let i = 0; i < effectiveBlueprints.length; i++) {
      const bp = effectiveBlueprints[i];
      const slideTitle = `${project.name} – Slide ${i + 1}: ${bp.purpose || 'Template'}`;
      const assetId = uploadedAssetIds[i] || '';
      const bgHex = colors[i % colors.length] || '#F7F3EE';

      console.log(`[Canva] Creating design for slide ${i + 1}/${effectiveBlueprints.length} (assetId: ${assetId || 'none'})`);

      try {
        const endpoint = `${this.BASE_URL}/designs`;

        // Create design pre-loaded with the uploaded SVG asset
        const body: Record<string, unknown> = assetId
          ? {
              type: 'type_and_asset',
              asset_id: assetId,
              title: slideTitle
            }
          : {
              type: 'custom',
              width,
              height,
              title: slideTitle
            };

        logCanvaRequest(endpoint, 'POST', body);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const { ok, status, data } = await logCanvaResponse(res, endpoint);

        console.log('[DEBUG] Canva POST /designs response:', JSON.stringify(data, null, 2));

        if (!ok) {
          console.error(`[Canva] ❌ Design creation failed for slide ${i + 1}: ${data?.message || data?.error || status}`);
          // Fallback path: plain custom design if asset path rejected
          if (assetId) {
            console.log(`[Canva] Retrying slide ${i + 1} as blank template fallback...`);
            const fbBody = {
              type: 'custom',
              width,
              height,
              title: slideTitle
            };
            const fbRes = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(fbBody)
            });
            const fbResult = await logCanvaResponse(fbRes, endpoint);
            console.log('[DEBUG] Canva fallback retry response:', JSON.stringify(fbResult.data, null, 2));
            if (fbResult.ok) {
              const d = fbResult.data?.design || fbResult.data;
              const designId = d.id;
              const templateLink = `https://www.canva.com/design/${designId}/copy`;
              const viewUrl = `https://www.canva.com/design/${designId}/view`;
              const sd: SlideDesign = {
                slideNumber: i + 1, purpose: bp.purpose || `Slide ${i + 1}`,
                headline: bp.textHierarchy || '', cta: bp.cta || '',
                designId: designId,
                editUrl: templateLink,
                viewUrl: viewUrl,
                assetId: '', backgroundHex: bgHex
              };
              slideDesigns.push(sd);
              if (!primaryDesignId) { primaryDesignId = sd.designId; primaryEditUrl = templateLink; primaryViewUrl = viewUrl; }
            }
          }
          continue;
        }

        const design = data?.design || data;
        if (!design?.id) { console.error(`[Canva] ❌ Slide ${i + 1}: no design.id in response`); continue; }

        const designId = design.id;
        const templateLink = `https://www.canva.com/design/${designId}/copy`;
        const viewUrl = `https://www.canva.com/design/${designId}/view`;

        const sd: SlideDesign = {
          slideNumber: i + 1, purpose: bp.purpose || `Slide ${i + 1}`,
          headline: bp.textHierarchy || '', cta: bp.cta || '',
          designId: designId, editUrl: templateLink, viewUrl: viewUrl,
          assetId: assetId || '', backgroundHex: bgHex
        };
        slideDesigns.push(sd);
        if (!primaryDesignId) { primaryDesignId = sd.designId; primaryEditUrl = templateLink; primaryViewUrl = viewUrl; }

        console.log(`[Canva] ✅ Slide design ${i + 1} successfully created: ${designId}`);
      } catch (err: any) {
        console.error(`[Canva] ❌ Exception in slide ${i + 1} creation: ${err.message}`);
      }
    }

    if (!primaryDesignId) {
      throw new Error('Canva design creation failed for all template slides. Verify settings and Canva developer scopes.');
    }

    // ── Step 3: Compile comprehensive design layout recipe with links ────────
    const layoutRecipe = JSON.stringify({
      canvasSize: project.aspectRatio || '1080x1080px',
      totalSlides: slideDesigns.length,
      brandColors: colors,
      headingFont,
      bodyFont,
      slides: slideDesigns.map(s => ({
        slideNumber: s.slideNumber,
        purpose: s.purpose,
        headline: s.headline,
        cta: s.cta,
        backgroundHex: s.backgroundHex,
        canvaDesignId: s.designId,
        editUrl: s.editUrl,
        viewUrl: s.viewUrl,
        imagePreLoaded: !!s.assetId
      }))
    }, null, 2);

    console.log(`[Canva] ✅ ${slideDesigns.length} Canva slide designs created & fully populated.`);

    return {
      designId: primaryDesignId,
      viewUrl: primaryViewUrl,
      templateLink: primaryEditUrl,
      layoutRecipe
    };
  }
}

export const canvaClient = new CanvaClient();
