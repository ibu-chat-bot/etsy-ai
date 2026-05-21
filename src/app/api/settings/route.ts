import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

// Whether each Canva credential is sourced from environment variables
const envFlags = {
  canvaClientId: !!process.env.CANVA_CLIENT_ID,
  canvaClientSecret: !!process.env.CANVA_CLIENT_SECRET,
  canvaRedirectUri: !!process.env.CANVA_REDIRECT_URI,
  openaiApiKey: !!process.env.OPENAI_API_KEY,
};

// GET: Return current settings
export async function GET() {
  try {
    const settings = await db.getSettings();

    // Mask secrets for client-side safety
    const hasKey = !!settings.openaiApiKey;
    const maskedKey = settings.openaiApiKey
      ? `sk-...${settings.openaiApiKey.slice(-4)}`
      : '';
    const maskedSecret = settings.canvaClientSecret
      ? `secret-...${settings.canvaClientSecret.slice(-4)}`
      : '';

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        openaiApiKey: maskedKey,
        canvaClientSecret: maskedSecret
      },
      hasOpenAIKey: hasKey,
      isSupabase: db.isSupabase(),
      // Tell the frontend which fields are locked (env-configured)
      envConfigured: envFlags
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST: Save updated settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { openaiApiKey, defaultLanguage, brandDefaults, canvaClientId, canvaClientSecret, canvaRedirectUri } = body;

    const currentSettings = await db.getSettings();
    const updates: any = {};

    // Only update OpenAI key if not masked and not provided via env
    if (!envFlags.openaiApiKey && openaiApiKey && !openaiApiKey.startsWith('sk-...')) {
      updates.openaiApiKey = openaiApiKey;
    }

    if (defaultLanguage) {
      updates.defaultLanguage = defaultLanguage;
    }

    if (brandDefaults) {
      updates.brandDefaults = {
        ...currentSettings.brandDefaults,
        ...brandDefaults
      };
    }

    // Only allow saving Canva credentials if they are NOT coming from env vars
    if (!envFlags.canvaClientId && canvaClientId !== undefined) {
      updates.canvaClientId = canvaClientId;
    }

    if (!envFlags.canvaClientSecret && canvaClientSecret !== undefined) {
      if (canvaClientSecret && !canvaClientSecret.startsWith('secret-...')) {
        updates.canvaClientSecret = canvaClientSecret;
      } else if (canvaClientSecret === '') {
        updates.canvaClientSecret = '';
      }
    }

    if (!envFlags.canvaRedirectUri && canvaRedirectUri !== undefined) {
      updates.canvaRedirectUri = canvaRedirectUri;
    }

    const updated = await db.saveSettings(updates);

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        openaiApiKey: updated.openaiApiKey ? `sk-...${updated.openaiApiKey.slice(-4)}` : '',
        canvaClientSecret: updated.canvaClientSecret ? `secret-...${updated.canvaClientSecret.slice(-4)}` : ''
      },
      hasOpenAIKey: !!updated.openaiApiKey,
      isSupabase: db.isSupabase(),
      envConfigured: envFlags
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
