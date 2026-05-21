import { NextRequest, NextResponse } from 'next/server';
import { indirmeSayisiArtir, tokenDogrula } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token parametresi eksik' }, { status: 400 });
    }

    // Verify limit again before recording increment
    const validation = await tokenDogrula(token);
    if (!validation.gecerli) {
      return NextResponse.json({ error: validation.hata }, { status: 403 });
    }

    await indirmeSayisiArtir(token);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Export Image Registry] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
