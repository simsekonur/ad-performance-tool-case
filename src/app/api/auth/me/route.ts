import { NextRequest, NextResponse } from 'next/server';
import { DEMO_CREDENTIALS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get('livensa_auth');

  if (authCookie && authCookie.value === 'authenticated') {
    return NextResponse.json({ authenticated: true, user: { username: DEMO_CREDENTIALS.username } });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
