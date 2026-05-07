import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { getChronicDiseaseResidents } from '@/lib/reportHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const data = await getChronicDiseaseResidents(ds);
    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب تقرير الأمراض المزمنة', 500, String(error));
  }
}