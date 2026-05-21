import { NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';

// GET: Fetch all projects
export async function GET() {
  try {
    const projects = await db.getProjects();
    return NextResponse.json({
      success: true,
      projects
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
