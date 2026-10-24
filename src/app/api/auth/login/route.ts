import { NextRequest, NextResponse } from 'next/server';
import { DEMO_CREDENTIALS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      const response = NextResponse.json({ success: true, user: { username } });
      response.cookies.set('livensa_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
