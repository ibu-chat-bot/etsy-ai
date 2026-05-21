import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import { openaiClient } from '@/lib/openai/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.getProject(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { target } = body;

    if (!target) {
      return NextResponse.json({ error: 'Missing target to regenerate' }, { status: 400 });
    }

    // 1. REGENERATE STRATEGY
    if (target === 'strategy') {
      const strategyData = await openaiClient.generateMarketStrategy(
        project.name,
        project.niche,
        project.style,
        project.language
      );
      const saved = await db.savePromptOutput({
        projectId: id,
        promptType: 'idea_generator',
        content: JSON.stringify(strategyData)
      });
      return NextResponse.json({ success: true, target: 'strategy', data: saved });
    }

    // 2. REGENERATE SEO
    if (target === 'seo') {
      const seoData = await openaiClient.generateSEODetails(
        project.name,
        project.niche,
        project.style,
        project.name,
        project.language
      );
      const savedSEO = await db.saveSEOAssets({
        projectId: id,
        title: seoData.title,
        description: seoData.description,
        tags: seoData.tags || [],
        keywords: seoData.keywords || [],
        faq: seoData.faq || [],
        features: seoData.features || []
      });
      return NextResponse.json({ success: true, target: 'seo', data: savedSEO });
    }

    // 3. REGENERATE VISUAL SYSTEM
    if (target === 'visual') {
      const outputs = await db.getPromptOutputs(id);
      const strategyOutput = outputs.find((o) => o.promptType === 'idea_generator');
      const strategyText = strategyOutput ? strategyOutput.content : '';

      const visualData = await openaiClient.generateVisualDirection(
        project.name,
        project.niche,
        project.style,
        strategyText,
        project.language
      );
      const savedVisual = await db.saveVisualSystem({
        projectId: id,
        colorPalette: visualData.colorPalette || [],
        typography: visualData.typography || [],
        designDirection: visualData.visualMood || '',
        layoutRules: [
          `Visual Mood: ${visualData.visualMood}`,
          `Composition Style: ${visualData.compositionStyle}`,
          `Design Language: ${visualData.designLanguage}`,
          `CTA Style: ${visualData.ctaStyle}`,
          `Spacing System: ${visualData.spacingSystem}`
        ]
      });
      return NextResponse.json({ success: true, target: 'visual', data: savedVisual });
    }

    // 4. REGENERATE BLUEPRINTS
    if (target === 'blueprints') {
      const visual = await db.getVisualSystem(id);
      const visualContext = visual ? visual.designDirection : project.style;

      const blueprintsData = await openaiClient.generateContentBlueprints(
        project.name,
        project.niche,
        project.style,
        visualContext,
        project.templateCount,
        project.language
      );
      const savedBlueprints = await db.saveContentBlueprints(id, blueprintsData);
      return NextResponse.json({ success: true, target: 'blueprints', data: savedBlueprints });
    }

    // 5. REGENERATE LAYOUT PLANNER
    if (target === 'layout_planner') {
      const blueprints = await db.getContentBlueprints(id);
      const layoutData = await openaiClient.generateLayoutPlanner(
        project.name,
        project.niche,
        project.style,
        blueprints,
        project.language
      );
      const saved = await db.savePromptOutput({
        projectId: id,
        promptType: 'layout_planner',
        content: JSON.stringify(layoutData)
      });
      return NextResponse.json({ success: true, target: 'layout_planner', data: saved });
    }

    // 6. REGENERATE IMAGE PROMPTS
    if (target === 'image_prompts') {
      const visual = await db.getVisualSystem(id);
      const blueprints = await db.getContentBlueprints(id);
      const visualContext = visual 
        ? `Typography: ${JSON.stringify(visual.typography)}. Design directions: ${visual.designDirection}` 
        : project.style;
      const promptsData = await openaiClient.generateImagePrompts(
        project.name,
        project.niche,
        project.style,
        visualContext,
        blueprints,
        project.language
      );
      const saved = await db.savePromptOutput({
        projectId: id,
        promptType: 'image_prompts',
        content: JSON.stringify(promptsData)
      });
      return NextResponse.json({ success: true, target: 'image_prompts', data: saved });
    }

    // 7. REGENERATE MOCKUP PROMPTS
    if (target === 'mockup_prompts') {
      const promptsData = await openaiClient.generateMockupPrompts(
        project.name,
        project.niche,
        project.style,
        project.language
      );
      const saved = await db.savePromptOutput({
        projectId: id,
        promptType: 'mockup_prompts',
        content: JSON.stringify({ prompts: promptsData })
      });
      return NextResponse.json({ success: true, target: 'mockup_prompts', data: saved });
    }

    // 8. REGENERATE PRODUCT COPY
    if (target === 'copy') {
      const copyData = await openaiClient.generateListingCopy(
        project.name,
        project.niche,
        project.style,
        project.language
      );
      const saved = await db.savePromptOutput({
        projectId: id,
        promptType: 'product_copy',
        content: JSON.stringify(copyData)
      });
      return NextResponse.json({ success: true, target: 'copy', data: saved });
    }

    // 9. REGENERATE BRANDING
    if (target === 'branding') {
      const brandingData = await openaiClient.generateShopBranding(
        project.name,
        project.niche,
        project.style,
        project.language
      );
      const saved = await db.savePromptOutput({
        projectId: id,
        promptType: 'shop_branding',
        content: JSON.stringify(brandingData)
      });
      return NextResponse.json({ success: true, target: 'branding', data: saved });
    }

    return NextResponse.json({ error: 'Invalid target parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Regeneration failed' },
      { status: 500 }
    );
  }
}
