import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { getPregnantResidents } from '@/lib/reportHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const data = await getPregnantResidents(ds);
    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب تقرير الحوامل', 500, String(error));
  }
}