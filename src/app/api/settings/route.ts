import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

// GET: Return current settings
export async function GET() {
  try {
    const settings = await db.getSettings();
    
    // Mask OpenAI key for client-side safety, but tell if it is configured
    const hasKey = !!settings.openaiApiKey;
    const maskedKey = settings.openaiApiKey
      ? `sk-...${settings.openaiApiKey.slice(-4)}`
      : '';

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        openaiApiKey: maskedKey, // send only masked key
        canvaClientSecret: settings.canvaClientSecret ? `secret-...${settings.canvaClientSecret.slice(-4)}` : ''
      },
      hasOpenAIKey: hasKey,
      isSupabase: db.isSupabase()
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

    // Load active settings to compare
    const currentSettings = await db.getSettings();

    // Prepare updates
    const updates: any = {};
    
    // Only update OpenAI key if it is not the masked key and not empty
    if (openaiApiKey && !openaiApiKey.startsWith('sk-...')) {
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

    if (canvaClientId !== undefined) {
      updates.canvaClientId = canvaClientId;
    }

    if (canvaClientSecret !== undefined) {
      if (canvaClientSecret && !canvaClientSecret.startsWith('secret-...')) {
        updates.canvaClientSecret = canvaClientSecret;
      } else if (canvaClientSecret === '') {
        updates.canvaClientSecret = '';
      }
    }

    if (canvaRedirectUri !== undefined) {
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
      isSupabase: db.isSupabase()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
