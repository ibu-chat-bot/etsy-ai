import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID parametresi eksik' }, { status: 400 });
  }

  try {
    const templatesDir = path.join(process.cwd(), 'src', 'lib', 'templates');
    const filePath = path.join(templatesDir, `${id}.json`);

    const data = await fs.readFile(filePath, 'utf-8');
    const template = JSON.parse(data);

    return NextResponse.json(template);
  } catch (err: any) {
    console.error('[Load Template] Error:', err.message);
    
    // Fallback gracefully to default beauty-promo template
    try {
      const fallbackPath = path.join(process.cwd(), 'src', 'lib', 'templates', 'beauty-promo.json');
      const data = await fs.readFile(fallbackPath, 'utf-8');
      const template = JSON.parse(data);
      return NextResponse.json(template);
    } catch {
      return NextResponse.json({ error: 'Şablon dosyası okunamadı' }, { status: 404 });
    }
  }
}
