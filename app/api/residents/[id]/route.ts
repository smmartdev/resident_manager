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

    const rows = (await ds.query(
      `SELECT r.*, h.id as h_id, h.firstName as h_firstName,
              h.fatherName as h_fatherName,
              h.familyName as h_familyName,
              h.nationalId as h_nationalId,
              h.tentNumber as h_tentNumber,
              h.phoneNumber1 as h_phoneNumber1
       FROM residents r
       LEFT JOIN residents h ON h.id = r.headOfHouseholdId
       WHERE r.id = ?`,
      [id]
    )) as any[];

    if (rows.length === 0) {
      return errorResponse('المقيم غير موجود', 404);
    }

    const members = (await ds.query(
      'SELECT * FROM residents WHERE headOfHouseholdId = ?',
      [id]
    )) as any[];

    const aidRecords = (await ds.query(
      'SELECT * FROM aid_records WHERE headOfHouseholdId = ? ORDER BY aidDate DESC',
      [id]
    )) as any[];

    return successResponse({
      ...mapRow(rows[0]),
      familyMembers: members,
      aidRecords,
    });
  } catch (error) {
    return errorResponse(
      'فشل في جلب البيانات',
      500,
      String(error)
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ds = await getDataSource();
    const body = await req.json();

    const existing = (await ds.query(
      'SELECT * FROM residents WHERE id = ?',
      [id]
    )) as any[];

    if (existing.length === 0) {
      return errorResponse('المقيم غير موجود', 404);
    }

    if (
      body.nationalId &&
      body.nationalId !== existing[0].nationalId
    ) {
      const dup = (await ds.query(
        'SELECT id FROM residents WHERE nationalId = ? AND id != ?',
        [body.nationalId, id]
      )) as any[];

      if (dup.length > 0) {
        return errorResponse('رقم الهوية مسجل مسبقاً', 409);
      }
    }

    if (body.headOfHouseholdId) {
      const head = (await ds.query(
        'SELECT relationToHead FROM residents WHERE id = ?',
        [body.headOfHouseholdId]
      )) as any[];

      if (
        head.length === 0 ||
        head[0].relationToHead !== 'head'
      ) {
        return errorResponse(
          'المحدد كرب أسرة ليس رب أسرة فعلياً',
          400
        );
      }
    }

    const current = existing[0];

    await ds.query(
      `UPDATE residents
       SET nationalId=?, firstName=?, fatherName=?, grandfatherName=?, familyName=?,
           gender=?, dateOfBirth=?, maritalStatus=?, phoneNumber1=?, phoneNumber2=?,
           relationToHead=?, headOfHouseholdId=?, tentNumber=?, hasChronicDisease=?,
           chronicDiseaseDescription=?, hasDisability=?, disabilityType=?,
           isPregnant=?, isBreastfeeding=?, isActive=?
       WHERE id=?`,
      [
        body.nationalId ?? current.nationalId,
        body.firstName ?? current.firstName,
        body.fatherName ?? current.fatherName,
        body.grandfatherName ?? current.grandfatherName,
        body.familyName ?? current.familyName,
        body.gender ?? current.gender,
        body.dateOfBirth ?? current.dateOfBirth,
        body.maritalStatus ?? current.maritalStatus,
        body.phoneNumber1 ?? current.phoneNumber1,
        body.phoneNumber2 ?? current.phoneNumber2,
        body.relationToHead ?? current.relationToHead,
        body.headOfHouseholdId ?? current.headOfHouseholdId,
        body.tentNumber ?? current.tentNumber,
        body.hasChronicDisease !== undefined
          ? body.hasChronicDisease ? 1 : 0
          : current.hasChronicDisease,
        body.chronicDiseaseDescription ??
          current.chronicDiseaseDescription,
        body.hasDisability !== undefined
          ? body.hasDisability ? 1 : 0
          : current.hasDisability,
        body.disabilityType ?? current.disabilityType,
        body.isPregnant !== undefined
          ? body.isPregnant ? 1 : 0
          : current.isPregnant,
        body.isBreastfeeding !== undefined
          ? body.isBreastfeeding ? 1 : 0
          : current.isBreastfeeding,
        body.isActive !== undefined
          ? body.isActive ? 1 : 0
          : current.isActive,
        id,
      ]
    );

    const updated = (await ds.query(
      'SELECT * FROM residents WHERE id = ?',
      [id]
    )) as any[];

    return successResponse(mapRow(updated[0]));
  } catch (error) {
    return errorResponse(
      'فشل في تحديث البيانات',
      500,
      String(error)
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ds = await getDataSource();

    const existing = (await ds.query(
      'SELECT id FROM residents WHERE id = ?',
      [id]
    )) as any[];

    if (existing.length === 0) {
      return errorResponse('المقيم غير موجود', 404);
    }

    await ds.query(
      'UPDATE residents SET isActive = 0 WHERE id = ?',
      [id]
    );

    return successResponse({
      message: 'تم حذف المقيم بنجاح',
    });
  } catch (error) {
    return errorResponse(
      'فشل في حذف المقيم',
      500,
      String(error)
    );
  }
}