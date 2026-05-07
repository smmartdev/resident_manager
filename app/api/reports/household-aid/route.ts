import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse, parseIntParam } from '@/lib/apiHelpers';
import { getHouseholdAidReport } from '@/lib/reportHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const days = parseIntParam(req.nextUrl.searchParams.get('days'), 30);
    const data = await getHouseholdAidReport(ds, days);
    return successResponse({ data, total: data.length, days });
  } catch (error) {
    return errorResponse('فشل في جلب تقرير مساعدات الأسر', 500, String(error));
  }
}