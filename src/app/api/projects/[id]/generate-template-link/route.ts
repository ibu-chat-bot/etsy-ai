import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const canvaProject = await db.getCanvaProject(projectId);
    if (!canvaProject) {
      return NextResponse.json({ error: 'Canva design not built yet' }, { status: 404 });
    }
    return NextResponse.json({ templateLink: canvaProject.templateLink });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
