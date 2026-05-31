import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();

    const widows = await ds.query(
      `SELECT * FROM residents
       WHERE isActive = 1 AND gender = 'female' AND maritalStatus = 'widowed'
       ORDER BY familyName ASC`
    ) as any[];

    const data = await Promise.all(widows.map(async (w: any) => {
      const headId = w.headOfHouseholdId ?? w.id;

      const members = await ds.query(
        `SELECT * FROM residents WHERE (id = ? OR headOfHouseholdId = ?) AND isActive = 1`,
        [headId, headId]
      ) as any[];

      const notes: string[] = [];
      for (const m of members) {
        if (m.hasDisability === 1 || m.hasDisability === true)
          notes.push(`معاق: ${m.firstName} ${m.familyName}`);
        if (m.isBreastfeeding === 1 || m.isBreastfeeding === true)
          notes.push(`مرضع: ${m.firstName} ${m.familyName}`);
        if (m.isMartyr === 1 || m.isMartyr === true)
          notes.push(`شهيد: ${m.firstName} ${m.familyName}`);
      }

      return {
        id: w.id,
        nationalId: w.nationalId,
        firstName: w.firstName,
        fatherName: w.fatherName,
        grandfatherName: w.grandfatherName,
        familyName: w.familyName,
        phoneNumber1: w.phoneNumber1,
        tentNumber: w.tentNumber,
        notes: notes.join(' | '),
      };
    }));

    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب بيانات الأرامل', 500, String(error));
  }
}