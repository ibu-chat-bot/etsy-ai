import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const mockups = [
      { type: 'Phone Screen Showcase', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60' },
      { type: 'MacBook Pro Frame', url: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=800&auto=format&fit=crop&q=60' },
      { type: 'Boutique Desk Flatlay', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=60' }
    ];

    const saved = [];
    for (const mock of mockups) {
      const asset = await db.saveGeneratedAsset({
        projectId,
        assetType: 'mockup',
        fileUrl: mock.url,
        promptUsed: `Etsy listing mockup display for ${mock.type}`
      });
      saved.push(asset);
    }

    return NextResponse.json({ success: true, count: saved.length, mockups: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
