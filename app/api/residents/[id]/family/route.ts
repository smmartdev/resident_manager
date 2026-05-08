import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { mapRow } from '@/lib/queryHelpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ds = await getDataSource();

    const heads = (await ds.query(
      'SELECT * FROM residents WHERE id = ?',
      [id]
    )) as any[];

    if (heads.length === 0) {
      return errorResponse('رب الأسرة غير موجود', 404);
    }

    const members = (await ds.query(
      'SELECT * FROM residents WHERE headOfHouseholdId = ?',
      [id]
    )) as any[];

    return successResponse({
      head: mapRow(heads[0]),
      members: members.map(mapRow),
    });
  } catch (error) {
    return errorResponse(
      'فشل في جلب بيانات الأسرة',
      500,
      String(error)
    );
  }
}