import { NextRequest, NextResponse } from 'next/server';
import { tokenDogrula } from '@/lib/tokens';
import { db } from '@/lib/db/provider';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ gecerli: false, hata: 'Token eksik' }, { status: 400 });
    }

    const sonuc = await tokenDogrula(token);
    if (!sonuc.gecerli) {
      return NextResponse.json({ gecerli: false, hata: sonuc.hata }, { status: 403 });
    }

    // Retrieve database details to fetch current download count
    const tokenObj = await db.getEditorToken(token);

    return NextResponse.json({
      gecerli: true,
      templateId: sonuc.templateId,
      downloadCount: tokenObj?.downloadCount || 0
    });
  } catch (err: any) {
    console.error('[Validate Token] Error:', err.message);
    return NextResponse.json({ gecerli: false, hata: err.message }, { status: 500 });
  }
}
