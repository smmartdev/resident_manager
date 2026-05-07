import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { mapRow } from '@/lib/queryHelpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ds = await getDataSource();

    const rows = await ds.query(
      `SELECT r.*, h.id as h_id, h.firstName as h_firstName, h.fatherName as h_fatherName,
        h.familyName as h_familyName, h.nationalId as h_nationalId,
        h.tentNumber as h_tentNumber, h.phoneNumber1 as h_phoneNumber1
       FROM residents r
       LEFT JOIN residents h ON h.id = r.headOfHouseholdId
       WHERE r.id = ?`, [id]
    );
    if (!rows.length) return errorResponse('المقيم غير موجود', 404);

    const resident = mapRow(rows[0]);
    const headId = resident.headOfHouseholdId ?? resident.id;

    const [members, aidRecords] = await Promise.all([
      ds.query('SELECT * FROM residents WHERE headOfHouseholdId = ?', [id]),
      ds.query('SELECT * FROM aid_records WHERE headOfHouseholdId = ? ORDER BY aidDate DESC', [headId]),
    ]);

    const lastAidByType: Record<string, any> = {};
    for (const record of aidRecords) {
      if (!lastAidByType[record.aidType]) lastAidByType[record.aidType] = record;
    }

    return successResponse({
      ...resident,
      familyMembers: members,
      aidRecords,
      lastAidByType,
      familySize: members.length + 1,
    });
  } catch (error) {
    return errorResponse('فشل في جلب ملخص المقيم', 500, String(error));
  }
}