import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import { storageProvider } from '@/lib/storage/provider';

// GET: Fetch project aggregate details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch related aggregate tables
    const seo = await db.getSEOAssets(id);
    const visual = await db.getVisualSystem(id);
    const blueprints = await db.getContentBlueprints(id);
    const promptOutputs = await db.getPromptOutputs(id);
    const canvaProject = await db.getCanvaProject(id);
    const generatedAssets = await db.getGeneratedAssets(id);

    return NextResponse.json({
      success: true,
      project,
      seo,
      visual,
      blueprints,
      promptOutputs,
      canvaProject,
      generatedAssets
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}

// DELETE: Delete project and clean up file assets
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Clean up local or cloud storage first
    await storageProvider.deleteProjectAssets(id);

    // Delete database tables
    const deleted = await db.deleteProject(id);

    return NextResponse.json({
      success: true,
      deleted
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
