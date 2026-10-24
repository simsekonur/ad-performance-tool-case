import { NextRequest, NextResponse } from 'next/server';
import { executeAgentChat } from '@/lib/agent/engine';
import { ChatMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = (await req.json()) as { message: string; history?: ChatMessage[] };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await executeAgentChat(message, history || []);

    return NextResponse.json({
      answer: response.answer,
      steps: response.steps,
      sqlQuery: response.sqlQuery,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Agent chat route error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
