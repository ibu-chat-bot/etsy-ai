import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import { canvaClient } from '@/lib/canva/client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Require a real Canva connection — no mock fallback
    const conn = await db.getCanvaConnection('admin-id');
    if (!conn) {
      return NextResponse.json({
        error: 'Canva account not connected. Please connect your Canva account in Settings first.',
        hint: 'Go to Settings → Canva Connect → click "Connect Canva Account"'
      }, { status: 400 });
    }

    let token = conn.accessToken;

    // Detect and reject mock tokens
    if (token.startsWith('mock_')) {
      return NextResponse.json({
        error: 'Canva is running in sandbox/mock mode. Your token is not a real OAuth token.',
        hint: 'Disconnect and re-connect your Canva account. Ensure your Client ID, Secret, and Redirect URI are correctly configured in Settings.',
        tokenType: 'mock_sandbox',
        tokenPreview: token.substring(0, 20) + '...'
      }, { status: 400 });
    }

    console.log(`[Build Canva] Starting build for project: ${projectId} (${project.name})`);
    console.log(`[Build Canva] Token type: REAL — preview: ${token.substring(0, 20)}...`);

    // Attempt token refresh if refresh token available
    if (conn.refreshToken && !conn.refreshToken.startsWith('mock_')) {
      try {
        const refreshed = await canvaClient.refreshTokens(conn.refreshToken);
        token = refreshed.accessToken;
        await db.saveCanvaConnection({
          userId: 'admin-id',
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          workspaceId: conn.workspaceId || ''
        });
        console.log('[Build Canva] Token refreshed successfully.');
      } catch (refreshErr: any) {
        console.warn('[Build Canva] Token refresh failed, proceeding with existing token:', refreshErr.message);
      }
    }

    const visual = await db.getVisualSystem(projectId);
    const blueprints = await db.getContentBlueprints(projectId);
    const assets = await db.getGeneratedAssets(projectId);
    const imageAssets = assets.filter((a) => a.assetType === 'image');

    console.log(`[Build Canva] Blueprints: ${blueprints.length}, Image assets: ${imageAssets.length}`);

    // Upload image assets (non-fatal)
    for (let i = 0; i < imageAssets.length; i++) {
      try {
        const uploaded = await canvaClient.uploadAsset(
          token,
          imageAssets[i].fileUrl,
          `${project.name.replace(/\s+/g, '-')}-Slide-${i + 1}.png`
        );
        console.log(`[Build Canva] Uploaded asset ${i + 1}: ${uploaded.assetId}`);
      } catch (uploadErr: any) {
        console.error(`[Build Canva] Asset upload ${i + 1} failed (non-fatal):`, uploadErr.message);
      }
    }

    const effectiveBlueprints = blueprints.length > 0
      ? blueprints
      : Array.from({ length: project.templateCount || 5 }, (_, idx) => ({
          templateNumber: idx + 1,
          purpose: 'Etsy Social Media Graphic Slide',
          layoutStructure: 'Minimal Grid Composition',
          textHierarchy: 'Header Text Overlay',
          cta: 'Click to edit in Canva'
        }));

    const result = await canvaClient.createMultiPageDesign(
      token,
      project,
      visual,
      effectiveBlueprints,
      imageAssets
    );

    console.log(`[Build Canva] ✅ Real Canva design created: ${result.designId}`);
    console.log(`[Build Canva] Template link: ${result.templateLink}`);

    const canvaProject = await db.saveCanvaProject({
      projectId,
      canvaDesignId: result.designId,
      templateLink: result.templateLink,
      previewLink: result.viewUrl,
      layoutRecipe: result.layoutRecipe
    });

    await db.updateProject(projectId, { status: 'completed' });

    return NextResponse.json({
      success: true,
      canvaDesignId: result.designId,
      templateLink: result.templateLink,
      previewLink: result.viewUrl,
      tokenType: 'real',
      canvaProject
    });
  } catch (err: any) {
    console.error('[Build Canva] Fatal error:', err.message);
    return NextResponse.json({
      error: err.message,
      hint: 'Check server console for detailed Canva API request/response logs'
    }, { status: 500 });
  }
}
