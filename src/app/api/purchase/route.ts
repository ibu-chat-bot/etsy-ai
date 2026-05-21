import { NextRequest, NextResponse } from 'next/server';
import { tokenOlustur } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const { templateId, purchaseId, buyerEmail } = await req.json();

    if (!templateId || !purchaseId) {
      return NextResponse.json(
        { error: 'Eksik parametreler (templateId, purchaseId)' },
        { status: 400 }
      );
    }

    const token = await tokenOlustur(templateId, purchaseId);
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    const editorLink = `${appUrl}/editor/${token}`;

    console.log(`[PURCHASE LOG] Token Generated: ${token} | Link: ${editorLink}`);

    // Fallback console simulated e-mail notification logging
    return NextResponse.json({
      success: true,
      token,
      editorLink,
      buyerEmail: buyerEmail || 'test-customer@etsyai.com',
      message: 'Satın alım sonrası tek kullanımlık düzenleme bağlantısı başarıyla üretildi'
    });
  } catch (err: any) {
    console.error('[Purchase Link Generation] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
