import { NextRequest, NextResponse } from 'next/server';
import { getAllRules, upsertRule, toggleRule, deleteRule } from '@/lib/db';

export async function GET() {
  try {
    const rules = getAllRules();
    return NextResponse.json({ rules });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const rule = upsertRule(body);
    return NextResponse.json({ rule });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, enabled } = await req.json();
    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'id and enabled (boolean) are required' }, { status: 400 });
    }

    toggleRule(id, enabled);
    return NextResponse.json({ success: true, id, enabled });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
    }

    deleteRule(id);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
