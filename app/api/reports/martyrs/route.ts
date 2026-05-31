import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { RELATION_LABELS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();

    const rows = await ds.query(
      `SELECT r.id, r.nationalId, r.firstName, r.fatherName, r.grandfatherName,
        r.familyName, r.phoneNumber1, r.relationToHead, r.headOfHouseholdId,
        h.firstName as h_firstName, h.fatherName as h_fatherName,
        h.familyName as h_familyName, h.nationalId as h_nationalId
       FROM residents r
       LEFT JOIN residents h ON h.id = r.headOfHouseholdId
       WHERE r.isMartyr = 1
       ORDER BY r.familyName ASC`
    ) as any[];

    const data = rows.map((r: any) => ({
      id: r.id,
      nationalId: r.nationalId,
      firstName: r.firstName,
      fatherName: r.fatherName,
      grandfatherName: r.grandfatherName,
      familyName: r.familyName,
      phoneNumber1: r.phoneNumber1,
      relationToHead: r.relationToHead,
      headOfHouseholdId: r.headOfHouseholdId,
      headName: r.h_firstName
        ? `${r.h_firstName} ${r.h_fatherName} ${r.h_familyName}`
        : '—',
      headNationalId: r.h_nationalId ?? '—',
    }));

    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب بيانات الشهداء', 500, String(error));
  }
}