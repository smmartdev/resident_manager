import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { getChildrenUnder } from '@/lib/reportHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const data = await getChildrenUnder(ds, 5);
    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب تقرير الأطفال دون خمس سنوات', 500, String(error));
  }
}