import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/auth';
import { originOf } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

async function out(req) {
  const res = NextResponse.redirect(`${originOf(req)}/`);
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
export async function GET(req) { return out(req); }
export async function POST(req) { return out(req); }
