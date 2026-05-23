import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { calculateAge } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();

    const rows = await ds.query(
      `SELECT r.*, h.tentNumber as h_tentNumber, h.firstName as h_firstName,
        h.familyName as h_familyName, h.nationalId as h_nationalId
       FROM residents r
       LEFT JOIN residents h ON h.id = r.headOfHouseholdId
       WHERE r.isActive = 1 AND r.hasDisability = 1
       ORDER BY r.familyName ASC`
    ) as any[];

    const data = rows.map((r: any) => ({
      id: r.id,
      nationalId: r.nationalId,
      firstName: r.firstName,
      fatherName: r.fatherName,
      grandfatherName: r.grandfatherName,
      familyName: r.familyName,
      gender: r.gender,
      dateOfBirth: r.dateOfBirth,
      phoneNumber1: r.phoneNumber1,
      tentNumber: r.tentNumber ?? r.h_tentNumber ?? null,
      disabilityType: r.disabilityType,
      headOfHouseholdId: r.headOfHouseholdId,
      age: calculateAge(r.dateOfBirth),
      headOfHousehold: r.h_firstName ? {
        firstName: r.h_firstName,
        familyName: r.h_familyName,
        nationalId: r.h_nationalId,
      } : null,
    }));

    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب تقرير المعاقين', 500, String(error));
  }
}