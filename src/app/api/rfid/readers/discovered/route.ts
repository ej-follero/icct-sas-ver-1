import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'temp');
const DATA_FILE = path.join(DATA_DIR, 'discovered-reader.json');

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function GET() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8').catch(() => '');
    if (!content) {
      return NextResponse.json({ success: true, data: null });
    }
    const data = JSON.parse(content);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to read discovered reader' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDir();
    const body = await req.json();
    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
    await fs.writeFile(DATA_FILE, JSON.stringify({ ...body, _updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to save discovered reader' }, { status: 500 });
  }
}


