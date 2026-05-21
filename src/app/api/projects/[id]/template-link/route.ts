import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const { templateLink } = await request.json();

    if (!templateLink || !templateLink.includes('canva.com/design')) {
      return NextResponse.json(
        { error: 'Geçersiz Canva şablon bağlantısı' },
        { status: 400 }
      );
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }

    // Get current Canva project record or create a fallback shell
    let currentCanvaProj = await db.getCanvaProject(projectId);
    const canvaDesignId = currentCanvaProj?.canvaDesignId || '';
    const previewLink = currentCanvaProj?.previewLink || `https://www.canva.com/design/${canvaDesignId}/view`;
    const layoutRecipe = currentCanvaProj?.layoutRecipe || '{}';

    // Update with newly input custom template link
    const updatedCanvaProj = await db.saveCanvaProject({
      projectId,
      canvaDesignId,
      templateLink,
      previewLink,
      layoutRecipe
    });

    // Generate stunning high-conversion default Etsy listing description block
    const slideCount = project.templateCount || 5;
    const etsyDescription = `
🎨 CANVA TEMPLATE — ELEVATE YOUR BRAND INSTANTLY

Elevate your professional digital presence with our meticulously styled Canva template pack! Fully customizable in just a few clicks.

📥 CLICK HERE TO DOWLOAD YOUR TEMPLATES:
${templateLink}

──────────────────────────────────────────

✨ WHAT IS INCLUDED IN THIS BUNDLE?
* Exactly ${slideCount} fully editable Instagram / social media layouts
* A curated, high-end visual color system
* Beautiful font pairings tailored for maximum readability
* Seamless drag-and-drop frame components for quick image changes

✨ WHY CHOOSE OUR CANVA TEMPLATES?
* 100% editable — change colors, shapes, text, backgrounds, and fonts in seconds
* Works with a completely FREE Canva account (No Pro subscription required!)
* Fully responsive layout grid systems designed by marketing strategists
* High-ticket, premium editorial look to wow your buyers

✨ HOW IT WORKS:
1. Make a purchase on Etsy
2. Access this digital file / PDF
3. Click the Canva Copy link above to load the template into your own workspace
4. Customize & export as PNG or JPEG in 3 seconds flat!

──────────────────────────────────────────
Designed by Etsy Canva Studio. All rights reserved.
`.trim();

    return NextResponse.json({
      success: true,
      templateLink,
      etsyDescription,
      canvaProject: updatedCanvaProj
    });
  } catch (err: any) {
    console.error('[Template Link Save] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
