import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse, parseIntParam } from '@/lib/apiHelpers';
import { getHouseholdsWithNoAid } from '@/lib/reportHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const days = parseIntParam(req.nextUrl.searchParams.get('days'), 30);
    const data = await getHouseholdsWithNoAid(ds, days);
    return successResponse({ data, total: data.length, days });
  } catch (error) {
    return errorResponse('فشل في جلب تقرير الأسر غير المستفيدة', 500, String(error));
  }
}