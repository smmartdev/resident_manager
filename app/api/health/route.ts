import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';

export async function GET() {
  try {
    const ds = await getDataSource();
    await ds.query('SELECT 1');
    return NextResponse.json({ status: 'ok', message: 'Database connected successfully' });
  } catch (error) {
    return NextResponse.json({ status: 'error', detail: String(error) }, { status: 500 });
  }
}