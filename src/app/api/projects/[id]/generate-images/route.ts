import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import { getOpenAIClient } from '@/lib/openai/client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const blueprints = await db.getContentBlueprints(projectId);
    const count = blueprints.length > 0 ? blueprints.length : (project.templateCount || 5);
    
    const client = await getOpenAIClient();
    const assets = [];

    // Let's iterate and generate a visual asset for each slide page
    for (let i = 1; i <= count; i++) {
      const blueprint = blueprints.find((b) => b.templateNumber === i);
      const purpose = blueprint?.purpose || 'Etsy social media templates';
      const prompt = `Premium professional digital product template, ecommerce placeholder graphic, commercial aesthetic, topic: ${purpose}`;

      let imageUrl = '';
      if (client) {
        try {
          const response = await client.images.generate({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024'
          });
          imageUrl = response.data?.[0]?.url || '';
        } catch (err) {
          console.warn('DALL-E 3 image builder failed, falling back to stock placeholder:', err);
        }
      }

      // Elegant high-end background fallbacks
      if (!imageUrl) {
        const stockPhotos = [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&auto=format&fit=crop&q=60'
        ];
        imageUrl = stockPhotos[i % stockPhotos.length];
      }

      const asset = await db.saveGeneratedAsset({
        projectId,
        assetType: 'image',
        fileUrl: imageUrl,
        promptUsed: prompt
      });
      assets.push(asset);
    }

    await db.updateProject(projectId, { status: 'visual_ready' });

    return NextResponse.json({ success: true, count: assets.length, assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
