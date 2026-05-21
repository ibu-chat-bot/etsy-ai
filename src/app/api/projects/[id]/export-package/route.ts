import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const seo = await db.getSEOAssets(projectId);
    const canvaProject = await db.getCanvaProject(projectId);
    const assets = await db.getGeneratedAssets(projectId);

    const zip = new JSZip();

    // 1. Injecting listing meta copy deck
    const listingContent = `ETSY MARKETING & LISTING PACKAGE: ${project.name.toUpperCase()}

Title:
${seo?.title || ''}

Description:
${seo?.description || ''}

Keywords:
${seo?.keywords?.join(', ') || ''}

13 Search Tags:
${seo?.tags?.map((t, idx) => `${idx + 1}. ${t}`).join('\n') || ''}
`;
    zip.file('listing-details.txt', listingContent);

    // 2. Injecting Template share URLs
    const templateContent = `CANVA DIGITAL PRODUCT ACCESS:
    
Editable Link:
${canvaProject?.templateLink || 'https://www.canva.com/design/mock-link/remix'}

Preview Link:
${canvaProject?.previewLink || 'https://www.canva.com/design/mock-link/view'}
`;
    zip.file('template-links.txt', templateContent);

    // 3. Injecting deliverable instructions PDF
    const pdfAsset = assets.find((a) => a.assetType === 'pdf');
    if (pdfAsset) {
      try {
        const pdfPath = path.join(process.cwd(), 'public', pdfAsset.fileUrl);
        const pdfBuffer = await fs.readFile(pdfPath);
        zip.file('delivery-instructions.pdf', pdfBuffer);
      } catch (err) {
        console.warn('Could not bundle delivery PDF in ZIP:', err);
      }
    }

    // 4. Injecting preview mockup images
    const mockups = assets.filter((a) => a.assetType === 'mockup');
    for (let i = 0; i < mockups.length; i++) {
      try {
        const mockRes = await fetch(mockups[i].fileUrl);
        const mockBuffer = await mockRes.arrayBuffer();
        zip.file(`mockups/mockup-${i + 1}.jpg`, Buffer.from(mockBuffer));
      } catch (err) {
        console.error(`Failed to attach mockup ${i + 1} to ZIP bundle:`, err);
      }
    }

    // Generate JSZip nodebuffer stream
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Store inside public exports
    const exportDir = path.join(process.cwd(), 'public', 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const fileName = `etsy-package-${projectId}.zip`;
    const filePath = path.join(exportDir, fileName);
    await fs.writeFile(filePath, zipBuffer);

    const fileUrl = `/exports/${fileName}`;

    const asset = await db.saveGeneratedAsset({
      projectId,
      assetType: 'zip',
      fileUrl
    });

    return NextResponse.json({ success: true, fileUrl, asset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
