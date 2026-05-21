import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

// POST: Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, niche, productType, style, language, templateCount, aspectRatio } = body;

    // Validation
    if (!name || !niche || !productType || !style || !templateCount || !aspectRatio) {
      return NextResponse.json(
        { error: 'Missing required project details' },
        { status: 400 }
      );
    }

    const project = await db.createProject({
      name,
      niche,
      productType,
      style,
      language: language || 'en',
      templateCount: Number(templateCount),
      aspectRatio,
      status: 'draft'
    });

    return NextResponse.json({
      success: true,
      project
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
