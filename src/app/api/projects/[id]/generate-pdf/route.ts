import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import { pdfGenerator } from '@/lib/pdf/generator';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const settings = await db.getSettings();
    const canvaProject = await db.getCanvaProject(projectId);
    const canvaLink = canvaProject?.templateLink || 'https://www.canva.com/design/mock-link/remix';

    const pdfBuffer = await pdfGenerator.generateDeliveryPDF(
      project.name,
      settings.brandDefaults?.authorName || 'Etsy Canva Studio',
      settings.brandDefaults?.supportEmail || 'support@etsyai.com',
      canvaLink
    );

    // Save to public static exports folder
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    const fileName = `delivery-instructions-${projectId}.pdf`;
    const filePath = path.join(exportDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    const fileUrl = `/exports/${fileName}`;

    const asset = await db.saveGeneratedAsset({
      projectId,
      assetType: 'pdf',
      fileUrl
    });

    return NextResponse.json({ success: true, fileUrl, asset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
